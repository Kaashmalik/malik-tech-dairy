import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant/context';
import { z } from 'zod';
import { AnimalSpecies } from '@/types';

export const dynamic = 'force-dynamic';

// Query schema for listing animals
const animalQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 50)),
  species: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

// Create animal schema
const createAnimalSchema = z.object({
  tag: z.string().min(1, 'Tag is required'),
  name: z.string().optional(),
  species: z.enum(['cattle', 'buffalo', 'goat', 'sheep', 'poultry', 'other']),
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']),
  photoUrl: z.string().optional(),
  status: z.enum(['active', 'sold', 'deceased', 'quarantine']).default('active'),
  weight: z.number().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/animals - List all animals for the tenant
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = animalQuerySchema.parse(Object.fromEntries(searchParams));
    const { page, limit, species, status, search } = query;

    const supabase = getSupabaseClient();
    let supabaseQuery = supabase
      .from('animals')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantContext.tenantId);

    // Apply filters
    if (species) {
      supabaseQuery = supabaseQuery.eq('species', species);
    }
    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }
    if (search) {
      supabaseQuery = supabaseQuery.or(`tag.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supabaseQuery = supabaseQuery.order('created_at', { ascending: false }).range(from, to);

    const { data: animals, count, error } = await supabaseQuery;

    if (error) {
      console.error('Database error fetching animals:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch animals' },
        { status: 500 }
      );
    }

    // Transform snake_case to camelCase for frontend
    const transformedAnimals = (animals || []).map(animal => ({
      id: animal.id,
      tenantId: animal.tenant_id,
      tag: animal.tag,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      dateOfBirth: animal.date_of_birth,
      gender: animal.gender,
      photoUrl: animal.photo_url,
      status: animal.status,
      weight: animal.weight,
      color: animal.color,
      notes: animal.notes,
      createdAt: animal.created_at,
      updatedAt: animal.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        animals: transformedAnimals,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching animals:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/animals - Create a new animal
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createAnimalSchema.parse(body);

    // Enforce Subscription Limits
    const { SubscriptionService } = await import('@/lib/subscriptions/management');
    const subscriptionService = new SubscriptionService(tenantContext.tenantId);

    // Check main animal limit
    const allowed = await subscriptionService.checkLimit('animals');
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan limit reached. Please upgrade to add more animals.',
        },
        { status: 403 }
      );
    }

    // Check species restriction
    const speciesAllowed = await subscriptionService.isSpeciesAllowed(
      validatedData.species as AnimalSpecies
    );
    if (!speciesAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `The species '${validatedData.species}' is not available on your current plan.`,
        },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    // Check for duplicate tag within tenant
    const { data: existingAnimal } = await supabase
      .from('animals')
      .select('id')
      .eq('tenant_id', tenantContext.tenantId)
      .eq('tag', validatedData.tag)
      .single();

    if (existingAnimal) {
      return NextResponse.json(
        { success: false, error: 'An animal with this tag already exists' },
        { status: 400 }
      );
    }

    // Insert new animal
    const { data: newAnimal, error } = await supabase
      .from('animals')
      .insert({
        tenant_id: tenantContext.tenantId,
        tag: validatedData.tag,
        name: validatedData.name || null,
        species: validatedData.species,
        breed: validatedData.breed || null,
        date_of_birth: validatedData.dateOfBirth || null,
        gender: validatedData.gender,
        photo_url: validatedData.photoUrl || null,
        status: validatedData.status,
        weight: validatedData.weight || null,
        color: validatedData.color || null,
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating animal:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create animal' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedAnimal = {
      id: newAnimal.id,
      tenantId: newAnimal.tenant_id,
      tag: newAnimal.tag,
      name: newAnimal.name,
      species: newAnimal.species,
      breed: newAnimal.breed,
      dateOfBirth: newAnimal.date_of_birth,
      gender: newAnimal.gender,
      photoUrl: newAnimal.photo_url,
      status: newAnimal.status,
      weight: newAnimal.weight,
      color: newAnimal.color,
      notes: newAnimal.notes,
      createdAt: newAnimal.created_at,
      updatedAt: newAnimal.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: { animal: transformedAnimal },
        message: 'Animal created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating animal:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
