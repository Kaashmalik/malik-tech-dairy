import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTenantContext, TenantAccessError } from '@/lib/tenant/context';
import { z } from 'zod';
import { withRateLimit, standardRateLimit } from '@/lib/ratelimit';
import { AnimalService } from '@/lib/services/animals/animal.service';

export const dynamic = 'force-dynamic';

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
  gender: z.string().optional(),
  breed: z.string().optional(),
  search: z.string().optional(),
});

const createAnimalSchema = z.object({
  tag: z.string().min(1, 'Tag is required').max(50),
  name: z.string().max(100).optional(),
  species: z.enum([
    'cow',
    'buffalo',
    'cattle',
    'goat',
    'sheep',
    'chicken',
    'horse',
    'poultry',
    'other',
  ]),
  breed: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']),
  photoUrl: z.string().optional(),
  status: z.enum(['active', 'sold', 'deceased', 'quarantine']).default('active'),
  weight: z.number().min(0).max(2500).optional(),
  color: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  motherId: z.string().optional(),
  fatherId: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
});

// GET /api/animals - List all animals for the tenant
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, standardRateLimit);
  if (rateLimitResponse) return rateLimitResponse;

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

    const result = await AnimalService.listAnimals(tenantContext, query);

    return NextResponse.json({
      success: true,
      data: {
        animals: result.items,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    if (error instanceof TenantAccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching animals:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/animals - Register a new animal
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

    const created = await AnimalService.createAnimal(tenantContext, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: { animal: created },
        message: 'Animal created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof TenantAccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    const message = error.message || '';
    if (message.startsWith('PLAN_LIMIT_REACHED')) {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    if (message.startsWith('SPECIES_NOT_ALLOWED')) {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    if (message.startsWith('DUPLICATE_TAG')) {
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }

    console.error('Error creating animal:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
