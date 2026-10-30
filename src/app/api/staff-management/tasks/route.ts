import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
import { db, tenantDb, toCamel, toSnake, unwrap } from '@/lib/supabase/tenant-db';
import { sanitizeSearchTerm } from '@/lib/services/animals/animal.service';
import { logger } from '@/lib/logger';

const ACTIVE_STATUSES = ['pending', 'in_progress'];
const PRIORITY_WEIGHT: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

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
  // z.coerce.boolean() would turn "false" into true
  overdue: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional(),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function errorResponse(error: unknown, action: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }
  logger.error(`Task ${action} failed`, error);
  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
}

async function lookupById(table: string, columns: string, ids: string[], tenantId?: string) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map<string, Row>();
  const base = tenantId
    ? tenantDb(tenantId).select(table, columns)
    : db().from(table).select(columns);
  const rows = unwrap(await base.in('id', unique), `Load ${table}`) as unknown as Row[];
  return new Map(rows.map(r => [r.id, r]));
}

// GET /api/staff-management/tasks - List task assignments
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = taskQuerySchema.parse(Object.fromEntries(searchParams));
    const from = (query.page - 1) * query.limit;

    let q = tenantDb(tenantContext.tenantId).select('task_assignments', '*', { count: 'exact' });
    if (query.assignedTo) q = q.eq('assigned_to', query.assignedTo);
    if (query.assignedBy) q = q.eq('assigned_by', query.assignedBy);
    const taskType = query.taskType && sanitizeSearchTerm(query.taskType);
    if (taskType) q = q.ilike('task_type', `%${taskType}%`);
    if (query.priority) q = q.eq('priority', query.priority);
    if (query.status) q = q.eq('status', query.status);
    if (query.animalId) q = q.eq('animal_id', query.animalId);
    if (query.dueDate) q = q.gte('due_date', new Date(query.dueDate).toISOString());
    if (query.overdue) {
      q = q.lte('due_date', new Date().toISOString()).in('status', ACTIVE_STATUSES);
    }

    const { data, error, count } = await q
      .order('due_date', { ascending: false })
      .order('priority')
      .range(from, from + query.limit - 1);
    if (error) throw new Error(`List tasks: ${error.message}`);
    const tasks = (data || []) as unknown as Row[];

    const [users, animalsById] = await Promise.all([
      lookupById(
        'platform_users',
        'id, name, email',
        tasks.flatMap(t => [t.assigned_to, t.assigned_by])
      ),
      lookupById(
        'animals',
        'id, tag, name, breed',
        tasks.map(t => t.animal_id),
        tenantContext.tenantId
      ),
    ]);

    const now = Date.now();
    const tasksWithCalculatedFields = tasks.map(row => {
      const task = toCamel<Row>(row)!;
      const due = new Date(task.dueDate).getTime();
      return {
        ...task,
        assignedToUser: users.get(task.assignedTo) || null,
        assignedByUser: users.get(task.assignedBy) || null,
        animal: task.animalId ? animalsById.get(task.animalId) || null : null,
        isOverdue: due < now && ACTIVE_STATUSES.includes(task.status),
        daysUntilDue: Math.ceil((due - now) / (1000 * 60 * 60 * 24)),
        efficiency:
          task.status === 'completed' && task.estimatedDuration && task.actualDuration
            ? Math.round((task.estimatedDuration / task.actualDuration) * 100)
            : null,
        priorityWeight: PRIORITY_WEIGHT[task.priority] || 1,
      };
    });

    const byStatus = (s: string) => tasks.filter(t => t.status === s).length;
    return NextResponse.json({
      success: true,
      data: {
        tasks: tasksWithCalculatedFields,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / query.limit),
        },
        summary: {
          totalTasks: tasks.length,
          pendingTasks: byStatus('pending'),
          inProgressTasks: byStatus('in_progress'),
          completedTasks: byStatus('completed'),
          overdueTasks: tasksWithCalculatedFields.filter(t => t.isOverdue).length,
          urgentTasks: tasks.filter(t => t.priority === 'urgent').length,
        },
      },
    });
  } catch (error) {
    return errorResponse(error, 'list');
  }
}

// POST /api/staff-management/tasks - Create new task assignment
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const validatedData = createTaskSchema.parse(await request.json());
    const tenantContext = await getTenantContext();
    const t = tenantDb(tenantContext.tenantId);

    // Assignee must be a member of this farm (or the requester themself)
    if (validatedData.assignedTo !== tenantContext.userId) {
      const member = unwrap(
        await t
          .select('tenant_members', 'id')
          .eq('user_id', validatedData.assignedTo)
          .eq('status', 'active')
          .maybeSingle(),
        'Check assignee'
      );
      if (!member) {
        return NextResponse.json(
          { success: false, error: 'Assigned user does not belong to this farm' },
          { status: 403 }
        );
      }
    }

    // Verify animal exists if provided and belongs to this tenant
    if (validatedData.animalId) {
      const animal = unwrap(
        await t.select('animals', 'id').eq('id', validatedData.animalId).maybeSingle(),
        'Check animal'
      );
      if (!animal) {
        return NextResponse.json(
          { success: false, error: 'Animal not found in this farm' },
          { status: 404 }
        );
      }
    }

    const now = new Date().toISOString();
    const created = unwrap(
      await t
        .insert(
          'task_assignments',
          toSnake({
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            assignedBy: tenantContext.userId,
            ...validatedData,
            dueDate: new Date(validatedData.dueDate).toISOString(),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          })
        )
        .select()
        .single(),
      'Create task'
    );
    return NextResponse.json({
      success: true,
      data: toCamel(created as unknown as Row),
      message: 'Task assignment created successfully',
    });
  } catch (error) {
    return errorResponse(error, 'create');
  }
}

// PUT /api/staff-management/tasks?id=xxx - Update task assignment
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });
    }
    const validatedData = updateTaskSchema.parse(await request.json());
    const tenantContext = await getTenantContext();
    const t = tenantDb(tenantContext.tenantId);

    // Tenant-scoped lookup: another farm's task is simply "not found"
    const existing = unwrap(
      await t.select('task_assignments', 'id, status').eq('id', id).maybeSingle(),
      'Load task'
    ) as { status: string } | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updateData = toSnake({
      ...validatedData,
      updatedAt: now,
      completedAt:
        validatedData.status === 'completed' && existing.status !== 'completed' ? now : undefined,
    });
    const updated = unwrap(
      await t.update('task_assignments', updateData).eq('id', id).select().single(),
      'Update task'
    );
    return NextResponse.json({
      success: true,
      data: toCamel(updated as unknown as Row),
      message: 'Task assignment updated successfully',
    });
  } catch (error) {
    return errorResponse(error, 'update');
  }
}

// DELETE /api/staff-management/tasks?id=xxx - Delete task assignment
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });
    }
    const tenantContext = await getTenantContext();

    const deleted = unwrap(
      await tenantDb(tenantContext.tenantId).delete('task_assignments').eq('id', id).select('id'),
      'Delete task'
    ) as unknown[];
    if (!deleted.length) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task assignment deleted successfully' });
  } catch (error) {
    return errorResponse(error, 'delete');
  }
}
