import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/supabase';
import {
  animals,
  health_records,
  breeding_records,
  taskAssignments,
  genetic_profiles,
} from '@/db/schema';
import { getTenantContext } from '@/lib/tenant/context';
import { z } from 'zod';

// Batch operation schema
const batchOperationSchema = z.object({
  operation: z.enum([
    'vaccination',
    'treatment',
    'movement',
    'feeding',
    'health_check',
    'genetic_test',
  ]),
  animalIds: z.array(z.string()).min(1, 'At least one animal ID is required'),
  operationData: z.object({
    // Vaccination data
    vaccineId: z.string().optional(),
    vaccineName: z.string().optional(),
    vaccineType: z.string().optional(),
    batchNumber: z.string().optional(),
    manufacturer: z.string().optional(),
    administeredBy: z.string().optional(),
    notes: z.string().optional(),

    // Treatment data
    treatmentId: z.string().optional(),
    treatmentName: z.string().optional(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.number().optional(),
    prescribedBy: z.string().optional(),

    // Movement data
    fromLocation: z.string().optional(),
    toLocation: z.string().optional(),
    transportMethod: z.string().optional(),

    // Feeding data
    feedScheduleId: z.string().optional(),
    feedType: z.string().optional(),
    quantity: z.number().optional(),
    unit: z.string().optional(),

    // Health check data
    checkType: z.string().optional(),
    veterinarianId: z.string().optional(),
    findings: z.string().optional(),

    // Genetic test data
    testType: z.string().optional(),
    laboratory: z.string().optional(),
    sampleType: z.string().optional(),
  }),
  scheduledDate: z
    .string()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().optional(),
  estimatedDuration: z.number().optional(),
  createTask: z.boolean().default(true),
});

// POST /api/animals/batch-operations - Execute batch operations on multiple animals
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext(userId);
    if (!tenantContext) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = batchOperationSchema.parse(body);

    const {
      operation,
      animalIds,
      operationData,
      scheduledDate,
      priority,
      assignedTo,
      estimatedDuration,
      createTask,
    } = validatedData;

    // Verify all animals belong to the tenant
    const animalsResult = await db
      .select({ id: animals.id, name: animals.name, tag: animals.tag })
      .from(animals)
      .where(
        and(
          eq(animals.tenantId, tenantContext.tenantId),
          inArray(animals.id, animalIds),
          sql`${animals.deletedAt} IS NULL`
        )
      );

    if (animalsResult.length !== animalIds.length) {
      const foundIds = animalsResult.map(a => a.id);
      const missingIds = animalIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        {
          success: false,
          error: 'Some animals not found or do not belong to your tenant',
          details: { missingIds },
        },
        { status: 404 }
      );
    }

    let operationResults = [];
    let taskCreated = null;

    // Execute operation based on type
    switch (operation) {
      case 'vaccination':
        operationResults = await executeVaccination(
          animalsResult,
          operationData,
          userId,
          tenantContext.tenantId
        );
        break;

      case 'treatment':
        operationResults = await executeTreatment(
          animalsResult,
          operationData,
          userId,
          tenantContext.tenantId
        );
        break;

      case 'movement':
        operationResults = await executeMovement(
          animalsResult,
          operationData,
          userId,
          tenantContext.tenantId
        );
        break;

      case 'feeding':
        operationResults = await executeFeeding(
          animalsResult,
          operationData,
          userId,
          tenantContext.tenantId
        );
        break;

      case 'health_check':
        operationResults = await executeHealthCheck(
          animalsResult,
          operationData,
          userId,
          tenantContext.tenantId
        );
        break;

      case 'genetic_test':
        operationResults = await executeGeneticTest(
          animalsResult,
          operationData,
          userId,
          tenantContext.tenantId
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported operation type' },
          { status: 400 }
        );
    }

    // Create task assignment if requested
    if (createTask && assignedTo) {
      taskCreated = await createBatchTask(
        operation,
        animalsResult,
        operationData,
        scheduledDate,
        priority,
        assignedTo,
        estimatedDuration,
        userId,
        tenantContext.tenantId
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        operation,
        animalsProcessed: animalsResult.length,
        operationResults,
        taskCreated,
        summary: {
          successful: operationResults.filter(r => r.success).length,
          failed: operationResults.filter(r => !r.success).length,
          total: animalsResult.length,
        },
      },
      message: `Successfully processed ${operationResults.filter(r => r.success).length} out of ${animalsResult.length} animals`,
    });
  } catch (error) {
    console.error('Batch operations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute batch operation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Execute vaccination batch operation
async function executeVaccination(animals: any[], data: any, userId: string, tenantId: string) {
  const results = [];

  for (const animal of animals) {
    try {
      const vaccinationRecord = await db
        .insert(health_records)
        .values({
          id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          animalId: animal.id,
          type: 'vaccination',
          date: new Date(),
          vaccineName: data.vaccineName,
          vaccineType: data.vaccineType,
          batchNumber: data.batchNumber,
          manufacturer: data.manufacturer,
          administeredBy: data.administeredBy || userId,
          notes: data.notes,
          nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: true,
        recordId: vaccinationRecord[0].id,
        message: 'Vaccination recorded successfully',
      });
    } catch (error) {
      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Execute treatment batch operation
async function executeTreatment(animals: any[], data: any, userId: string, tenantId: string) {
  const results = [];

  for (const animal of animals) {
    try {
      const treatmentRecord = await db
        .insert(health_records)
        .values({
          id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          animalId: animal.id,
          type: 'treatment',
          date: new Date(),
          treatmentName: data.treatmentName,
          dosage: data.dosage,
          frequency: data.frequency,
          duration: data.duration,
          prescribedBy: data.prescribedBy,
          notes: data.notes,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: true,
        recordId: treatmentRecord[0].id,
        message: 'Treatment recorded successfully',
      });
    } catch (error) {
      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Execute movement batch operation
async function executeMovement(animals: any[], data: any, userId: string, tenantId: string) {
  const results = [];

  for (const animal of animals) {
    try {
      await db
        .update(animals)
        .set({
          location: data.toLocation,
          updatedAt: new Date(),
        })
        .where(and(eq(animals.id, animal.id), eq(animals.tenantId, tenantId)));

      // Create movement record in health records
      const movementRecord = await db
        .insert(health_records)
        .values({
          id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          animalId: animal.id,
          type: 'movement',
          date: new Date(),
          fromLocation: data.fromLocation,
          toLocation: data.toLocation,
          transportMethod: data.transportMethod,
          notes: data.notes,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: true,
        recordId: movementRecord[0].id,
        message: `Moved from ${data.fromLocation} to ${data.toLocation}`,
      });
    } catch (error) {
      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Execute feeding batch operation
async function executeFeeding(animals: any[], data: any, userId: string, tenantId: string) {
  const results = [];

  for (const animal of animals) {
    try {
      // Create feeding record in health records
      const feedingRecord = await db
        .insert(health_records)
        .values({
          id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          animalId: animal.id,
          type: 'feeding',
          date: new Date(),
          feedType: data.feedType,
          quantity: data.quantity,
          unit: data.unit,
          feedScheduleId: data.feedScheduleId,
          notes: data.notes,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: true,
        recordId: feedingRecord[0].id,
        message: `Feeding schedule updated: ${data.quantity} ${data.unit} of ${data.feedType}`,
      });
    } catch (error) {
      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Execute health check batch operation
async function executeHealthCheck(animals: any[], data: any, userId: string, tenantId: string) {
  const results = [];

  for (const animal of animals) {
    try {
      const healthCheckRecord = await db
        .insert(health_records)
        .values({
          id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          animalId: animal.id,
          type: 'checkup',
          date: new Date(),
          checkType: data.checkType,
          veterinarianId: data.veterinarianId,
          findings: data.findings,
          notes: data.notes,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: true,
        recordId: healthCheckRecord[0].id,
        message: 'Health check recorded successfully',
      });
    } catch (error) {
      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Execute genetic test batch operation
async function executeGeneticTest(animals: any[], data: any, userId: string, tenantId: string) {
  const results = [];

  for (const animal of animals) {
    try {
      // Create genetic profile if it doesn't exist
      const existingProfile = await db
        .select()
        .from(genetic_profiles)
        .where(eq(genetic_profiles.animalId, animal.id))
        .limit(1);

      if (existingProfile.length === 0) {
        await db.insert(genetic_profiles).values({
          id: `genetic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          animalId: animal.id,
          breedScore: 0,
          milkYieldPotential: 0,
          geneticValueIndex: 0,
          laboratory: data.laboratory,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Create genetic test record in health records
      const geneticTestRecord = await db
        .insert(health_records)
        .values({
          id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          animalId: animal.id,
          type: 'genetic_test',
          date: new Date(),
          testType: data.testType,
          laboratory: data.laboratory,
          sampleType: data.sampleType,
          notes: data.notes,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: true,
        recordId: geneticTestRecord[0].id,
        message: 'Genetic test scheduled successfully',
      });
    } catch (error) {
      results.push({
        animalId: animal.id,
        animalName: animal.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Create batch task assignment
async function createBatchTask(
  operation: string,
  animals: any[],
  operationData: any,
  scheduledDate: Date | undefined,
  priority: string,
  assignedTo: string,
  estimatedDuration: number | undefined,
  userId: string,
  tenantId: string
) {
  try {
    const task = await db
      .insert(taskAssignments)
      .values({
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        assignedTo,
        assignedBy: userId,
        taskType: operation,
        priority: priority as any,
        title: `Batch ${operation} for ${animals.length} animals`,
        description: `Perform ${operation} on animals: ${animals.map(a => `${a.name} (${a.tag})`).join(', ')}`,
        animalId: animals.length === 1 ? animals[0].id : null, // Only set if single animal
        dueDate: scheduledDate || new Date(),
        estimatedDuration: estimatedDuration || animals.length * 5, // 5 minutes per animal default
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      taskId: task[0].id,
      assignedTo,
      dueDate: task[0].dueDate,
      estimatedDuration: task[0].estimatedDuration,
      message: 'Task created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    };
  }
}
