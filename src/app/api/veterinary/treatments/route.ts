import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import {
  treatmentRecords,
  diseases,
  animals,
  tenants,
  treatmentRecordsRelations,
} from '@/db/schema';
import { eq, and, ilike, desc, gte, lte, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
// Validation schemas
const treatmentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  animalId: z.string().optional(),
  diseaseId: z.string().optional(),
  outcome: z
    .enum(['pending', 'recovering', 'recovered', 'chronic', 'deceased', 'euthanized'])
    .optional(),
  veterinarianName: z.string().optional(),
  status: z.enum(['active', 'completed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
const createTreatmentRecordSchema = z.object({
  animalId: z.string().min(1),
  diseaseId: z.string().min(1),
  symptomsObserved: z.array(z.string()).min(1),
  diagnosis: z.string().min(5),
  treatmentGiven: z
    .array(
      z.object({
        medication: z.string(),
        dosage: z.string(),
        duration: z.string(),
        administrationRoute: z.string(),
      })
    )
    .min(1),
  medications: z
    .array(
      z.object({
        medicationName: z.string(),
        dosage: z.string(),
        administeredAt: z.string(),
        administeredBy: z.string(),
        batchNumber: z.string().optional(),
        expiryDate: z.string().optional(),
      })
    )
    .min(1),
  veterinarianName: z.string().min(2),
  veterinarianLicense: z.string().optional(),
  cost: z.number().min(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().datetime().optional(),
});
// GET /api/veterinary/treatments - List treatment records with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = treatmentQuerySchema.parse(Object.fromEntries(searchParams));
    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;
    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    const whereConditions = [eq(treatmentRecords.tenantId, tenantContext.tenantId)];
    if (query.animalId) {
      whereConditions.push(eq(treatmentRecords.animalId, query.animalId));
    }
    if (query.diseaseId) {
      whereConditions.push(eq(treatmentRecords.diseaseId, query.diseaseId));
    }
    if (query.outcome) {
      whereConditions.push(eq(treatmentRecords.outcome, query.outcome));
    }
    if (query.veterinarianName) {
      whereConditions.push(ilike(treatmentRecords.veterinarianName, `%${query.veterinarianName}%`));
    }
    if (query.status === 'active') {
      whereConditions.push(eq(treatmentRecords.outcome, 'pending'));
    } else if (query.status === 'completed') {
      whereConditions.push(
        inArray(treatmentRecords.outcome, ['recovered', 'chronic', 'deceased', 'euthanized'])
      );
    }
    if (query.startDate) {
      whereConditions.push(gte(treatmentRecords.startDate, new Date(query.startDate)));
    }
    if (query.endDate) {
      whereConditions.push(lte(treatmentRecords.startDate, new Date(query.endDate)));
    }
    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(treatmentRecords)
      .where(and(...whereConditions));
    const total = totalCountResult[0]?.count || 0;
    // Get treatment records with relations
    const treatmentsList = await db
      .select({
        // Treatment record fields
        id: treatmentRecords.id,
        tenantId: treatmentRecords.tenantId,
        animalId: treatmentRecords.animalId,
        diseaseId: treatmentRecords.diseaseId,
        symptomsObserved: treatmentRecords.symptomsObserved,
        diagnosis: treatmentRecords.diagnosis,
        treatmentGiven: treatmentRecords.treatmentGiven,
        medications: treatmentRecords.medications,
        veterinarianName: treatmentRecords.veterinarianName,
        veterinarianLicense: treatmentRecords.veterinarianLicense,
        cost: treatmentRecords.cost,
        startDate: treatmentRecords.startDate,
        endDate: treatmentRecords.endDate,
        outcome: treatmentRecords.outcome,
        notes: treatmentRecords.notes,
        followUpRequired: treatmentRecords.followUpRequired,
        followUpDate: treatmentRecords.followUpDate,
        recoveryPercentage: treatmentRecords.recoveryPercentage,
        createdAt: treatmentRecords.createdAt,
        updatedAt: treatmentRecords.updatedAt,
        // Related data
        disease: {
          id: diseases.id,
          nameEn: diseases.nameEn,
          nameUr: diseases.nameUr,
          category: diseases.category,
          severity: diseases.severity,
        },
        animal: {
          id: animals.id,
          tagNumber: animals.tagNumber,
          name: animals.name,
          breed: animals.breed,
          dateOfBirth: animals.dateOfBirth,
        },
      })
      .from(treatmentRecords)
      .leftJoin(diseases, eq(treatmentRecords.diseaseId, diseases.id))
      .leftJoin(animals, eq(treatmentRecords.animalId, animals.id))
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(desc(treatmentRecords.startDate));
    return NextResponse.json({
      success: true,
      data: {
        treatments: treatmentsList,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/veterinary/treatments - Create new treatment record
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = createTreatmentRecordSchema.parse(body);
    const db = getDrizzle();
    const treatmentId = `treatment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Verify animal exists and user has access
    const animal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, validatedData.animalId))
      .limit(1);
    if (!animal.length) {
      return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
    }
    // Verify disease exists
    const disease = await db
      .select()
      .from(diseases)
      .where(eq(diseases.id, validatedData.diseaseId))
      .limit(1);
    if (!disease.length) {
      return NextResponse.json({ success: false, error: 'Disease not found' }, { status: 404 });
    }
    // Get tenant context
    const tenantContext = await getTenantContext();
    const newTreatment = await db
      .insert(treatmentRecords)
      .values({
        id: treatmentId,
        tenantId: tenantContext.tenantId,
        ...validatedData,
        createdBy: tenantContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return NextResponse.json({
      success: true,
      data: newTreatment[0],
      message: 'Treatment record created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}