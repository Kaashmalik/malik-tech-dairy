import { v4 as uuidv4 } from 'uuid';
import { fetchAllRows, tenantDb, toCamel, unwrap, type TenantDb } from '@/lib/supabase/tenant-db';

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
  metadata?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface ListNotificationFilters {
  userId?: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const mapRows = (rows: unknown) => ((rows || []) as Row[]).map(r => toCamel<Row>(r)!);

/** Notifications addressed to this user or to the whole farm (user_id IS NULL). */
function forUser<Q extends { or: (filter: string) => Q }>(query: Q, userId?: string): Q {
  // Clerk user IDs are [A-Za-z0-9_]; reject anything else rather than interpolate it
  if (userId && /^[A-Za-z0-9_]+$/.test(userId)) {
    return query.or(`user_id.eq.${userId},user_id.is.null`);
  }
  return query;
}

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });

export class NotificationService {
  /**
   * Create an in-app notification for a tenant (and optionally specific user)
   */
  static async createNotification(tenantId: string, data: CreateNotificationDTO) {
    const created = unwrap(
      await tenantDb(tenantId)
        .insert('notifications', {
          id: uuidv4(),
          user_id: data.userId || null,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          metadata: data.metadata || null,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single(),
      'Create notification'
    );
    return toCamel<Row>(created as unknown as Row);
  }

  /**
   * List notifications for a tenant with optional filtering
   */
  static async listNotifications(tenantId: string, filters: ListNotificationFilters = {}) {
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = Math.max(0, filters.offset || 0);

    let query = forUser(
      tenantDb(tenantId).select('notifications', '*', { count: 'exact' }),
      filters.userId
    );
    if (filters.unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      throw new Error(`List notifications: ${error.message}`);
    }

    return { items: mapRows(data), total: count || 0, limit, offset };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(tenantId: string, notificationId: string) {
    const updated = unwrap(
      await tenantDb(tenantId)
        .update('notifications', { read: true })
        .eq('id', notificationId)
        .select()
        .maybeSingle(),
      'Mark notification read'
    );
    return toCamel<Row>(updated as Row | null);
  }

  /**
   * Mark all notifications as read for a tenant/user
   */
  static async markAllAsRead(tenantId: string, userId?: string) {
    const updated = unwrap(
      await forUser(
        tenantDb(tenantId).update('notifications', { read: true }).eq('read', false),
        userId
      ).select('id'),
      'Mark all notifications read'
    ) as unknown[];
    return { count: updated.length };
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(tenantId: string, notificationId: string) {
    unwrap(
      await tenantDb(tenantId).delete('notifications').eq('id', notificationId),
      'Delete notification'
    );
    return { success: true };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(tenantId: string, userId?: string): Promise<number> {
    const { count, error } = await forUser(
      tenantDb(tenantId)
        .select('notifications', 'id', { count: 'exact', head: true })
        .eq('read', false),
      userId
    );
    if (error) {
      throw new Error(`Count notifications: ${error.message}`);
    }
    return count || 0;
  }
}

/** Metadata keys of unread notifications of a type - one query instead of one per record. */
async function unreadMetadataKeys(t: TenantDb, type: string, key: string): Promise<Set<string>> {
  const rows = await fetchAllRows<{ metadata: Row | null }>(
    () => t.select('notifications', 'metadata').eq('type', type).eq('read', false).order('id'),
    'Load unread notifications'
  );
  return new Set(rows.map(r => String(r.metadata?.[key] ?? '')).filter(Boolean));
}

async function animalLabels(t: TenantDb, ids: string[]): Promise<Map<string, Row>> {
  if (ids.length === 0) return new Map();
  const rows = unwrap(
    await t.select('animals', 'id, tag, name').in('id', [...new Set(ids)]),
    'Load animals'
  ) as Row[];
  return new Map(rows.map(r => [r.id, r]));
}

export class ReminderService {
  /**
   * Check for upcoming vaccinations within daysAhead and generate notifications
   */
  static async checkVaccinationsDue(tenantId: string, daysAhead: number = 7): Promise<number> {
    const t = tenantDb(tenantId);
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 86_400_000);

    const records = unwrap(
      await t
        .select('health_records', 'id, animal_id, description, next_due_date')
        .eq('type', 'vaccination')
        .gte('next_due_date', now.toISOString())
        .lte('next_due_date', futureDate.toISOString()),
      'Load due vaccinations'
    ) as Row[];
    if (records.length === 0) return 0;

    const [notified, animals] = await Promise.all([
      unreadMetadataKeys(t, 'vaccination_due', 'recordId'),
      animalLabels(
        t,
        records.map(r => r.animal_id)
      ),
    ]);

    let createdCount = 0;
    for (const record of records) {
      const animal = animals.get(record.animal_id);
      if (!record.next_due_date || !animal || notified.has(record.id)) continue;

      await NotificationService.createNotification(tenantId, {
        type: 'vaccination_due',
        title: `Vaccination Due: ${animal.tag || 'Animal'}`,
        message: `${record.description || 'Vaccination'} scheduled for ${animal.name || animal.tag} on ${formatDate(record.next_due_date)}.`,
        link: `/animals/${record.animal_id}`,
        metadata: {
          recordId: record.id,
          animalId: record.animal_id,
          dueDate: record.next_due_date,
        },
      });
      createdCount++;
    }

    return createdCount;
  }

  /**
   * Check for upcoming pregnancy checks or calving dates
   */
  static async checkPregnancyChecksDue(tenantId: string, daysAhead: number = 7): Promise<number> {
    const t = tenantDb(tenantId);
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 86_400_000);

    const records = unwrap(
      await t
        .select('breeding_records', 'id, animal_id, expected_due_date')
        .eq('pregnancy_confirmed', true)
        .gte('expected_due_date', now.toISOString())
        .lte('expected_due_date', futureDate.toISOString()),
      'Load expected calvings'
    ) as Row[];
    if (records.length === 0) return 0;

    const [notified, animals] = await Promise.all([
      unreadMetadataKeys(t, 'pregnancy_check', 'recordId'),
      animalLabels(
        t,
        records.map(r => r.animal_id)
      ),
    ]);

    let createdCount = 0;
    for (const record of records) {
      const animal = animals.get(record.animal_id);
      if (!record.expected_due_date || !animal || notified.has(record.id)) continue;

      await NotificationService.createNotification(tenantId, {
        type: 'pregnancy_check',
        title: `Calving Expected: ${animal.tag || 'Animal'}`,
        message: `${animal.name || animal.tag} is expected to calve on or around ${formatDate(record.expected_due_date)}.`,
        link: `/breeding`,
        metadata: {
          recordId: record.id,
          animalId: record.animal_id,
          expectedDate: record.expected_due_date,
        },
      });
      createdCount++;
    }

    return createdCount;
  }

  /**
   * Check for low feed inventory levels
   */
  static async checkLowFeedStock(tenantId: string): Promise<number> {
    const t = tenantDb(tenantId);

    // PostgREST cannot compare two columns, so filter quantity <= minimum_stock here
    const items = unwrap(
      await t
        .select('feed_inventory', 'id, feed_name, quantity, unit, minimum_stock')
        .eq('is_active', true)
        .not('minimum_stock', 'is', null),
      'Load feed inventory'
    ) as Row[];
    const lowStockItems = items.filter(i => Number(i.quantity) <= Number(i.minimum_stock));
    if (lowStockItems.length === 0) return 0;

    const notified = await unreadMetadataKeys(t, 'low_stock', 'feedId');

    let createdCount = 0;
    for (const item of lowStockItems) {
      if (notified.has(item.id)) continue;

      await NotificationService.createNotification(tenantId, {
        type: 'low_stock',
        title: `Low Stock: ${item.feed_name}`,
        message: `Inventory for ${item.feed_name} has reached ${item.quantity} ${item.unit} (reorder point: ${item.minimum_stock} ${item.unit}).`,
        link: `/feed`,
        metadata: {
          feedId: item.id,
          currentStock: item.quantity,
          minimumStock: item.minimum_stock,
        },
      });
      createdCount++;
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
