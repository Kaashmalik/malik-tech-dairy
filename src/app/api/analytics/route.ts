// API Route: Analytics Dashboard Data
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getTenantSubcollection } from '@/lib/firebase/tenant';
import { adminDb } from '@/lib/firebase/admin';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
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
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || '30d';
      // Get date ranges
      const today = new Date();
      const start30d = subDays(today, 30);
      const start90d = subDays(today, 90);
      const start1y = subYears(today, 1);
      // Fetch milk logs
      const milkLogsRef = getTenantSubcollection(context.tenantId, 'milkLogs', 'logs');
      // Fetch expenses
      const expensesRef = getTenantSubcollection(context.tenantId, 'expenses', 'records');
      // Fetch sales
      const salesRef = getTenantSubcollection(context.tenantId, 'sales', 'records');
      // Fetch health records
      const healthRef = getTenantSubcollection(context.tenantId, 'health', 'records');
      // Fetch all data in parallel
      const [milkLogs30d, milkLogs90d, milkLogs1y, expenses, sales, healthRecords] =
        await Promise.all([
          milkLogsRef
            .where('date', '>=', format(start30d, 'yyyy-MM-dd'))
            .where('date', '<=', format(today, 'yyyy-MM-dd'))
            .get(),
          milkLogsRef
            .where('date', '>=', format(start90d, 'yyyy-MM-dd'))
            .where('date', '<=', format(today, 'yyyy-MM-dd'))
            .get(),
          milkLogsRef
            .where('date', '>=', format(start1y, 'yyyy-MM-dd'))
            .where('date', '<=', format(today, 'yyyy-MM-dd'))
            .get(),
          expensesRef
            .where('date', '>=', startOfDay(start30d))
            .where('date', '<=', endOfDay(today))
            .get(),
          salesRef
            .where('date', '>=', startOfDay(start30d))
            .where('date', '<=', endOfDay(today))
            .get(),
          healthRef
            .where('date', '>=', startOfDay(subDays(today, 90)))
            .where('date', '<=', endOfDay(today))
            .get(),
        ]);
      // Process milk yield trends
      const processMilkTrend = (logs: any[]) => {
        const dailyTotals: Record<string, number> = {};
        logs.forEach(doc => {
          const log = doc.data();
          const date = log.date;
          dailyTotals[date] = (dailyTotals[date] || 0) + (log.quantity || 0);
        });
        return Object.entries(dailyTotals)
          .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
          .sort((a, b) => a.date.localeCompare(b.date));
      };
      const trend30d = processMilkTrend(milkLogs30d.docs);
      const trend90d = processMilkTrend(milkLogs90d.docs);
      const trend1y = processMilkTrend(milkLogs1y.docs);
      // Process expense vs revenue
      const expenseByDate: Record<string, number> = {};
      expenses.docs.forEach(doc => {
        const expense = doc.data();
        const date = format(expense.date.toDate(), 'yyyy-MM-dd');
        expenseByDate[date] = (expenseByDate[date] || 0) + (expense.amount || 0);
      });
      const revenueByDate: Record<string, number> = {};
      sales.docs.forEach(doc => {
        const sale = doc.data();
        const date = format(sale.date.toDate(), 'yyyy-MM-dd');
        revenueByDate[date] = (revenueByDate[date] || 0) + (sale.total || 0);
      });
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
      const recentRecords = healthRecords.docs
        .map(doc => doc.data())
        .filter(record => {
          const recordDate = record.date.toDate();
          return recordDate >= startOfDay(subDays(today, 30));
        });
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
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}