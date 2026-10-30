import { fetchAllRows, tenantDb, type TenantDb } from '@/lib/supabase/tenant-db';
import { ServiceContext } from '../types';

const isoDay = (d: Date) => d.toISOString().split('T')[0];
const round1 = (n: number) => Math.round(n * 10) / 10;

async function count(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
) {
  const { count: n, error } = await query;
  if (error) throw new Error(`Dashboard count failed: ${error.message}`);
  return n || 0;
}

/** Sum one numeric column over every matching row (paged past the 1000-row cap). */
async function sumColumn(t: TenantDb, table: string, column: string, filter: (q: any) => any) {
  const rows = await fetchAllRows<Record<string, unknown>>(
    () => filter(t.select(table, column)).order('id'),
    `Sum ${table}.${column}`
  );
  return rows.reduce((acc, row) => acc + Number(row[column] || 0), 0);
}

export class DashboardService {
  /**
   * Fetch all farm KPI metrics via Supabase REST (serverless-safe).
   */
  static async getFarmKPIs(ctx: ServiceContext) {
    const t = tenantDb(ctx.tenantId);

    const now = new Date();
    const todayStr = isoDay(now);
    const yesterdayStr = isoDay(new Date(now.getTime() - 86_400_000));
    const monthStartStr = isoDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 86_400_000).toISOString();
    const head = { count: 'exact' as const, head: true };

    const [
      totalAnimals,
      activeAnimals,
      todayMilkRows,
      yesterdayMilk,
      monthMilk,
      pregnant,
      upcomingCalvings,
      monthRevenue,
      monthExpenses,
      feedItems,
    ] = await Promise.all([
      count(t.select('animals', 'id', head)),
      count(t.select('animals', 'id', head).eq('status', 'active')),
      fetchAllRows<{ quantity: number; animal_id: string }>(
        () => t.select('milk_logs', 'quantity, animal_id').eq('date', todayStr).order('id'),
        'Load today milk'
      ),
      sumColumn(t, 'milk_logs', 'quantity', q => q.eq('date', yesterdayStr)),
      sumColumn(t, 'milk_logs', 'quantity', q => q.gte('date', monthStartStr)),
      count(
        t
          .select('breeding_records', 'id', head)
          .eq('pregnancy_confirmed', true)
          .is('actual_birth_date', null)
      ),
      count(
        t
          .select('breeding_records', 'id', head)
          .eq('pregnancy_confirmed', true)
          .is('actual_birth_date', null)
          .gte('expected_due_date', now.toISOString())
          .lte('expected_due_date', thirtyDaysAhead)
      ),
      sumColumn(t, 'sales', 'total', q => q.gte('date', monthStartStr)),
      sumColumn(t, 'expenses', 'amount', q => q.gte('date', monthStartStr)),
      fetchAllRows<{ quantity: number; minimum_stock: number | null }>(
        () =>
          t.select('feed_inventory', 'quantity, minimum_stock').eq('is_active', true).order('id'),
        'Load feed stock'
      ),
    ]);

    const todayMilk = todayMilkRows.reduce((acc, r) => acc + Number(r.quantity || 0), 0);

    return {
      animals: { total: totalAnimals, active: activeAnimals },
      milk: {
        today: round1(todayMilk),
        yesterday: round1(yesterdayMilk),
        month: round1(monthMilk),
        milkingAnimals: new Set(todayMilkRows.map(r => r.animal_id).filter(Boolean)).size,
      },
      breeding: { pregnant, upcomingCalvings },
      finance: {
        monthRevenue,
        monthExpenses,
        monthProfit: monthRevenue - monthExpenses,
      },
      inventory: {
        lowStockItems: feedItems.filter(
          i => i.minimum_stock != null && Number(i.quantity) <= Number(i.minimum_stock)
        ).length,
      },
    };
  }
}
