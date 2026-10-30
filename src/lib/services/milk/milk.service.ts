import { fetchAllRows, tenantDb, unwrap } from '@/lib/supabase/tenant-db';
import { ServiceContext, PaginatedResult } from '../types';

export interface MilkLogFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  animalId?: string;
  session?: 'morning' | 'evening';
  page?: number;
  limit?: number;
}

export interface MilkQualityInput {
  quality?: number; // 1-10 scale
  fat?: number; // percentage (e.g. 4.5)
  snf?: number; // solids-not-fat percentage (e.g. 8.5)
}

export interface CreateMilkLogDTO extends MilkQualityInput {
  animalId: string;
  date: string; // YYYY-MM-DD
  session: 'morning' | 'evening';
  quantity: number; // in Liters
  notes?: string;
}

export interface BulkMilkEntryDTO {
  date: string;
  session: 'morning' | 'evening';
  entries: Array<MilkQualityInput & { animalId: string; quantity: number; notes?: string }>;
}

type MilkRow = {
  id: string;
  tenant_id: string;
  animal_id: string;
  date: string;
  session: string;
  quantity: number | string;
  quality: number | null;
  fat: number | null;
  snf?: number | null;
  notes: string | null;
  created_at: string;
  animals?: { tag?: string; name?: string; species?: string } | null;
};

const NON_MILKING_STATUSES = ['deceased', 'sold'];
const round1 = (n: number) => Math.round(n * 10) / 10;
// fat/snf stored as percentage * 100 (450 = 4.50%)
const toHundredths = (pct?: number) => (pct != null ? Math.round(pct * 100) : null);
const fromHundredths = (v?: number | null) => (v != null ? v / 100 : undefined);

export function mapMilkRow(r: MilkRow) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    animalId: r.animal_id,
    animalTag: r.animals?.tag || 'Unknown',
    animalName: r.animals?.name || '',
    animalSpecies: r.animals?.species || 'cow',
    date: r.date,
    session: r.session,
    quantity: Number(r.quantity),
    quality: r.quality,
    fat: fromHundredths(r.fat),
    snf: fromHundredths(r.snf),
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export class MilkService {
  /**
   * List milk logs with tenant isolation, date range, and pagination (Supabase REST)
   */
  static async listLogs(
    ctx: ServiceContext,
    filters: MilkLogFilters = {}
  ): Promise<PaginatedResult<ReturnType<typeof mapMilkRow>>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const from = (page - 1) * limit;

    let query = tenantDb(ctx.tenantId)
      .select('milk_logs', '*, animals(tag, name, species)', { count: 'exact' })
      .order('date', { ascending: false })
      .order('session', { ascending: false })
      .range(from, from + limit - 1);

    if (filters.date) {
      query = query.eq('date', filters.date);
    } else {
      if (filters.startDate) query = query.gte('date', filters.startDate);
      if (filters.endDate) query = query.lte('date', filters.endDate);
    }
    if (filters.animalId) query = query.eq('animal_id', filters.animalId);
    if (filters.session) query = query.eq('session', filters.session);

    const { data, error, count } = await query;
    if (error) {
      throw new Error(`Failed to list milk logs: ${error.message}`);
    }

    const total = count || 0;
    return {
      items: ((data || []) as unknown as MilkRow[]).map(mapMilkRow),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  /**
   * Log milk for a single animal with duplicate detection and validation
   */
  static async logMilk(ctx: ServiceContext, data: CreateMilkLogDTO) {
    const result = await this.bulkLogMilk(ctx, {
      date: data.date,
      session: data.session,
      entries: [data],
    });
    if (result.errors.length > 0) {
      throw new Error(result.errors[0].error);
    }
    return result.created[0];
  }

  /**
   * Bulk milk logging for barn data entry: one query each to validate animals,
   * find existing entries, and insert - instead of three queries per animal.
   */
  static async bulkLogMilk(ctx: ServiceContext, data: BulkMilkEntryDTO) {
    const t = tenantDb(ctx.tenantId);
    const errors: Array<{ animalId: string; error: string }> = [];
    const animalIds = [...new Set(data.entries.map(e => e.animalId))];

    const [animals, existing] = await Promise.all([
      unwrap(
        await t.select('animals', 'id, status').in('id', animalIds),
        'Verify animals'
      ) as unknown as Array<{ id: string; status: string }>,
      unwrap(
        await t
          .select('milk_logs', 'animal_id')
          .eq('date', data.date)
          .eq('session', data.session)
          .in('animal_id', animalIds),
        'Check existing milk logs'
      ) as unknown as Array<{ animal_id: string }>,
    ]);
    const statusById = new Map(animals.map(a => [a.id, a.status]));
    const alreadyLogged = new Set(existing.map(e => e.animal_id));
    const seen = new Set<string>();

    const now = new Date().toISOString();
    const rows: Record<string, unknown>[] = [];
    for (const entry of data.entries) {
      const status = statusById.get(entry.animalId);
      if (!status) {
        errors.push({
          animalId: entry.animalId,
          error: 'NOT_FOUND: Animal not found in your farm.',
        });
      } else if (NON_MILKING_STATUSES.includes(status)) {
        errors.push({
          animalId: entry.animalId,
          error: `INVALID_STATE: Cannot log milk for animal with status '${status}'.`,
        });
      } else if (alreadyLogged.has(entry.animalId) || seen.has(entry.animalId)) {
        errors.push({
          animalId: entry.animalId,
          error: 'DUPLICATE_ENTRY: Milk log already recorded for this animal, date, and session.',
        });
      } else {
        seen.add(entry.animalId);
        rows.push({
          id: `milk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          animal_id: entry.animalId,
          date: data.date,
          session: data.session,
          quantity: round1(entry.quantity),
          quality: entry.quality ?? null,
          fat: toHundredths(entry.fat),
          notes: entry.notes?.trim() || null,
          // Only send snf when given, so this works before migration 011 adds the column
          ...(entry.snf != null ? { snf: toHundredths(entry.snf) } : {}),
          recorded_by: ctx.userId,
          created_at: now,
        });
      }
    }

    let created: ReturnType<typeof mapMilkRow>[] = [];
    if (rows.length > 0) {
      const { data: inserted, error } = await t.insert('milk_logs', rows).select();
      if (error?.code === '23505') {
        // Lost a race with another device (unique index from migration 011)
        throw new Error(
          'DUPLICATE_ENTRY: Milk log already recorded for this animal, date, and session.'
        );
      }
      if (error) {
        throw new Error(`Failed to record milk: ${error.message}`);
      }
      created = ((inserted || []) as unknown as MilkRow[]).map(mapMilkRow);
    }

    return {
      success: errors.length === 0,
      loggedCount: created.length,
      failedCount: errors.length,
      created,
      errors,
    };
  }

  /**
   * Daily dashboard metrics: today total, morning total, evening total, per animal avg
   */
  static async getDailySummary(ctx: ServiceContext, dateStr?: string) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const prevDate = shiftDate(targetDate, -1);
    const t = tenantDb(ctx.tenantId);

    const [today, yesterday] = await Promise.all([
      fetchAllRows<{ animal_id: string; session: string; quantity: number }>(
        () =>
          t.select('milk_logs', 'animal_id, session, quantity').eq('date', targetDate).order('id'),
        'Load today milk'
      ),
      fetchAllRows<{ quantity: number }>(
        () => t.select('milk_logs', 'quantity').eq('date', prevDate).order('id'),
        'Load yesterday milk'
      ),
    ]);

    const sum = (rows: { quantity: number }[]) => rows.reduce((s, l) => s + Number(l.quantity), 0);
    const morningTotal = sum(today.filter(l => l.session === 'morning'));
    const eveningTotal = sum(today.filter(l => l.session === 'evening'));
    const todayTotal = morningTotal + eveningTotal;
    const yesterdayTotal = sum(yesterday);
    const activeMilkingAnimals = new Set(today.map(l => l.animal_id)).size;
    const difference = todayTotal - yesterdayTotal;

    return {
      date: targetDate,
      todayTotal: round1(todayTotal),
      morningTotal: round1(morningTotal),
      eveningTotal: round1(eveningTotal),
      yesterdayTotal: round1(yesterdayTotal),
      activeMilkingAnimals,
      averagePerAnimal: activeMilkingAnimals > 0 ? round1(todayTotal / activeMilkingAnimals) : 0,
      difference: round1(difference),
      percentChange: yesterdayTotal > 0 ? Math.round((difference / yesterdayTotal) * 100) : 0,
    };
  }

  /**
   * Trend analytics for 7, 30, or 90 days (every day in range, zero-filled)
   */
  static async getProductionTrends(ctx: ServiceContext, days = 30) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = shiftDate(endDate, -days);

    const logs = await fetchAllRows<{ date: string; session: string; quantity: number }>(
      () =>
        tenantDb(ctx.tenantId)
          .select('milk_logs', 'date, session, quantity')
          .gte('date', startDate)
          .order('date', { ascending: true })
          .order('id'),
      'Load milk trends'
    );

    const dailyMap = new Map<string, { morning: number; evening: number; total: number }>();
    for (let d = startDate; d <= endDate; d = shiftDate(d, 1)) {
      dailyMap.set(d, { morning: 0, evening: 0, total: 0 });
    }
    for (const log of logs) {
      const entry = dailyMap.get(log.date);
      if (!entry) continue;
      const qty = Number(log.quantity);
      if (log.session === 'morning') entry.morning += qty;
      else entry.evening += qty;
      entry.total += qty;
    }

    return Array.from(dailyMap.entries()).map(([date, d]) => ({
      date,
      morning: round1(d.morning),
      evening: round1(d.evening),
      total: round1(d.total),
    }));
  }

  /**
   * Monthly milk report: per-animal totals/averages and per-day totals for a YYYY-MM month.
   */
  static async getMonthlyReport(ctx: ServiceContext, month: string) {
    const startDate = `${month}-01`;
    const nextMonth = new Date(`${startDate}T00:00:00Z`);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const endDate = shiftDate(nextMonth.toISOString().split('T')[0], -1);
    const t = tenantDb(ctx.tenantId);

    const [logs, animals] = await Promise.all([
      fetchAllRows<MilkRow>(
        () =>
          t
            .select('milk_logs', 'id, animal_id, date, session, quantity, fat')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date')
            .order('id'),
        'Load monthly milk'
      ),
      fetchAllRows<{ id: string; tag: string; name: string | null }>(
        () => t.select('animals', 'id, tag, name').order('id'),
        'Load animals'
      ),
    ]);
    const animalById = new Map(animals.map(a => [a.id, a]));

    const perAnimal = new Map<
      string,
      { total: number; sessions: number; days: Set<string>; fatSum: number; fatCount: number }
    >();
    const perDay = new Map<string, number>();
    for (const log of logs) {
      const qty = Number(log.quantity);
      const a = perAnimal.get(log.animal_id) || {
        total: 0,
        sessions: 0,
        days: new Set<string>(),
        fatSum: 0,
        fatCount: 0,
      };
      a.total += qty;
      a.sessions += 1;
      a.days.add(log.date);
      if (log.fat != null) {
        a.fatSum += log.fat / 100;
        a.fatCount += 1;
      }
      perAnimal.set(log.animal_id, a);
      perDay.set(log.date, (perDay.get(log.date) || 0) + qty);
    }

    const animalsReport = [...perAnimal.entries()]
      .map(([animalId, a]) => ({
        animalId,
        tag: animalById.get(animalId)?.tag || 'Unknown',
        name: animalById.get(animalId)?.name || '',
        totalLiters: round1(a.total),
        daysMilked: a.days.size,
        sessions: a.sessions,
        averagePerDay: a.days.size ? round1(a.total / a.days.size) : 0,
        averageFat: a.fatCount ? Math.round((a.fatSum / a.fatCount) * 100) / 100 : null,
      }))
      .sort((x, y) => y.totalLiters - x.totalLiters);

    const total = animalsReport.reduce((s, a) => s + a.totalLiters, 0);
    return {
      month,
      startDate,
      endDate,
      totalLiters: round1(total),
      daysRecorded: perDay.size,
      averagePerDay: perDay.size ? round1(total / perDay.size) : 0,
      animals: animalsReport,
      daily: [...perDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, liters]) => ({ date, liters: round1(liters) })),
    };
  }
}
