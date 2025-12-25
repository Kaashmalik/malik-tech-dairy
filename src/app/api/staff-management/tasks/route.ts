import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { taskAssignments, animals, platformUsers, taskAssignmentsRelations } from '@/db/schema';
import { eq, and, ilike, desc, gte, lte, inArray, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
// Validation schemas
const taskQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  assignedTo: z.string().optional(),
  assignedBy: z.string().optional(),
  taskType: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']).optional(),
  animalId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  overdue: z.coerce.boolean().optional(),
});
const createTaskSchema = z.object({
  assignedTo: z.string().min(1),
  taskType: z.string().min(1), // milking, feeding, cleaning, treatment
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  title: z.string().min(2).max(255),
  description: z.string().optional(),
  animalId: z.string().optional(),
  dueDate: z.string().datetime(),
  estimatedDuration: z.number().min(1).optional(), // in minutes
});
const updateTaskSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']).optional(),
  actualDuration: z.number().min(1).optional(),
  completionPhoto: z.string().optional(),
  completionNotes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});
// GET /api/staff-management/tasks - List task assignments
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = taskQuerySchema.parse(Object.fromEntries(searchParams));
    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;
    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    const whereConditions = [eq(taskAssignments.tenantId, tenantContext.tenantId)];
    if (query.assignedTo) {
      whereConditions.push(eq(taskAssignments.assignedTo, query.assignedTo));
    }
    if (query.assignedBy) {
      whereConditions.push(eq(taskAssignments.assignedBy, query.assignedBy));
    }
    if (query.taskType) {
      whereConditions.push(ilike(taskAssignments.taskType, `%${query.taskType}%`));
    }
    if (query.priority) {
      whereConditions.push(eq(taskAssignments.priority, query.priority));
    }
    if (query.status) {
      whereConditions.push(eq(taskAssignments.status, query.status));
    }
    if (query.animalId) {
      whereConditions.push(eq(taskAssignments.animalId, query.animalId));
    }
    if (query.dueDate) {
      whereConditions.push(gte(taskAssignments.dueDate, new Date(query.dueDate)));
    }
    if (query.overdue === true) {
      whereConditions.push(
        and(
          lte(taskAssignments.dueDate, new Date()),
          inArray(taskAssignments.status, ['pending', 'in_progress'])
        )
      );
    }
    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskAssignments)
      .where(and(...whereConditions));
    const total = totalCountResult[0]?.count || 0;
    // Get task assignments with relations
    const tasksList = await db
      .select({
        // Task fields
        id: taskAssignments.id,
        tenantId: taskAssignments.tenantId,
        assignedTo: taskAssignments.assignedTo,
        assignedBy: taskAssignments.assignedBy,
        taskType: taskAssignments.taskType,
        priority: taskAssignments.priority,
        title: taskAssignments.title,
        description: taskAssignments.description,
        animalId: taskAssignments.animalId,
        dueDate: taskAssignments.dueDate,
        estimatedDuration: taskAssignments.estimatedDuration,
        actualDuration: taskAssignments.actualDuration,
        status: taskAssignments.status,
        completionPhoto: taskAssignments.completionPhoto,
        completionNotes: taskAssignments.completionNotes,
        rating: taskAssignments.rating,
        createdAt: taskAssignments.createdAt,
        updatedAt: taskAssignments.updatedAt,
        completedAt: taskAssignments.completedAt,
        // Related data
        assignedToUser: {
          id: platformUsers.id,
          name: platformUsers.name,
          email: platformUsers.email,
        },
        assignedByUser: {
          id: platformUsers.id,
          name: platformUsers.name,
          email: platformUsers.email,
        },
        animal: {
          id: animals.id,
          tag: animals.tag,
          name: animals.name,
          breed: animals.breed,
        },
      })
      .from(taskAssignments)
      .leftJoin(platformUsers, eq(taskAssignments.assignedTo, platformUsers.id))
      .leftJoin(platformUsers, eq(taskAssignments.assignedBy, platformUsers.id))
      .leftJoin(animals, eq(taskAssignments.animalId, animals.id))
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(desc(taskAssignments.dueDate), taskAssignments.priority);
    // Calculate additional fields for each task
    const tasksWithCalculatedFields = tasksList.map(task => {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate < now && ['pending', 'in_progress'].includes(task.status);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      // Calculate efficiency if task is completed
      let efficiency = null;
      if (task.status === 'completed' && task.estimatedDuration && task.actualDuration) {
        efficiency = Math.round((task.estimatedDuration / task.actualDuration) * 100);
      }
      return {
        ...task,
        isOverdue,
        daysUntilDue,
        efficiency,
        priorityWeight:
          task.priority === 'urgent'
            ? 4
            : task.priority === 'high'
              ? 3
              : task.priority === 'medium'
                ? 2
                : 1,
      };
    });
    return NextResponse.json({
      success: true,
      data: {
        tasks: tasksWithCalculatedFields,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        summary: {
          totalTasks: tasksList.length,
          pendingTasks: tasksList.filter(t => t.status === 'pending').length,
          inProgressTasks: tasksList.filter(t => t.status === 'in_progress').length,
          completedTasks: tasksList.filter(t => t.status === 'completed').length,
          overdueTasks: tasksWithCalculatedFields.filter(t => t.isOverdue).length,
          urgentTasks: tasksList.filter(t => t.priority === 'urgent').length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/staff-management/tasks - Create new task assignment
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);
    const db = getDrizzle();
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Verify assigned user exists
    const assignedUser = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.id, validatedData.assignedTo))
      .limit(1);
    if (!assignedUser.length) {
      return NextResponse.json(
        { success: false, error: 'Assigned user not found' },
        { status: 404 }
      );
    }
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
    // Get tenant context
    const tenantContext = await getTenantContext();
    const newTask = await db
      .insert(taskAssignments)
      .values({
        id: taskId,
        tenantId: tenantContext.tenantId,
        assignedBy: tenantContext.userId,
        ...validatedData,
        dueDate: new Date(validatedData.dueDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return NextResponse.json({
      success: true,
      data: newTask[0],
      message: 'Task assignment created successfully',
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
// PUT /api/staff-management/tasks?id=xxx - Update task assignment
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });
    }
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);
    const db = getDrizzle();
    // Check if task exists and validate tenant ownership
    const existingTask = await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.id, id))
      .limit(1);
    if (!existingTask.length) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    // Get tenant context for ownership validation
    const tenantContext = await getTenantContext();
    // Validate tenant ownership to prevent cross-tenant updates
    if (existingTask[0].tenantId !== tenantContext.tenantId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    // Set completedAt if status is changed to completed
    if (validatedData.status === 'completed' && existingTask[0].status !== 'completed') {
      updateData.completedAt = new Date();
    }
    const updatedTask = await db
      .update(taskAssignments)
      .set(updateData)
      .where(eq(taskAssignments.id, id))
      .returning();
    return NextResponse.json({
      success: true,
      data: updatedTask[0],
      message: 'Task assignment updated successfully',
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