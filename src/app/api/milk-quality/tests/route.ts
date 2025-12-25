import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { milkQualityTests, milkLogs, animals, milkQualityTestsRelations } from '@/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
// Validation schemas
const milkQualityQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  animalId: z.string().optional(),
  milkLogId: z.string().optional(),
  grade: z.enum(['premium', 'grade_a', 'grade_b', 'grade_c', 'rejected']).optional(),
  status: z.enum(['pending', 'passed', 'failed', 'requires_retest']).optional(),
  testDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  testedBy: z.string().optional(),
  adulterationTest: z.coerce.boolean().optional(),
});
const createMilkQualityTestSchema = z.object({
  milkLogId: z.string().optional(),
  animalId: z.string().optional(),
  testDate: z.string().datetime(),
  fatPercentage: z.number().min(0).max(100).optional(),
  proteinPercentage: z.number().min(0).max(100).optional(),
  snfPercentage: z.number().min(0).max(100).optional(),
  lactosePercentage: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-10).max(50).optional(), // Celsius
  phLevel: z.number().min(0).max(14).optional(),
  conductivity: z.number().min(0).optional(), // microSiemens
  adulterationTest: z.boolean().default(false),
  adulterationType: z.string().optional(),
  labName: z.string().max(255).optional(),
  notes: z.string().optional(),
});
const updateMilkQualityTestSchema = z.object({
  fatPercentage: z.number().min(0).max(100).optional(),
  proteinPercentage: z.number().min(0).max(100).optional(),
  snfPercentage: z.number().min(0).max(100).optional(),
  lactosePercentage: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-10).max(50).optional(),
  phLevel: z.number().min(0).max(14).optional(),
  conductivity: z.number().min(0).optional(),
  adulterationTest: z.boolean().optional(),
  adulterationType: z.string().optional(),
  grade: z.enum(['premium', 'grade_a', 'grade_b', 'grade_c', 'rejected']).optional(),
  status: z.enum(['pending', 'passed', 'failed', 'requires_retest']).optional(),
  labName: z.string().max(255).optional(),
  certificateUrl: z.string().optional(),
  notes: z.string().optional(),
});
// GET /api/milk-quality/tests - List milk quality tests
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = milkQualityQuerySchema.parse(Object.fromEntries(searchParams));
    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;
    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    const whereConditions = [eq(milkQualityTests.tenantId, tenantContext.tenantId)];
    if (query.animalId) {
      whereConditions.push(eq(milkQualityTests.animalId, query.animalId));
    }
    if (query.milkLogId) {
      whereConditions.push(eq(milkQualityTests.milkLogId, query.milkLogId));
    }
    if (query.grade) {
      whereConditions.push(eq(milkQualityTests.grade, query.grade));
    }
    if (query.status) {
      whereConditions.push(eq(milkQualityTests.status, query.status));
    }
    if (query.testedBy) {
      whereConditions.push(eq(milkQualityTests.testedBy, query.testedBy));
    }
    if (query.adulterationTest !== undefined) {
      whereConditions.push(eq(milkQualityTests.adulterationTest, query.adulterationTest));
    }
    if (query.testDate) {
      whereConditions.push(gte(milkQualityTests.testDate, new Date(query.testDate)));
    }
    if (query.startDate) {
      whereConditions.push(gte(milkQualityTests.testDate, new Date(query.startDate)));
    }
    if (query.endDate) {
      whereConditions.push(lte(milkQualityTests.testDate, new Date(query.endDate)));
    }
    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(milkQualityTests)
      .where(and(...whereConditions));
    const total = totalCountResult[0]?.count || 0;
    // Get milk quality tests with relations
    const qualityTestsList = await db
      .select({
        // Test fields
        id: milkQualityTests.id,
        tenantId: milkQualityTests.tenantId,
        milkLogId: milkQualityTests.milkLogId,
        animalId: milkQualityTests.animalId,
        testDate: milkQualityTests.testDate,
        fatPercentage: milkQualityTests.fatPercentage,
        proteinPercentage: milkQualityTests.proteinPercentage,
        snfPercentage: milkQualityTests.snfPercentage,
        lactosePercentage: milkQualityTests.lactosePercentage,
        temperature: milkQualityTests.temperature,
        phLevel: milkQualityTests.phLevel,
        conductivity: milkQualityTests.conductivity,
        adulterationTest: milkQualityTests.adulterationTest,
        adulterationType: milkQualityTests.adulterationType,
        grade: milkQualityTests.grade,
        status: milkQualityTests.status,
        testedBy: milkQualityTests.testedBy,
        labName: milkQualityTests.labName,
        certificateUrl: milkQualityTests.certificateUrl,
        notes: milkQualityTests.notes,
        createdAt: milkQualityTests.createdAt,
        updatedAt: milkQualityTests.updatedAt,
        // Related milk log data
        milkLog: {
          id: milkLogs.id,
          date: milkLogs.date,
          session: milkLogs.session,
          quantity: milkLogs.quantity,
        },
        // Related animal data
        animal: {
          id: animals.id,
          tag: animals.tag,
          name: animals.name,
          breed: animals.breed,
        },
      })
      .from(milkQualityTests)
      .leftJoin(milkLogs, eq(milkQualityTests.milkLogId, milkLogs.id))
      .leftJoin(animals, eq(milkQualityTests.animalId, animals.id))
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(desc(milkQualityTests.testDate));
    // Calculate quality metrics for each test
    const testsWithMetrics = qualityTestsList.map(test => {
      // Convert stored integer values back to percentages for display
      const fatPercentage = test.fatPercentage ? test.fatPercentage / 100 : null;
      const proteinPercentage = test.proteinPercentage ? test.proteinPercentage / 100 : null;
      const snfPercentage = test.snfPercentage ? test.snfPercentage / 100 : null;
      const lactosePercentage = test.lactosePercentage ? test.lactosePercentage / 100 : null;
      const temperature = test.temperature ? test.temperature / 10 : null;
      const phLevel = test.phLevel ? test.phLevel / 100 : null;
      // Calculate quality score (0-100)
      let qualityScore = 0;
      let factors = 0;
      if (fatPercentage !== null) {
        qualityScore += Math.min(fatPercentage * 20, 20); // Max 20 points for fat
        factors++;
      }
      if (proteinPercentage !== null) {
        qualityScore += Math.min(proteinPercentage * 30, 30); // Max 30 points for protein
        factors++;
      }
      if (snfPercentage !== null) {
        qualityScore += Math.min(snfPercentage * 15, 15); // Max 15 points for SNF
        factors++;
      }
      if (phLevel !== null && phLevel >= 6.5 && phLevel <= 6.8) {
        qualityScore += 20; // 20 points for optimal pH
        factors++;
      }
      if (!test.adulterationTest) {
        qualityScore += 15; // 15 points for no adulteration
        factors++;
      }
      const finalScore = factors > 0 ? Math.round(qualityScore) : null;
      // Determine if test meets premium standards
      const meetsPremiumStandards =
        fatPercentage !== null &&
        fatPercentage >= 3.5 &&
        proteinPercentage !== null &&
        proteinPercentage >= 3.2 &&
        snfPercentage !== null &&
        snfPercentage >= 8.5 &&
        !test.adulterationTest &&
        test.status === 'passed';
      return {
        ...test,
        fatPercentage,
        proteinPercentage,
        snfPercentage,
        lactosePercentage,
        temperature,
        phLevel,
        qualityScore: finalScore,
        meetsPremiumStandards,
        daysSinceTest: Math.floor(
          (new Date().getTime() - new Date(test.testDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    });
    return NextResponse.json({
      success: true,
      data: {
        tests: testsWithMetrics,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        summary: {
          totalTests: qualityTestsList.length,
          passedTests: qualityTestsList.filter(t => t.status === 'passed').length,
          failedTests: qualityTestsList.filter(t => t.status === 'failed').length,
          pendingTests: qualityTestsList.filter(t => t.status === 'pending').length,
          premiumGrade: qualityTestsList.filter(t => t.grade === 'premium').length,
          adulterationDetected: qualityTestsList.filter(t => t.adulterationTest).length,
          averageQualityScore:
            testsWithMetrics.reduce((sum, t) => sum + (t.qualityScore || 0), 0) /
            (testsWithMetrics.filter(t => t.qualityScore !== null).length || 1),
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/milk-quality/tests - Create new milk quality test
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = createMilkQualityTestSchema.parse(body);
    const db = getDrizzle();
    const testId = `quality_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Verify animal exists if provided
    if (validatedData.animalId) {
      const animal = await db
        .select()
        .from(animals)
        .where(eq(animals.id, validatedData.animalId))
        .limit(1);
      if (!animal.length) {
        return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
      }
    }
    // Verify milk log exists if provided
    if (validatedData.milkLogId) {
      const milkLog = await db
        .select()
        .from(milkLogs)
        .where(eq(milkLogs.id, validatedData.milkLogId))
        .limit(1);
      if (!milkLog.length) {
        return NextResponse.json({ success: false, error: 'Milk log not found' }, { status: 404 });
      }
    }
    // Convert percentages to integers for storage
    const testData = {
      ...validatedData,
      fatPercentage: validatedData.fatPercentage
        ? Math.round(validatedData.fatPercentage * 100)
        : null,
      proteinPercentage: validatedData.proteinPercentage
        ? Math.round(validatedData.proteinPercentage * 100)
        : null,
      snfPercentage: validatedData.snfPercentage
        ? Math.round(validatedData.snfPercentage * 100)
        : null,
      lactosePercentage: validatedData.lactosePercentage
        ? Math.round(validatedData.lactosePercentage * 100)
        : null,
      temperature: validatedData.temperature ? Math.round(validatedData.temperature * 10) : null,
      phLevel: validatedData.phLevel ? Math.round(validatedData.phLevel * 100) : null,
    };
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const newTest = await db
      .insert(milkQualityTests)
      .values({
        id: testId,
        tenantId: tenantContext.tenantId,
        ...testData,
        testDate: new Date(validatedData.testDate),
        testedBy: tenantContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return NextResponse.json({
      success: true,
      data: newTest[0],
      message: 'Milk quality test created successfully',
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
// PUT /api/milk-quality/tests?id=xxx - Update milk quality test
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Test ID required' }, { status: 400 });
    }
    const body = await request.json();
    const validatedData = updateMilkQualityTestSchema.parse(body);
    const db = getDrizzle();
    // Check if test exists and validate tenant ownership
    const existingTest = await db
      .select()
      .from(milkQualityTests)
      .where(eq(milkQualityTests.id, id))
      .limit(1);
    if (!existingTest.length) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
    }
    // Get tenant context for ownership validation
    const tenantContext = await getTenantContext();
    // Validate tenant ownership to prevent cross-tenant updates
    if (existingTest[0].tenantId !== tenantContext.tenantId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    // Convert percentages to integers for storage
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    if (validatedData.fatPercentage !== undefined) {
      updateData.fatPercentage = Math.round(validatedData.fatPercentage * 100);
    }
    if (validatedData.proteinPercentage !== undefined) {
      updateData.proteinPercentage = Math.round(validatedData.proteinPercentage * 100);
    }
    if (validatedData.snfPercentage !== undefined) {
      updateData.snfPercentage = Math.round(validatedData.snfPercentage * 100);
    }
    if (validatedData.lactosePercentage !== undefined) {
      updateData.lactosePercentage = Math.round(validatedData.lactosePercentage * 100);
    }
    if (validatedData.temperature !== undefined) {
      updateData.temperature = Math.round(validatedData.temperature * 10);
    }
    if (validatedData.phLevel !== undefined) {
      updateData.phLevel = Math.round(validatedData.phLevel * 100);
    }
    // Auto-grade based on quality parameters if status is being set to passed
    if (validatedData.status === 'passed' && !validatedData.grade) {
      const test = existingTest[0];
      let grade = 'grade_c';
      const fat = updateData.fatPercentage ?? test.fatPercentage;
      const protein = updateData.proteinPercentage ?? test.proteinPercentage;
      const snf = updateData.snfPercentage ?? test.snfPercentage;
      const adulteration = updateData.adulterationTest ?? test.adulterationTest;
      if (fat && protein && snf && !adulteration) {
        if (fat >= 350 && protein >= 320 && snf >= 850) {
          // 3.5%, 3.2%, 8.5%
          grade = 'premium';
        } else if (fat >= 320 && protein >= 300 && snf >= 820) {
          // 3.2%, 3.0%, 8.2%
          grade = 'grade_a';
        } else if (fat >= 300 && protein >= 280 && snf >= 800) {
          // 3.0%, 2.8%, 8.0%
          grade = 'grade_b';
        }
      }
      if (adulteration) {
        grade = 'rejected';
      }
      updateData.grade = grade;
    }
    const updatedTest = await db
      .update(milkQualityTests)
      .set(updateData)
      .where(eq(milkQualityTests.id, id))
      .returning();
    return NextResponse.json({
      success: true,
      data: updatedTest[0],
      message: 'Milk quality test updated successfully',
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