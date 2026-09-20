import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { z } from 'zod';
import {
  NotificationService,
  ReminderService,
} from '@/lib/services/notifications/notification.service';

export const dynamic = 'force-dynamic';

const getQuerySchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 50)),
  offset: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 0)),
  checkReminders: z
    .string()
    .optional()
    .transform(val => val === 'true'),
});

const createNotificationSchema = z.object({
  userId: z.string().optional().nullable(),
  type: z.enum([
    'vaccination_due',
    'pregnancy_check',
    'low_stock',
    'task_assigned',
    'system',
    'payment',
  ]),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  link: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

const patchNotificationSchema = z.object({
  id: z.string().optional(),
  markAll: z.boolean().optional(),
});

// GET /api/notifications
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = getQuerySchema.parse({
        unreadOnly: searchParams.get('unreadOnly') || undefined,
        limit: searchParams.get('limit') || undefined,
        offset: searchParams.get('offset') || undefined,
        checkReminders: searchParams.get('checkReminders') || undefined,
      });

      // Run reminder checks if requested
      if (query.checkReminders) {
        try {
          await ReminderService.runAllReminderChecks(context.tenantId);
        } catch (err) {
          console.error('Failed to run automated reminder checks:', err);
        }
      }

      const result = await NotificationService.listNotifications(context.tenantId, {
        userId: context.userId,
        unreadOnly: query.unreadOnly,
        limit: query.limit,
        offset: query.offset,
      });

      const unreadCount = await NotificationService.getUnreadCount(
        context.tenantId,
        context.userId
      );

      return NextResponse.json({
        success: true,
        ...result,
        unreadCount,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      // Soft-fail: keep dashboard usable when Postgres pool is unavailable
      console.error('Error fetching notifications:', error);
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        total: 0,
      });
    }
  })(request);
}

// POST /api/notifications
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const validated = createNotificationSchema.parse(body);

      const created = await NotificationService.createNotification(context.tenantId, {
        userId: validated.userId,
        type: validated.type,
        title: validated.title,
        message: validated.message,
        link: validated.link,
        metadata: validated.metadata,
      });

      return NextResponse.json(
        {
          success: true,
          notification: created,
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// PATCH /api/notifications
export async function PATCH(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const validated = patchNotificationSchema.parse(body);

      if (validated.markAll) {
        const result = await NotificationService.markAllAsRead(context.tenantId, context.userId);
        return NextResponse.json({ success: true, updated: result.count });
      }

      if (validated.id) {
        const updated = await NotificationService.markAsRead(context.tenantId, validated.id);
        if (!updated) {
          return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, notification: updated });
      }

      return NextResponse.json({ error: 'Must specify either id or markAll' }, { status: 400 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// DELETE /api/notifications
export async function DELETE(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
      }

      await NotificationService.deleteNotification(context.tenantId, id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
