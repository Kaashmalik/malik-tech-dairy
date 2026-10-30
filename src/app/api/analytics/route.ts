// API Route: Analytics Dashboard Data
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { fetchAllRows, tenantDb } from '@/lib/supabase/tenant-db';
import { logger } from '@/lib/logger';
import { format, subDays, subYears, startOfDay, endOfDay } from 'date-fns';
export const dynamic = 'force-dynamic';
interface AnalyticsData {
  milkYield: {
    trend30d: Array<{ date: string; total: number }>;
    trend90d: Array<{ date: string; total: number }>;
    trend1y: Array<{ date: string; total: number }>;
  };
  expenseVsRevenue: {
    expenses: Array<{ date: string; amount: number }>;
    revenue: Array<{ date: string; amount: number }>;
  };
  healthScore: number;
}
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const t = tenantDb(context.tenantId);
      const today = new Date();
      const day = (d: Date) => format(d, 'yyyy-MM-dd');
      const start30d = day(subDays(today, 30));
      const start90d = day(subDays(today, 90));
      const since30d = startOfDay(subDays(today, 30)).toISOString();
      const until = endOfDay(today).toISOString();

      // One year of milk logs covers all three trend windows
      const [milkLogs, expenses, sales, healthRecords] = await Promise.all([
        fetchAllRows<{ date: string; quantity: number | null }>(
          () =>
            t
              .select('milk_logs', 'date, quantity')
              .gte('date', day(subYears(today, 1)))
              .lte('date', day(today))
              .order('date')
              .order('id'),
          'Load milk logs'
        ),
        fetchAllRows<{ date: string; amount: number | null }>(
          () =>
            t
              .select('expenses', 'date, amount')
              .gte('date', since30d)
              .lte('date', until)
              .order('date')
              .order('id'),
          'Load expenses'
        ),
        fetchAllRows<{ date: string; total: number | null }>(
          () =>
            t
              .select('sales', 'date, total')
              .gte('date', since30d)
              .lte('date', until)
              .order('date')
              .order('id'),
          'Load sales'
        ),
        fetchAllRows<{ type: string }>(
          () =>
            t.select('health_records', 'type').gte('date', since30d).lte('date', until).order('id'),
          'Load health records'
        ),
      ]);

      // Process milk yield trends
      const processMilkTrend = (from?: string) => {
        const dailyTotals: Record<string, number> = {};
        for (const log of milkLogs) {
          const date = String(log.date).slice(0, 10);
          if (from && date < from) continue;
          dailyTotals[date] = (dailyTotals[date] || 0) + Number(log.quantity || 0);
        }
        return Object.entries(dailyTotals)
          .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
          .sort((a, b) => a.date.localeCompare(b.date));
      };
      const trend30d = processMilkTrend(start30d);
      const trend90d = processMilkTrend(start90d);
      const trend1y = processMilkTrend();

      // Process expense vs revenue
      const sumByDay = <R extends { date: string }>(rows: R[], value: (r: R) => number) => {
        const totals: Record<string, number> = {};
        for (const row of rows) {
          const date = day(new Date(row.date));
          totals[date] = (totals[date] || 0) + value(row);
        }
        return totals;
      };
      const expenseByDate = sumByDay(expenses, e => Number(e.amount || 0));
      const revenueByDate = sumByDay(sales, s => Number(s.total || 0));
      // Combine all dates
      const allDates = new Set([...Object.keys(expenseByDate), ...Object.keys(revenueByDate)]);
      const expenseVsRevenue = Array.from(allDates)
        .sort()
        .map(date => ({
          date,
          expenses: Math.round((expenseByDate[date] || 0) * 100) / 100,
          revenue: Math.round((revenueByDate[date] || 0) * 100) / 100,
        }));
      // Calculate health score (0-100)
      // Based on: recent checkups (positive), treatments (negative), diseases (very negative)
      let healthScore = 100;
      const recentRecords = healthRecords;
      recentRecords.forEach(record => {
        switch (record.type) {
          case 'checkup':
            healthScore += 2; // Regular checkups are good
            break;
          case 'vaccination':
            healthScore += 3; // Vaccinations are very good
            break;
          case 'treatment':
            healthScore -= 5; // Treatments indicate issues
            break;
          case 'disease':
            healthScore -= 15; // Diseases are serious
            break;
        }
      });
      // Clamp score between 0 and 100
      healthScore = Math.max(0, Math.min(100, healthScore));
      const analyticsData: AnalyticsData = {
        milkYield: {
          trend30d,
          trend90d,
          trend1y,
        },
        expenseVsRevenue: {
          expenses: expenseVsRevenue.map(d => ({ date: d.date, amount: d.expenses })),
          revenue: expenseVsRevenue.map(d => ({ date: d.date, amount: d.revenue })),
        },
        healthScore: Math.round(healthScore),
      };
      return NextResponse.json(analyticsData);
    } catch (error) {
      logger.error('Analytics failed', error, { tenantId: context.tenantId });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
