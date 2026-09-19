import { getDrizzle } from '@/lib/supabase/server';
import { milkLogs, animals } from '@/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { ServiceContext, PaginatedResult } from '../types';
import { logAuditEvent } from '@/lib/audit';

export interface MilkLogFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  animalId?: string;
  session?: 'morning' | 'evening';
  page?: number;
  limit?: number;
}

export interface CreateMilkLogDTO {
  animalId: string;
  date: string; // YYYY-MM-DD
  session: 'morning' | 'evening';
  quantity: number; // in Liters
  quality?: number; // 1-10 scale
  fat?: number; // percentage (e.g. 4.5)
  notes?: string;
}

export interface BulkMilkEntryDTO {
  date: string;
  session: 'morning' | 'evening';
  entries: Array<{
    animalId: string;
    quantity: number;
    quality?: number;
  }>;
}

export class MilkService {
  /**
   * List milk logs with tenant isolation, date range, and pagination
   */
  static async listLogs(ctx: ServiceContext, filters: MilkLogFilters = {}): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const db = getDrizzle();

    const conditions = [eq(milkLogs.tenantId, ctx.tenantId)];

    if (filters.date) {
      conditions.push(eq(milkLogs.date, filters.date));
    } else if (filters.startDate && filters.endDate) {
      conditions.push(and(gte(milkLogs.date, filters.startDate), lte(milkLogs.date, filters.endDate))!);
    }
    if (filters.animalId) {
      conditions.push(eq(milkLogs.animalId, filters.animalId));
    }
    if (filters.session) {
      conditions.push(eq(milkLogs.session, filters.session));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(milkLogs)
      .where(whereClause);

    const total = Number(totalCount?.count || 0);

    // Join with animals table to get tag and name
    const rows = await db
      .select({
        id: milkLogs.id,
        tenantId: milkLogs.tenantId,
        animalId: milkLogs.animalId,
        date: milkLogs.date,
        session: milkLogs.session,
        quantity: milkLogs.quantity,
        quality: milkLogs.quality,
        fat: milkLogs.fat,
        notes: milkLogs.notes,
        createdAt: milkLogs.createdAt,
        animalTag: animals.tag,
        animalName: animals.name,
        animalSpecies: animals.species,
      })
      .from(milkLogs)
      .leftJoin(animals, eq(milkLogs.animalId, animals.id))
      .where(whereClause)
      .orderBy(desc(milkLogs.date), desc(milkLogs.session))
      .limit(limit)
      .offset(offset);

    const items = rows.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      animalId: r.animalId,
      animalTag: r.animalTag || 'Unknown',
      animalName: r.animalName || '',
      animalSpecies: r.animalSpecies || 'cow',
      date: r.date,
      session: r.session,
      quantity: r.quantity, // Liters
      quality: r.quality,
      fat: r.fat ? r.fat / 100 : undefined,
      notes: r.notes,
      createdAt: r.createdAt,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Log milk for a single animal with duplicate detection and validation
   */
  static async logMilk(ctx: ServiceContext, data: CreateMilkLogDTO) {
    const db = getDrizzle();

    // Verify animal exists and belongs to tenant
    const animalRows = await db
      .select({ id: animals.id, status: animals.status, tag: animals.tag })
      .from(animals)
      .where(and(eq(animals.id, data.animalId), eq(animals.tenantId, ctx.tenantId)))
      .limit(1);

    if (animalRows.length === 0) {
      throw new Error('NOT_FOUND: Animal not found in your farm.');
    }

    if (['deceased', 'sold'].includes(animalRows[0].status)) {
      throw new Error(`INVALID_STATE: Cannot log milk for animal with status '${animalRows[0].status}'.`);
    }

    // Check duplicate entry
    const existing = await db
      .select({ id: milkLogs.id })
      .from(milkLogs)
      .where(
        and(
          eq(milkLogs.tenantId, ctx.tenantId),
          eq(milkLogs.animalId, data.animalId),
          eq(milkLogs.date, data.date),
          eq(milkLogs.session, data.session)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('DUPLICATE_ENTRY: Milk log already recorded for this animal, date, and session.');
    }

    const logId = `milk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fatVal = data.fat ? Math.round(data.fat * 100) : null;

    const [created] = await db
      .insert(milkLogs)
      .values({
        id: logId,
        tenantId: ctx.tenantId,
        animalId: data.animalId,
        date: data.date,
        session: data.session,
        quantity: Math.round(data.quantity * 10) / 10,
        quality: data.quality || null,
        fat: fatVal,
        notes: data.notes?.trim() || null,
        recordedBy: ctx.userId,
        createdAt: new Date(),
      })
      .returning();

    return created;
  }

  /**
   * Bulk milk logging for barn data entry
   */
  static async bulkLogMilk(ctx: ServiceContext, data: BulkMilkEntryDTO) {
    const results = [];
    const errors = [];

    for (const entry of data.entries) {
      try {
        const logged = await this.logMilk(ctx, {
          animalId: entry.animalId,
          date: data.date,
          session: data.session,
          quantity: entry.quantity,
          quality: entry.quality,
        });
        results.push(logged);
      } catch (err: any) {
        errors.push({
          animalId: entry.animalId,
          error: err.message,
        });
      }
    }

    return {
      success: true,
      loggedCount: results.length,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * Daily dashboard metrics: today total, morning total, evening total, per animal avg
   */
  static async getDailySummary(ctx: ServiceContext, dateStr?: string) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const prevDateObj = new Date(targetDate);
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const prevDate = prevDateObj.toISOString().split('T')[0];

    const db = getDrizzle();

    // Target day logs
    const todayLogs = await db
      .select()
      .from(milkLogs)
      .where(and(eq(milkLogs.tenantId, ctx.tenantId), eq(milkLogs.date, targetDate)));

    // Previous day logs for comparison
    const yesterdayLogs = await db
      .select()
      .from(milkLogs)
      .where(and(eq(milkLogs.tenantId, ctx.tenantId), eq(milkLogs.date, prevDate)));

    const morningTotal = todayLogs
      .filter(l => l.session === 'morning')
      .reduce((sum, l) => sum + Number(l.quantity), 0);

    const eveningTotal = todayLogs
      .filter(l => l.session === 'evening')
      .reduce((sum, l) => sum + Number(l.quantity), 0);

    const todayTotal = morningTotal + eveningTotal;

    const yesterdayTotal = yesterdayLogs.reduce((sum, l) => sum + Number(l.quantity), 0);

    const activeMilkingAnimals = new Set(todayLogs.map(l => l.animalId)).size;

    const averagePerAnimal = activeMilkingAnimals > 0
      ? Math.round((todayTotal / activeMilkingAnimals) * 10) / 10
      : 0;

    const difference = todayTotal - yesterdayTotal;
    const percentChange = yesterdayTotal > 0
      ? Math.round((difference / yesterdayTotal) * 100)
      : 0;

    return {
      date: targetDate,
      todayTotal: Math.round(todayTotal * 10) / 10,
      morningTotal: Math.round(morningTotal * 10) / 10,
      eveningTotal: Math.round(eveningTotal * 10) / 10,
      yesterdayTotal: Math.round(yesterdayTotal * 10) / 10,
      activeMilkingAnimals,
      averagePerAnimal,
      difference: Math.round(difference * 10) / 10,
      percentChange,
    };
  }

  /**
   * Trend analytics for 7, 30, or 90 days
   */
  static async getProductionTrends(ctx: ServiceContext, days = 30) {
    const db = getDrizzle();
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - days);
    const startDate = startDateObj.toISOString().split('T')[0];

    const logs = await db
      .select({
        date: milkLogs.date,
        session: milkLogs.session,
        quantity: milkLogs.quantity,
      })
      .from(milkLogs)
      .where(and(eq(milkLogs.tenantId, ctx.tenantId), gte(milkLogs.date, startDate)))
      .orderBy(milkLogs.date);

    // Group by date
    const dailyMap = new Map<string, { morning: number; evening: number; total: number }>();

    for (const log of logs) {
      if (!dailyMap.has(log.date)) {
        dailyMap.set(log.date, { morning: 0, evening: 0, total: 0 });
      }
      const entry = dailyMap.get(log.date)!;
      const qty = Number(log.quantity);
      if (log.session === 'morning') {
        entry.morning += qty;
      } else {
        entry.evening += qty;
      }
      entry.total += qty;
    }

    const trends = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      morning: Math.round(data.morning * 10) / 10,
      evening: Math.round(data.evening * 10) / 10,
      total: Math.round(data.total * 10) / 10,
    }));

    return trends;
  }
}
