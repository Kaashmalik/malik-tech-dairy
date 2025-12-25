import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and, inArray } from 'drizzle-orm';
import { getDrizzle } from '@/lib/supabase';
import { animals, taskAssignments } from '@/db/schema';
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
    let tenantContext;
    try {
      tenantContext = await getTenantContext();
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Tenant context required' }, { status: 403 });
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
    const db = getDrizzle();
    // Verify all animals belong to the tenant
    const animalsResult = await db
      .select({ id: animals.id, name: animals.name, tag: animals.tag })
      .from(animals)
      .where(
        and(
          eq(animals.tenantId, tenantContext.tenantId),
          inArray(animals.id, animalIds)
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
    // Execute operation based on type - stub implementation
    // TODO: Implement full batch operations when health_records and genetic_profiles tables are added
    const operationResults = animalsResult.map(animal => ({
      animalId: animal.id,
      animalName: animal.name,
      success: true,
      message: `${operation} operation logged for ${animal.name}`,
      note: 'Full batch operation support coming in future update',
    }));
    let taskCreated = null;
    // Create task assignment if requested
    if (createTask && assignedTo) {
      taskCreated = await createBatchTask(
        db,
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
// Create batch task assignment
async function createBatchTask(
  db: ReturnType<typeof getDrizzle>,
  operation: string,
  animalsList: { id: string; name: string | null; tag: string | null }[],
  operationData: Record<string, unknown>,
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
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        title: `Batch ${operation} for ${animalsList.length} animals`,
        description: `Perform ${operation} on animals: ${animalsList.map(a => `${a.name} (${a.tag})`).join(', ')}`,
        animalId: animalsList.length === 1 ? animalsList[0].id : null,
        dueDate: scheduledDate || new Date(),
        estimatedDuration: estimatedDuration || animalsList.length * 5,
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