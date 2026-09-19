import { getDrizzle } from '@/lib/supabase/server';
import { notifications, healthRecords, breedingRecords, feedInventory, animals } from '@/db/schema';
import { eq, and, desc, lte, gte, isNull, or, count, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface CreateNotificationDTO {
  userId?: string | null;
  type:
    | 'vaccination_due'
    | 'pregnancy_check'
    | 'low_stock'
    | 'task_assigned'
    | 'system'
    | 'payment';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface ListNotificationFilters {
  userId?: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export class NotificationService {
  /**
   * Create an in-app notification for a tenant (and optionally specific user)
   */
  static async createNotification(tenantId: string, data: CreateNotificationDTO) {
    const db = getDrizzle();
    const id = uuidv4();

    const [created] = await db
      .insert(notifications)
      .values({
        id,
        tenantId,
        userId: data.userId || null,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        metadata: data.metadata || null,
        read: false,
        createdAt: new Date(),
      })
      .returning();

    return created;
  }

  /**
   * List notifications for a tenant with optional filtering
   */
  static async listNotifications(tenantId: string, filters: ListNotificationFilters = {}) {
    const db = getDrizzle();
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = Math.max(0, filters.offset || 0);

    const conditions = [eq(notifications.tenantId, tenantId)];

    if (filters.userId) {
      conditions.push(or(eq(notifications.userId, filters.userId), isNull(notifications.userId))!);
    }

    if (filters.unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    const whereClause = and(...conditions);

    const items = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() }).from(notifications).where(whereClause);

    return {
      items,
      total: Number(total?.count || 0),
      limit,
      offset,
    };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(tenantId: string, notificationId: string) {
    const db = getDrizzle();
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.tenantId, tenantId)))
      .returning();

    return updated;
  }

  /**
   * Mark all notifications as read for a tenant/user
   */
  static async markAllAsRead(tenantId: string, userId?: string) {
    const db = getDrizzle();
    const conditions = [eq(notifications.tenantId, tenantId), eq(notifications.read, false)];

    if (userId) {
      conditions.push(or(eq(notifications.userId, userId), isNull(notifications.userId))!);
    }

    const updated = await db
      .update(notifications)
      .set({ read: true })
      .where(and(...conditions))
      .returning();

    return { count: updated.length };
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(tenantId: string, notificationId: string) {
    const db = getDrizzle();
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.tenantId, tenantId)));

    return { success: true };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(tenantId: string, userId?: string): Promise<number> {
    const db = getDrizzle();
    const conditions = [eq(notifications.tenantId, tenantId), eq(notifications.read, false)];

    if (userId) {
      conditions.push(or(eq(notifications.userId, userId), isNull(notifications.userId))!);
    }

    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(...conditions));

    return Number(result?.count || 0);
  }
}

export class ReminderService {
  /**
   * Check for upcoming vaccinations within daysAhead and generate notifications
   */
  static async checkVaccinationsDue(tenantId: string, daysAhead: number = 7): Promise<number> {
    const db = getDrizzle();
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    // Get health records of type vaccination where nextDueDate is in range
    const records = await db
      .select({
        recordId: healthRecords.id,
        animalId: healthRecords.animalId,
        type: healthRecords.type,
        description: healthRecords.description,
        nextDueDate: healthRecords.nextDueDate,
        animalTag: animals.tag,
        animalName: animals.name,
      })
      .from(healthRecords)
      .innerJoin(animals, eq(healthRecords.animalId, animals.id))
      .where(
        and(
          eq(healthRecords.tenantId, tenantId),
          eq(healthRecords.type, 'vaccination'),
          gte(healthRecords.nextDueDate, now),
          lte(healthRecords.nextDueDate, futureDate)
        )
      );

    let createdCount = 0;
    for (const record of records) {
      if (!record.nextDueDate) continue;

      // Check if unread notification already exists
      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.tenantId, tenantId),
            eq(notifications.type, 'vaccination_due'),
            eq(notifications.read, false),
            sql`${notifications.metadata}->>'recordId' = ${record.recordId}`
          )
        )
        .limit(1);

      if (existing.length === 0) {
        const dueDateStr = new Date(record.nextDueDate).toLocaleDateString('en-PK', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        await NotificationService.createNotification(tenantId, {
          type: 'vaccination_due',
          title: `Vaccination Due: ${record.animalTag || 'Animal'}`,
          message: `${record.description || 'Vaccination'} scheduled for ${record.animalName || record.animalTag} on ${dueDateStr}.`,
          link: `/animals/${record.animalId}`,
          metadata: {
            recordId: record.recordId,
            animalId: record.animalId,
            dueDate: record.nextDueDate,
          },
        });
        createdCount++;
      }
    }

    return createdCount;
  }

  /**
   * Check for upcoming pregnancy checks or calving dates
   */
  static async checkPregnancyChecksDue(tenantId: string, daysAhead: number = 7): Promise<number> {
    const db = getDrizzle();
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    // Check calving dates for confirmed pregnant animals
    const calvingDue = await db
      .select({
        recordId: breedingRecords.id,
        animalId: breedingRecords.animalId,
        expectedDueDate: breedingRecords.expectedDueDate,
        animalTag: animals.tag,
        animalName: animals.name,
      })
      .from(breedingRecords)
      .innerJoin(animals, eq(breedingRecords.animalId, animals.id))
      .where(
        and(
          eq(breedingRecords.tenantId, tenantId),
          eq(breedingRecords.pregnancyConfirmed, true),
          gte(breedingRecords.expectedDueDate, now),
          lte(breedingRecords.expectedDueDate, futureDate)
        )
      );

    let createdCount = 0;
    for (const record of calvingDue) {
      if (!record.expectedDueDate) continue;

      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.tenantId, tenantId),
            eq(notifications.type, 'pregnancy_check'),
            eq(notifications.read, false),
            sql`${notifications.metadata}->>'recordId' = ${record.recordId}`
          )
        )
        .limit(1);

      if (existing.length === 0) {
        const dateStr = new Date(record.expectedDueDate).toLocaleDateString('en-PK', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        await NotificationService.createNotification(tenantId, {
          type: 'pregnancy_check',
          title: `Calving Expected: ${record.animalTag || 'Animal'}`,
          message: `${record.animalName || record.animalTag} is expected to calve on or around ${dateStr}.`,
          link: `/breeding`,
          metadata: {
            recordId: record.recordId,
            animalId: record.animalId,
            expectedDate: record.expectedDueDate,
          },
        });
        createdCount++;
      }
    }

    return createdCount;
  }

  /**
   * Check for low feed inventory levels
   */
  static async checkLowFeedStock(tenantId: string): Promise<number> {
    const db = getDrizzle();

    const lowStockItems = await db
      .select()
      .from(feedInventory)
      .where(
        and(
          eq(feedInventory.tenantId, tenantId),
          eq(feedInventory.isActive, true),
          sql`${feedInventory.minimumStock} IS NOT NULL`,
          sql`CAST(${feedInventory.quantity} AS numeric) <= CAST(${feedInventory.minimumStock} AS numeric)`
        )
      );

    let createdCount = 0;
    for (const item of lowStockItems) {
      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.tenantId, tenantId),
            eq(notifications.type, 'low_stock'),
            eq(notifications.read, false),
            sql`${notifications.metadata}->>'feedId' = ${item.id}`
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await NotificationService.createNotification(tenantId, {
          type: 'low_stock',
          title: `Low Stock: ${item.feedName}`,
          message: `Inventory for ${item.feedName} has reached ${item.quantity} ${item.unit} (reorder point: ${item.minimumStock} ${item.unit}).`,
          link: `/feed`,
          metadata: {
            feedId: item.id,
            currentStock: item.quantity,
            minimumStock: item.minimumStock,
          },
        });
        createdCount++;
      }
    }

    return createdCount;
  }

  /**
   * Run all automated reminder checks for a tenant
   */
  static async runAllReminderChecks(tenantId: string) {
    const vaccinations = await this.checkVaccinationsDue(tenantId, 7);
    const pregnancy = await this.checkPregnancyChecksDue(tenantId, 7);
    const feedStock = await this.checkLowFeedStock(tenantId);

    return {
      vaccinations,
      pregnancy,
      feedStock,
      totalNewNotifications: vaccinations + pregnancy + feedStock,
    };
  }
}
