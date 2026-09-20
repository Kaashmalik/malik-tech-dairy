import { getSupabaseClient } from '@/lib/supabase/server';
import { ServiceContext } from '../types';

export class DashboardService {
  /**
   * Fetch all farm KPI metrics via Supabase REST (serverless-safe).
   */
  static async getFarmKPIs(ctx: ServiceContext) {
    const supabase = getSupabaseClient();
    const tenantId = ctx.tenantId;

    const todayStr = new Date().toISOString().split('T')[0];
    const prevDateObj = new Date();
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const yesterdayStr = prevDateObj.toISOString().split('T')[0];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
    const thirtyDaysAheadStr = thirtyDaysAhead.toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const [
      animalsRes,
      activeAnimalsRes,
      todayMilkRes,
      yesterdayMilkRes,
      monthMilkRes,
      pregnantRes,
      upcomingRes,
      salesRes,
      expensesRes,
      feedRes,
    ] = await Promise.all([
      sb.from('animals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      sb
        .from('animals')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'active'),
      sb
        .from('milk_logs')
        .select('quantity, animal_id')
        .eq('tenant_id', tenantId)
        .eq('date', todayStr),
      sb.from('milk_logs').select('quantity').eq('tenant_id', tenantId).eq('date', yesterdayStr),
      sb.from('milk_logs').select('quantity').eq('tenant_id', tenantId).gte('date', monthStartStr),
      sb
        .from('breeding_records')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('pregnancy_confirmed', true)
        .is('actual_birth_date', null),
      sb
        .from('breeding_records')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('pregnancy_confirmed', true)
        .is('actual_birth_date', null)
        .gte('expected_due_date', now.toISOString())
        .lte('expected_due_date', thirtyDaysAheadStr),
      sb.from('sales').select('total').eq('tenant_id', tenantId).gte('date', monthStartStr),
      sb.from('expenses').select('amount').eq('tenant_id', tenantId).gte('date', monthStartStr),
      sb.from('feed_inventory').select('quantity, minimum_stock').eq('tenant_id', tenantId),
    ]);

    const sumField = (
      rows: { quantity?: number; total?: number; amount?: number }[] | null,
      key: 'quantity' | 'total' | 'amount'
    ) => (rows || []).reduce((acc, row) => acc + Number(row[key] || 0), 0);

    const todayMilkRows = todayMilkRes.data || [];
    const todayMilk = sumField(todayMilkRows, 'quantity');
    const milkingCount = new Set(
      todayMilkRows.map((r: { animal_id?: string }) => r.animal_id).filter(Boolean)
    ).size;

    const totalRevenue = sumField(salesRes.data, 'total');
    const totalExpenses = sumField(expensesRes.data, 'amount');
    const feedItems = feedRes.data || [];
    const lowStockCount = feedItems.filter(
      (item: { quantity?: number; minimum_stock?: number }) =>
        item.minimum_stock != null && Number(item.quantity) <= Number(item.minimum_stock)
    ).length;

    return {
      animals: {
        total: animalsRes.count || 0,
        active: activeAnimalsRes.count || 0,
      },
      milk: {
        today: todayMilk,
        yesterday: sumField(yesterdayMilkRes.data, 'quantity'),
        month: sumField(monthMilkRes.data, 'quantity'),
        milkingAnimals: milkingCount,
      },
      breeding: {
        pregnant: pregnantRes.count || 0,
        upcomingCalvings: upcomingRes.count || 0,
      },
      finance: {
        monthRevenue: totalRevenue,
        monthExpenses: totalExpenses,
        monthProfit: totalRevenue - totalExpenses,
      },
      inventory: {
        lowStockItems: lowStockCount,
      },
    };
  }
}
