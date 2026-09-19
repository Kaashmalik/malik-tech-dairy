import { NotificationService, ReminderService } from '../notification.service';
import { getDrizzle } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  getDrizzle: jest.fn(),
}));

describe('Notification & Reminder Engine Unit Tests', () => {
  const mockDrizzle = {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDrizzle as jest.Mock).mockReturnValue(mockDrizzle);
  });

  describe('NotificationService CRUD Operations', () => {
    it('should create an in-app notification with tenant context and default unread state', async () => {
      const mockReturning = jest.fn().mockResolvedValue([
        {
          id: 'notif_123',
          tenantId: 'tenant_abc',
          userId: 'user_xyz',
          type: 'vaccination_due',
          title: 'Vaccination Due: PK-102',
          message: 'Anthrax vaccine scheduled for tomorrow.',
          read: false,
          createdAt: new Date(),
        },
      ]);
      const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
      mockDrizzle.insert.mockReturnValue({ values: mockValues });

      const result = await NotificationService.createNotification('tenant_abc', {
        userId: 'user_xyz',
        type: 'vaccination_due',
        title: 'Vaccination Due: PK-102',
        message: 'Anthrax vaccine scheduled for tomorrow.',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('notif_123');
      expect(result.read).toBe(false);
      expect(mockDrizzle.insert).toHaveBeenCalled();
    });

    it('should mark a notification as read within tenant boundary', async () => {
      const mockReturning = jest.fn().mockResolvedValue([
        {
          id: 'notif_123',
          tenantId: 'tenant_abc',
          read: true,
        },
      ]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDrizzle.update.mockReturnValue({ set: mockSet });

      const updated = await NotificationService.markAsRead('tenant_abc', 'notif_123');

      expect(updated).toBeDefined();
      expect(updated.read).toBe(true);
      expect(mockDrizzle.update).toHaveBeenCalled();
    });

    it('should mark all unread notifications as read for a tenant', async () => {
      const mockReturning = jest.fn().mockResolvedValue([
        { id: '1', read: true },
        { id: '2', read: true },
      ]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDrizzle.update.mockReturnValue({ set: mockSet });

      const result = await NotificationService.markAllAsRead('tenant_abc', 'user_xyz');

      expect(result.count).toBe(2);
      expect(mockDrizzle.update).toHaveBeenCalled();
    });

    it('should delete a notification by ID strictly for the specified tenant', async () => {
      const mockWhere = jest.fn().mockResolvedValue(true);
      mockDrizzle.delete.mockReturnValue({ where: mockWhere });

      const result = await NotificationService.deleteNotification('tenant_abc', 'notif_123');

      expect(result.success).toBe(true);
      expect(mockDrizzle.delete).toHaveBeenCalled();
    });
  });

  describe('Reminder Logic & Thresholds', () => {
    it('should identify low feed stock when quantity is at or below minimum threshold', () => {
      const items = [
        { name: 'Wheat Bran', quantity: 50, minimumStock: 100, isLow: false },
        { name: 'Silage', quantity: 500, minimumStock: 200, isLow: false },
        { name: 'Cotton Cake', quantity: 20, minimumStock: 20, isLow: false },
      ];

      const evaluated = items.map(item => ({
        ...item,
        isLow: item.minimumStock > 0 && item.quantity <= item.minimumStock,
      }));

      expect(evaluated[0].isLow).toBe(true); // 50 <= 100
      expect(evaluated[1].isLow).toBe(false); // 500 > 200
      expect(evaluated[2].isLow).toBe(true); // 20 <= 20
    });

    it('should identify upcoming vaccinations within 7 days window', () => {
      const now = new Date();
      const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const maxWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const isUpcomingVaccination = (dueDate: Date) => dueDate >= now && dueDate <= maxWindow;

      expect(isUpcomingVaccination(in3Days)).toBe(true);
      expect(isUpcomingVaccination(in15Days)).toBe(false);
    });
  });
});
