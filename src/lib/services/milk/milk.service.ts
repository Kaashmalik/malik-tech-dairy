import { getSupabaseClient } from '@/lib/supabase/server';
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

type MilkRow = {
  id: string;
  tenant_id: string;
  animal_id: string;
  date: string;
  session: string;
  quantity: number;
  quality: number | null;
  fat: number | null;
  notes: string | null;
  created_at: string;
  animals?: { tag?: string; name?: string; species?: string } | null;
};

export class MilkService {
  /**
   * List milk logs with tenant isolation, date range, and pagination (Supabase REST)
   */
  static async listLogs(
    ctx: ServiceContext,
    filters: MilkLogFilters = {}
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('milk_logs') as any)
      .select('*, animals(tag, name, species)', { count: 'exact' })
      .eq('tenant_id', ctx.tenantId)
      .order('date', { ascending: false })
      .order('session', { ascending: false })
      .range(from, to);

    if (filters.date) {
      query = query.eq('date', filters.date);
    } else if (filters.startDate && filters.endDate) {
      query = query.gte('date', filters.startDate).lte('date', filters.endDate);
    }
    if (filters.animalId) {
      query = query.eq('animal_id', filters.animalId);
    }
    if (filters.session) {
      query = query.eq('session', filters.session);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(`Failed to list milk logs: ${error.message}`);
    }

    const total = count || 0;
    const items = ((data || []) as MilkRow[]).map(r => ({
      id: r.id,
      tenantId: r.tenant_id,
      animalId: r.animal_id,
      animalTag: r.animals?.tag || 'Unknown',
      animalName: r.animals?.name || '',
      animalSpecies: r.animals?.species || 'cow',
      date: r.date,
      session: r.session,
      quantity: r.quantity,
      quality: r.quality,
      fat: r.fat != null ? r.fat / 100 : undefined,
      notes: r.notes,
      createdAt: r.created_at,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  /**
   * Log milk for a single animal with duplicate detection and validation
   */
  static async logMilk(ctx: ServiceContext, data: CreateMilkLogDTO) {
    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: animal, error: animalError } = await sb
      .from('animals')
      .select('id, status, tag')
      .eq('id', data.animalId)
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle();

    if (animalError) {
      throw new Error(`Failed to verify animal: ${animalError.message}`);
    }
    if (!animal) {
      throw new Error('NOT_FOUND: Animal not found in your farm.');
    }
    if (['deceased', 'sold'].includes(animal.status)) {
      throw new Error(`INVALID_STATE: Cannot log milk for animal with status '${animal.status}'.`);
    }

    const { data: existing } = await sb
      .from('milk_logs')
      .select('id')
      .eq('tenant_id', ctx.tenantId)
      .eq('animal_id', data.animalId)
      .eq('date', data.date)
      .eq('session', data.session)
      .maybeSingle();

    if (existing?.id) {
      throw new Error(
        'DUPLICATE_ENTRY: Milk log already recorded for this animal, date, and session.'
      );
    }

    const logId = `milk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fatVal = data.fat ? Math.round(data.fat * 100) : null;

    const { data: created, error: insertError } = await sb
      .from('milk_logs')
      .insert({
        id: logId,
        tenant_id: ctx.tenantId,
        animal_id: data.animalId,
        date: data.date,
        session: data.session,
        quantity: Math.round(data.quantity * 10) / 10,
        quality: data.quality || null,
        fat: fatVal,
        notes: data.notes?.trim() || null,
        recorded_by: ctx.userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to record milk: ${insertError.message}`);
    }

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

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const [{ data: todayLogs }, { data: yesterdayLogs }] = await Promise.all([
      sb
        .from('milk_logs')
        .select('animal_id, session, quantity')
        .eq('tenant_id', ctx.tenantId)
        .eq('date', targetDate),
      sb.from('milk_logs').select('quantity').eq('tenant_id', ctx.tenantId).eq('date', prevDate),
    ]);

    const today = (todayLogs || []) as { animal_id: string; session: string; quantity: number }[];
    const yesterday = (yesterdayLogs || []) as { quantity: number }[];

    const morningTotal = today
      .filter(l => l.session === 'morning')
      .reduce((sum, l) => sum + Number(l.quantity), 0);

    const eveningTotal = today
      .filter(l => l.session === 'evening')
      .reduce((sum, l) => sum + Number(l.quantity), 0);

    const todayTotal = morningTotal + eveningTotal;
    const yesterdayTotal = yesterday.reduce((sum, l) => sum + Number(l.quantity), 0);
    const activeMilkingAnimals = new Set(today.map(l => l.animal_id)).size;
    const averagePerAnimal =
      activeMilkingAnimals > 0 ? Math.round((todayTotal / activeMilkingAnimals) * 10) / 10 : 0;
    const difference = todayTotal - yesterdayTotal;
    const percentChange = yesterdayTotal > 0 ? Math.round((difference / yesterdayTotal) * 100) : 0;

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
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - days);
    const startDate = startDateObj.toISOString().split('T')[0];

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: logs, error } = await (supabase.from('milk_logs') as any)
      .select('date, session, quantity')
      .eq('tenant_id', ctx.tenantId)
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to load milk trends: ${error.message}`);
    }

    const dailyMap = new Map<string, { morning: number; evening: number; total: number }>();

    for (const log of (logs || []) as { date: string; session: string; quantity: number }[]) {
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

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      morning: Math.round(data.morning * 10) / 10,
      evening: Math.round(data.evening * 10) / 10,
      total: Math.round(data.total * 10) / 10,
    }));
  }
}
