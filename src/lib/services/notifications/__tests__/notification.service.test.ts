/**
 * @jest-environment node
 */
import { createSupabaseFake } from '@/mocks/supabase-rest';

const fake = createSupabaseFake();
jest.mock('@/lib/supabase/server', () => ({ getSupabaseClient: () => fake.client }));

import { NotificationService, ReminderService } from '../notification.service';

const tenantFilter = ['eq', 'tenant_id', 'tenant_abc'];

describe('Notification & Reminder Engine Unit Tests', () => {
  beforeEach(() => fake.reset());

  describe('NotificationService CRUD Operations', () => {
    it('stamps tenant_id and defaults to unread on create', async () => {
      fake.respond('notifications', 'insert', {
        data: { id: 'notif_123', tenant_id: 'tenant_abc', user_id: 'user_xyz', read: false },
      });

      const result = await NotificationService.createNotification('tenant_abc', {
        userId: 'user_xyz',
        type: 'vaccination_due',
        title: 'Vaccination Due: PK-102',
        message: 'Anthrax vaccine scheduled for tomorrow.',
      });

      expect(result).toMatchObject({ id: 'notif_123', tenantId: 'tenant_abc', read: false });
      const [insert] = fake.queries;
      expect((insert.payload as Array<Record<string, unknown>>)[0]).toMatchObject({
        tenant_id: 'tenant_abc',
        user_id: 'user_xyz',
        read: false,
      });
    });

    it('marks a notification as read within the tenant boundary', async () => {
      fake.respond('notifications', 'update', { data: { id: 'notif_123', read: true } });

      const updated = await NotificationService.markAsRead('tenant_abc', 'notif_123');

      expect(updated?.read).toBe(true);
      const filters = fake.filters(fake.queries[0]);
      expect(filters).toContainEqual(tenantFilter);
      expect(filters).toContainEqual(['eq', 'id', 'notif_123']);
    });

    it('marks all unread notifications read for the user and farm-wide ones', async () => {
      fake.respond('notifications', 'update', { data: [{ id: '1' }, { id: '2' }] });

      const result = await NotificationService.markAllAsRead('tenant_abc', 'user_xyz');

      expect(result.count).toBe(2);
      const filters = fake.filters(fake.queries[0]);
      expect(filters).toContainEqual(tenantFilter);
      expect(filters).toContainEqual(['or', 'user_id.eq.user_xyz,user_id.is.null']);
    });

    it('ignores a malformed userId instead of interpolating it into the filter', async () => {
      fake.respond('notifications', 'select', { data: [], count: 0 });

      await NotificationService.getUnreadCount('tenant_abc', 'x,tenant_id.neq.tenant_abc');

      const filters = fake.filters(fake.queries[0]);
      expect(filters.some(([name]) => name === 'or')).toBe(false);
      expect(filters).toContainEqual(tenantFilter);
    });

    it('deletes a notification by ID strictly for the specified tenant', async () => {
      const result = await NotificationService.deleteNotification('tenant_abc', 'notif_123');

      expect(result.success).toBe(true);
      expect(fake.filters(fake.queries[0])).toEqual([tenantFilter, ['eq', 'id', 'notif_123']]);
    });

    it('surfaces database errors instead of returning empty data', async () => {
      fake.respond('notifications', 'select', { error: { message: 'boom' } });
      await expect(NotificationService.listNotifications('tenant_abc')).rejects.toThrow(/boom/);
    });
  });

  describe('ReminderService', () => {
    it('creates low-stock alerts only for items at or below minimum stock', async () => {
      fake.respond('feed_inventory', 'select', {
        data: [
          { id: 'f1', feed_name: 'Wheat Bran', quantity: 50, unit: 'kg', minimum_stock: 100 },
          { id: 'f2', feed_name: 'Silage', quantity: 500, unit: 'kg', minimum_stock: 200 },
          { id: 'f3', feed_name: 'Cotton Cake', quantity: 20, unit: 'kg', minimum_stock: 20 },
        ],
      });
      fake.respond('notifications', 'select', { data: [{ metadata: { feedId: 'f3' } }] });
      fake.respond('notifications', 'insert', { data: { id: 'n1' } });

      const created = await ReminderService.checkLowFeedStock('tenant_abc');

      // f1 is low and new; f3 is low but already has an unread alert; f2 is fine
      expect(created).toBe(1);
      const inserts = fake.queries.filter(q => q.op === 'insert');
      expect((inserts[0].payload as Array<Record<string, unknown>>)[0].title).toBe(
        'Low Stock: Wheat Bran'
      );
    });

    it('returns 0 without extra queries when no vaccinations are due', async () => {
      fake.respond('health_records', 'select', { data: [] });
      expect(await ReminderService.checkVaccinationsDue('tenant_abc')).toBe(0);
      expect(fake.queries).toHaveLength(1);
    });
  });
});
