// API Route: List & Create Animals (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { getTenantLimitsFromSupabase, getAnimalCount } from '@/lib/supabase/limits';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { createAnimalSchema } from '@/lib/validations/animals';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET: List all animals for tenant
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();

      const { data: animals, error } = (await supabase
        .from('animals')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: false })) as { data: any[] | null; error: any };

      if (error) {
        console.error('Error fetching animals:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch animals', animals: [] },
          { status: 500 }
        );
      }

      // Transform snake_case to camelCase for frontend
      const transformedAnimals = (animals || []).map((animal: any) => ({
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
        purchaseDate: animal.purchase_date,
        purchasePrice: animal.purchase_price,
        currentWeight: animal.current_weight,
        lastHealthCheck: animal.last_health_check,
        parentId: animal.parent_id,
        notes: animal.notes,
        customFields: animal.custom_fields,
        createdAt: animal.created_at,
        updatedAt: animal.updated_at,
      }));

      return NextResponse.json({
        success: true,
        animals: transformedAnimals,
      });
    } catch (error) {
      console.error('Error fetching animals:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error', animals: [] },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create new animal
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();

      // Check limits using Supabase
      const [limits, currentCount] = await Promise.all([
        getTenantLimitsFromSupabase(context.tenantId),
        getAnimalCount(context.tenantId),
      ]);

      const maxAnimals = limits?.maxAnimals ?? 5;
      const isUnlimited = maxAnimals === -1;

      if (!isUnlimited && currentCount >= maxAnimals) {
        // Find the plan name for better error message
        let planName = 'Free';
        for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
          if (plan.maxAnimals === maxAnimals) {
            planName = plan.name;
            break;
          }
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Animal limit reached',
            message: `You have reached the maximum of ${maxAnimals} animals on your ${planName} plan. Please upgrade to add more animals.`,
            currentCount,
            maxAnimals,
            upgradeUrl: '/pricing',
          },
          { status: 403 }
        );
      }

      const body = await req.json();

      // Validate with Zod
      let validated;
      try {
        validated = createAnimalSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      const {
        tag,
        name,
        species,
        breed,
        dateOfBirth,
        gender,
        photoUrl,
        purchaseDate,
        purchasePrice,
        status,
      } = validated;

      // Check if tag already exists
      const { data: existingAnimal } = (await supabase
        .from('animals')
        .select('id')
        .eq('tenant_id', context.tenantId)
        .eq('tag', tag)
        .single()) as { data: any };

      if (existingAnimal) {
        return NextResponse.json(
          { success: false, error: 'Animal with this tag already exists' },
          { status: 409 }
        );
      }

      const now = new Date().toISOString();
      const animalId = uuidv4();

      const animalData = {
        id: animalId,
        tenant_id: context.tenantId,
        tag,
        name: name || '',
        species,
        breed: breed || '',
        date_of_birth: dateOfBirth || null,
        gender,
        photo_url: photoUrl || null,
        status: status || 'active',
        purchase_date: purchaseDate || null,
        purchase_price: purchasePrice || null,
        created_at: now,
        updated_at: now,
      };

      const { data: newAnimal, error } = (await supabase
        .from('animals')
        .insert(animalData)
        .select()
        .single()) as { data: any; error: any };

      if (error) {
        console.error('Error creating animal:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create animal', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Animal created successfully',
        animal: {
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
          purchaseDate: newAnimal.purchase_date,
          purchasePrice: newAnimal.purchase_price,
          createdAt: newAnimal.created_at,
          updatedAt: newAnimal.updated_at,
        },
      });
    } catch (error) {
      console.error('Error creating animal:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
