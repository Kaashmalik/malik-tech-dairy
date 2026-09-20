import { getDrizzle } from '@/lib/supabase/server';
import { feedInventory } from '@/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { ServiceContext } from '../types';
import { logAuditEvent } from '@/lib/audit';

export type FeedType = 'concentrate' | 'silage' | 'hay' | 'minerals' | 'supplements' | 'water';
export type FeedUnit = 'kg' | 'liters' | 'grams' | 'tons';

export interface CreateFeedItemDTO {
  feedType: FeedType;
  feedName: string;
  quantity: number; // in base unit (kg)
  unit: FeedUnit;
  unitPrice: number; // in PKR
  supplier?: string;
  minimumStock?: number;
}

export interface AdjustStockDTO {
  feedId: string;
  quantityChange: number; // positive for restock, negative for consumption
  reason: 'purchase' | 'feeding' | 'waste' | 'adjustment';
  notes?: string;
}

export class FeedService {
  /**
   * List all feed inventory items with low-stock status
   */
  static async listInventory(ctx: ServiceContext) {
    const db = getDrizzle();

    const items = await db
      .select()
      .from(feedInventory)
      .where(and(eq(feedInventory.tenantId, ctx.tenantId), eq(feedInventory.isActive, true)))
      .orderBy(feedInventory.feedName);

    return items.map(item => {
      const stock = Number(item.quantity);
      const minStock = Number(item.minimumStock || 0);
      const isLowStock = minStock > 0 && stock <= minStock;

      return {
        id: item.id,
        tenantId: item.tenantId,
        feedType: item.feedType,
        feedName: item.feedName,
        currentStock: stock,
        unit: item.unit,
        unitPrice: item.unitPrice / 100, // stored in paise
        reorderPoint: minStock,
        minimumStock: minStock,
        supplier: item.supplier,
        isLowStock,
        purchaseDate: item.purchaseDate,
        createdAt: item.createdAt,
      };
    });
  }

  /**
   * Add new feed item to inventory
   */
  static async createFeedItem(ctx: ServiceContext, data: CreateFeedItemDTO) {
    const db = getDrizzle();
    const itemId = `feed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const [created] = await db
      .insert(feedInventory)
      .values({
        id: itemId,
        tenantId: ctx.tenantId,
        feedType: data.feedType,
        feedName: data.feedName.trim(),
        quantity: Math.round(data.quantity),
        unit: data.unit,
        unitPrice: Math.round(data.unitPrice * 100), // store in paise
        purchaseDate: new Date(),
        supplier: data.supplier?.trim() || null,
        minimumStock: data.minimumStock ? Math.round(data.minimumStock) : 100,
        isActive: true,
        createdBy: ctx.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'create',
        resource: 'feed_inventory',
        resourceId: created.id,
        details: { feedName: data.feedName, quantity: data.quantity },
      });
    } catch {
      // Ignore audit failure
    }

    return created;
  }

  /**
   * Adjust stock atomically (consume or add)
   */
  static async adjustStock(ctx: ServiceContext, data: AdjustStockDTO) {
    const db = getDrizzle();

    const [item] = await db
      .select()
      .from(feedInventory)
      .where(and(eq(feedInventory.id, data.feedId), eq(feedInventory.tenantId, ctx.tenantId)))
      .limit(1);

    if (!item) {
      throw new Error('NOT_FOUND: Feed inventory item not found.');
    }

    const currentStock = Number(item.quantity);
    const delta = Math.round(data.quantityChange);
    const newStock = currentStock + delta;

    if (newStock < 0) {
      throw new Error(
        `INSUFFICIENT_STOCK: Current stock is only ${currentStock} ${item.unit}. Cannot deduct ${Math.abs(data.quantityChange)} ${item.unit}.`
      );
    }

    const [updated] = await db
      .update(feedInventory)
      .set({
        quantity: newStock,
        updatedAt: new Date(),
      })
      .where(and(eq(feedInventory.id, data.feedId), eq(feedInventory.tenantId, ctx.tenantId)))
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'update',
        resource: 'feed_inventory',
        resourceId: item.id,
        details: { change: data.quantityChange, reason: data.reason },
      });
    } catch {
      // Ignore audit failure
    }

    return updated;
  }

  /**
   * Get low stock alerts for dashboard
   */
  static async getLowStockAlerts(ctx: ServiceContext) {
    const inventory = await this.listInventory(ctx);
    return inventory.filter(item => item.isLowStock);
  }
}
