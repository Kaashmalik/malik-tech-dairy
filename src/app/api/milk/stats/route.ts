// API Route: Get Milk Statistics
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import { adminDb } from "@/lib/firebase/admin";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const { searchParams } = new URL(req.url);
      const days = parseInt(searchParams.get("days") || "7");

      const milkLogsRef = getTenantSubcollection(
        context.tenantId,
        "milkLogs",
        "logs"
      );

      const today = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

      // Get logs for the period
      const snapshot = await milkLogsRef
        .where("date", ">=", startDate)
        .where("date", "<=", today)
        .get();

      const logs = snapshot.docs.map((doc) => doc.data());

      // Calculate today's total
      const todayLogs = logs.filter((log) => log.date === today);
      const todayTotal = todayLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);

      // Calculate daily totals for chart
      const dailyTotals: Record<string, number> = {};
      logs.forEach((log) => {
        const date = log.date;
        dailyTotals[date] = (dailyTotals[date] || 0) + (log.quantity || 0);
      });

      // Calculate average per day
      const uniqueDates = Object.keys(dailyTotals);
      const averagePerDay =
        uniqueDates.length > 0
          ? Object.values(dailyTotals).reduce((sum, val) => sum + val, 0) /
            uniqueDates.length
          : 0;

      // Calculate total for period
      const periodTotal = logs.reduce((sum, log) => sum + (log.quantity || 0), 0);

      return NextResponse.json({
        todayTotal: Math.round(todayTotal * 100) / 100,
        periodTotal: Math.round(periodTotal * 100) / 100,
        averagePerDay: Math.round(averagePerDay * 100) / 100,
        dailyTotals: Object.entries(dailyTotals)
          .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      });
    } catch (error) {
      console.error("Error fetching milk stats:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

