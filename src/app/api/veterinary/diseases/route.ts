import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { diseases, diseasesRelations } from '@/db/schema';
import { eq, and, ilike, inArray, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';

// Validation schemas
const diseaseQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.enum(['metabolic', 'infectious', 'reproductive', 'nutritional', 'parasitic', 'respiratory', 'digestive', 'musculoskeletal']).optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
  animalType: z.string().optional(),
  zoonoticRisk: z.coerce.boolean().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
});

const createDiseaseSchema = z.object({
  category: z.enum(['metabolic', 'infectious', 'reproductive', 'nutritional', 'parasitic', 'respiratory', 'digestive', 'musculoskeletal']),
  nameEn: z.string().min(2).max(255),
  nameUr: z.string().min(2).max(255).optional(),
  symptoms: z.array(z.string()).min(1),
  diagnosisMethods: z.array(z.string()).min(1),
  treatmentProtocols: z.array(z.object({
    medication: z.string(),
    dosage: z.string(),
    duration: z.string(),
    administrationRoute: z.string(),
    veterinaryRequired: z.boolean(),
  })).min(1),
  preventionTips: z.array(z.string()).min(1),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']),
  zoonoticRisk: z.boolean().default(false),
  estimatedCostMin: z.number().min(0).default(0),
  estimatedCostMax: z.number().min(0).default(0),
  commonInAnimalTypes: z.array(z.string()).default(['cow', 'buffalo']),
  seasonalPrevalence: z.array(z.object({
    season: z.string(),
    prevalence: z.string(),
    riskFactors: z.array(z.string()),
  })).default([]),
});

// GET /api/veterinary/diseases - List diseases with filtering and pagination
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
    const query = diseaseQuerySchema.parse(Object.fromEntries(searchParams));

    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;

    // Build where conditions
    const whereConditions = [eq(diseases.isActive, query.isActive)];

    if (query.category) {
      whereConditions.push(eq(diseases.category, query.category));
    }

    if (query.severity) {
      whereConditions.push(eq(diseases.severity, query.severity));
    }

    if (query.zoonoticRisk !== undefined) {
      whereConditions.push(eq(diseases.zoonoticRisk, query.zoonoticRisk));
    }

    if (query.search) {
      whereConditions.push(
        ilike(diseases.nameEn, `%${query.search}%`)
      );
    }

    if (query.animalType) {
      whereConditions.push(
        // Check if animalType is in the commonInAnimalTypes array
        sql`${query.animalType} = ANY(${diseases.commonInAnimalTypes})`
      );
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(diseases)
      .where(and(...whereConditions));

    const total = totalCountResult[0]?.count || 0;

    // Get diseases
    const diseasesList = await db
      .select()
      .from(diseases)
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(diseases.nameEn);

    return NextResponse.json({
      success: true,
      data: {
        diseases: diseasesList,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching diseases:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/veterinary/diseases - Create new disease (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // const userRole = await getUserRole(userId);
    // if (userRole !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Insufficient permissions' },
    //     { status: 403 }
    //   );
    // }

    const body = await request.json();
    const validatedData = createDiseaseSchema.parse(body);

    // Get tenant context
    const tenantContext = await getTenantContext();
    
    const db = getDrizzle();
    const diseaseId = `disease_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newDisease = await db
      .insert(diseases)
      .values({
        id: diseaseId,
        ...validatedData,
        tenantId: tenantContext.tenantId,
        createdBy: tenantContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newDisease[0],
      message: 'Disease created successfully',
    });
  } catch (error) {
    console.error('Error creating disease:', error);
    
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
