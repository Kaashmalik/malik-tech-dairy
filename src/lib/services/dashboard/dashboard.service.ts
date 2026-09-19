import { getDrizzle } from '@/lib/supabase/server';
import { animals, milkLogs, breedingRecords, feedInventory, sales, expenses } from '@/db/schema';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';
import { ServiceContext } from '../types';

export class DashboardService {
  /**
   * Fetch all farm KPI metrics in efficient tenant-isolated queries
   */
  static async getFarmKPIs(ctx: ServiceContext) {
    const db = getDrizzle();

    const todayStr = new Date().toISOString().split('T')[0];
    const prevDateObj = new Date();
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const yesterdayStr = prevDateObj.toISOString().split('T')[0];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    // 1. Animals counts
    const [animalCounts] = await db
      .select({
        total: count(),
        active: sql<number>`count(case when ${animals.status} = 'active' then 1 end)`,
      })
      .from(animals)
      .where(eq(animals.tenantId, ctx.tenantId));

    // 2. Milk production (today, yesterday, month)
    const [todayMilkRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${milkLogs.quantity}), 0)`,
        milkingCount: sql<number>`count(distinct ${milkLogs.animalId})`,
      })
      .from(milkLogs)
      .where(and(eq(milkLogs.tenantId, ctx.tenantId), eq(milkLogs.date, todayStr)));

    const [yesterdayMilkRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${milkLogs.quantity}), 0)`,
      })
      .from(milkLogs)
      .where(and(eq(milkLogs.tenantId, ctx.tenantId), eq(milkLogs.date, yesterdayStr)));

    const [monthMilkRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${milkLogs.quantity}), 0)`,
      })
      .from(milkLogs)
      .where(and(eq(milkLogs.tenantId, ctx.tenantId), gte(milkLogs.date, monthStartStr)));

    // 3. Breeding metrics
    const [breedingKPIs] = await db
      .select({
        pregnant: sql<number>`count(case when ${breedingRecords.pregnancyConfirmed} = true and ${breedingRecords.actualBirthDate} is null then 1 end)`,
        upcomingCalvings: sql<number>`count(case when ${breedingRecords.pregnancyConfirmed} = true and ${breedingRecords.actualBirthDate} is null and ${breedingRecords.expectedDueDate} >= ${now} and ${breedingRecords.expectedDueDate} <= ${thirtyDaysAhead} then 1 end)`,
      })
      .from(breedingRecords)
      .where(eq(breedingRecords.tenantId, ctx.tenantId));

    // 4. Financial metrics this month
    const [monthSales] = await db
      .select({
        revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
      })
      .from(sales)
      .where(and(eq(sales.tenantId, ctx.tenantId), gte(sales.date, monthStart)));

    const [monthExpenses] = await db
      .select({
        expenses: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(eq(expenses.tenantId, ctx.tenantId), gte(expenses.date, monthStart)));

    // 5. Low stock alerts
    const feedItems = await db
      .select({
        quantity: feedInventory.quantity,
        minimumStock: feedInventory.minimumStock,
      })
      .from(feedInventory)
      .where(eq(feedInventory.tenantId, ctx.tenantId));

    const lowStockCount = feedItems.filter(
      item => item.minimumStock && Number(item.quantity) <= Number(item.minimumStock)
    ).length;

    const totalRevenue = Number(monthSales?.revenue || 0);
    const totalExpenses = Number(monthExpenses?.expenses || 0);

    return {
      animals: {
        total: Number(animalCounts?.total || 0),
        active: Number(animalCounts?.active || 0),
      },
      milk: {
        today: Math.round(Number(todayMilkRow?.total || 0) * 10) / 10,
        yesterday: Math.round(Number(yesterdayMilkRow?.total || 0) * 10) / 10,
        monthlyTotal: Math.round(Number(monthMilkRow?.total || 0) * 10) / 10,
        activeMilkingAnimals: Number(todayMilkRow?.milkingCount || 0),
      },
      breeding: {
        confirmedPregnant: Number(breedingKPIs?.pregnant || 0),
        upcomingCalvings: Number(breedingKPIs?.upcomingCalvings || 0),
      },
      inventory: {
        lowStockAlerts: lowStockCount,
      },
      finance: {
        monthRevenue: totalRevenue,
        monthExpenses: totalExpenses,
        monthNetResult: totalRevenue - totalExpenses,
      },
    };
  }
}
