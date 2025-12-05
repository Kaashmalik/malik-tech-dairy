import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { vaccinationSchedules, animals, vaccinationSchedulesRelations } from '@/db/schema';
import { eq, and, ilike, desc, gte, lte, isNull, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';

// Validation schemas
const vaccinationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  animalId: z.string().optional(),
  status: z.enum(['scheduled', 'administered', 'overdue', 'skipped', 'reaction_recorded']).optional(),
  vaccineType: z.enum(['live_attenuated', 'inactivated', 'subunit', 'toxoid', 'conjugate', 'mrna']).optional(),
  scheduledDate: z.string().datetime().optional(),
  nextDueDate: z.string().datetime().optional(),
  herdWide: z.coerce.boolean().optional(), // Filter for herd-wide vs individual vaccinations
});

const createVaccinationSchema = z.object({
  animalIds: z.array(z.string()).optional(), // For individual vaccinations
  vaccineName: z.string().min(2),
  vaccineType: z.enum(['live_attenuated', 'inactivated', 'subunit', 'toxoid', 'conjugate', 'mrna']),
  targetDiseases: z.array(z.string()).min(1),
  scheduledDate: z.string().datetime(),
  manufacturer: z.string().min(2),
  batchNumber: z.string().min(2),
  expiryDate: z.string().datetime(),
  notes: z.string().optional(),
});

const updateVaccinationSchema = z.object({
  vaccineName: z.string().min(2).optional(),
  vaccineType: z.enum(['live_attenuated', 'inactivated', 'subunit', 'toxoid', 'conjugate', 'mrna']).optional(),
  targetDiseases: z.array(z.string()).min(1).optional(),
  scheduledDate: z.string().datetime().optional(),
  administeredDate: z.string().datetime().optional(),
  nextDueDate: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'administered', 'overdue', 'skipped', 'reaction_recorded']).optional(),
  administeredBy: z.string().min(2).optional(),
  batchNumber: z.string().min(2).optional(),
  expiryDate: z.string().datetime().optional(),
  manufacturer: z.string().min(2).optional(),
  adverseReactions: z.string().optional(),
  certificateUrl: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/veterinary/vaccinations - List vaccination schedules
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();

    const { searchParams } = new URL(request.url);
    const query = vaccinationQuerySchema.parse(Object.fromEntries(searchParams));

    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;

    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    const whereConditions = [eq(vaccinationSchedules.tenantId, tenantContext.tenantId)];

    if (query.animalId) {
      whereConditions.push(eq(vaccinationSchedules.animalId, query.animalId));
    }

    if (query.status) {
      whereConditions.push(eq(vaccinationSchedules.status, query.status));
    }

    if (query.vaccineType) {
      whereConditions.push(eq(vaccinationSchedules.vaccineType, query.vaccineType));
    }

    if (query.herdWide === true) {
      whereConditions.push(isNull(vaccinationSchedules.animalId));
    } else if (query.herdWide === false) {
      whereConditions.push(eq(vaccinationSchedules.animalId, vaccinationSchedules.animalId));
    }

    if (query.scheduledDate) {
      whereConditions.push(gte(vaccinationSchedules.scheduledDate, new Date(query.scheduledDate)));
    }

    if (query.nextDueDate) {
      whereConditions.push(lte(vaccinationSchedules.nextDueDate, new Date(query.nextDueDate)));
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(vaccinationSchedules)
      .where(and(...whereConditions));

    const total = totalCountResult[0]?.count || 0;

    // Get vaccination schedules with relations
    const vaccinationsList = await db
      .select({
        // Vaccination schedule fields
        id: vaccinationSchedules.id,
        tenantId: vaccinationSchedules.tenantId,
        animalId: vaccinationSchedules.animalId,
        vaccineName: vaccinationSchedules.vaccineName,
        vaccineType: vaccinationSchedules.vaccineType,
        targetDiseases: vaccinationSchedules.targetDiseases,
        scheduledDate: vaccinationSchedules.scheduledDate,
        administeredDate: vaccinationSchedules.administeredDate,
        nextDueDate: vaccinationSchedules.nextDueDate,
        status: vaccinationSchedules.status,
        administeredBy: vaccinationSchedules.administeredBy,
        batchNumber: vaccinationSchedules.batchNumber,
        expiryDate: vaccinationSchedules.expiryDate,
        manufacturer: vaccinationSchedules.manufacturer,
        adverseReactions: vaccinationSchedules.adverseReactions,
        certificateUrl: vaccinationSchedules.certificateUrl,
        notes: vaccinationSchedules.notes,
        createdAt: vaccinationSchedules.createdAt,
        updatedAt: vaccinationSchedules.updatedAt,
        // Related animal data
        animal: {
          id: animals.id,
          tag: animals.tag,
          name: animals.name,
          breed: animals.breed,
          dateOfBirth: animals.dateOfBirth,
        },
      })
      .from(vaccinationSchedules)
      .leftJoin(animals, eq(vaccinationSchedules.animalId, animals.id))
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(desc(vaccinationSchedules.scheduledDate));

    return NextResponse.json({
      success: true,
      data: {
        vaccinations: vaccinationsList,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching vaccination schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/veterinary/vaccinations - Create new vaccination schedule(s)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createVaccinationSchema.parse(body);

    const db = getDrizzle();
    const vaccinationId = `vaccination_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get tenant context
    const tenantContext = await getTenantContext();

    // Create vaccination records
    const vaccinationRecords = [];
    
    if (validatedData.animalIds && validatedData.animalIds.length > 0) {
      // Individual vaccinations for each animal
      for (const animalId of validatedData.animalIds) {
        const newVaccination = await db
          .insert(vaccinationSchedules)
          .values({
            id: `${vaccinationId}_${animalId}`,
            tenantId: tenantContext.tenantId,
            animalId,
            ...validatedData,
            createdBy: tenantContext.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        vaccinationRecords.push(newVaccination[0]);
      }
    } else {
      // Single herd-wide vaccination
      const newVaccination = await db
        .insert(vaccinationSchedules)
        .values({
          id: vaccinationId,
          tenantId: tenantContext.tenantId,
          ...validatedData,
          createdBy: tenantContext.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      vaccinationRecords.push(newVaccination[0]);
    }

    return NextResponse.json({
      success: true,
      data: vaccinationRecords,
      message: `Created ${vaccinationRecords.length} vaccination schedule(s) successfully`,
    });
  } catch (error) {
    console.error('Error creating vaccination schedule:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
