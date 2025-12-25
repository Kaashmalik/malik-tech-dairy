// API Route: Get Milk Statistics (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const { searchParams } = new URL(req.url);
      const days = parseInt(searchParams.get('days') || '7');
      const today = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      // Get logs for the period from Supabase
      const { data: logs, error } = (await supabase
        .from('milk_logs')
        .select('date, quantity, session')
        .eq('tenant_id', context.tenantId)
        .gte('date', startDate)
        .lte('date', today)) as { data: any[] | null; error: any };
      if (error) {
        // Return empty stats instead of error for graceful degradation
        return NextResponse.json({
          success: true,
          todayTotal: 0,
          periodTotal: 0,
          averagePerDay: 0,
          dailyTotals: [],
          message: 'No milk data available',
        });
      }
      const milkLogs = logs || [];
      // Calculate today's total
      const todayLogs = milkLogs.filter((log: any) => log.date === today);
      const todayTotal = todayLogs.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
      // Calculate daily totals for chart
      const dailyTotals: Record<string, number> = {};
      milkLogs.forEach((log: any) => {
        const date = log.date;
        dailyTotals[date] = (dailyTotals[date] || 0) + (log.quantity || 0);
      });
      // Calculate average per day
      const uniqueDates = Object.keys(dailyTotals);
      const averagePerDay =
        uniqueDates.length > 0
          ? Object.values(dailyTotals).reduce((sum, val) => sum + val, 0) / uniqueDates.length
          : 0;
      // Calculate total for period
      const periodTotal = milkLogs.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
      return NextResponse.json({
        success: true,
        todayTotal: Math.round(todayTotal * 100) / 100,
        periodTotal: Math.round(periodTotal * 100) / 100,
        averagePerDay: Math.round(averagePerDay * 100) / 100,
        dailyTotals: Object.entries(dailyTotals)
          .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      });
    } catch (error) {
      // Return empty stats for graceful degradation
      return NextResponse.json({
        success: true,
        todayTotal: 0,
        periodTotal: 0,
        averagePerDay: 0,
        dailyTotals: [],
        message: 'Error loading milk statistics',
      });
    }
  })(request);
}