// BullMQ Processor: Milk Production Forecasting with Prophet.js
import { Job } from "bullmq";
import { adminDb } from "@/lib/firebase/admin";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import { format, subDays, addDays, parseISO } from "date-fns";

interface MilkLogData {
  date: string;
  quantity: number;
}

interface Prediction {
  date: string;
  value: number;
}

interface ConfidenceBand {
  date: string;
  lower: number;
  upper: number;
}

/**
 * Simple time series forecasting using moving average and trend
 * For production, replace with actual Prophet.js implementation
 */
function forecastMilkProduction(
  historicalData: MilkLogData[],
  days: number = 7
): { predictions: Prediction[]; confidenceBand: ConfidenceBand[] } {
  if (historicalData.length < 7) {
    // Not enough data, return flat predictions
    const today = new Date();
    const predictions: Prediction[] = [];
    const confidenceBand: ConfidenceBand[] = [];

    for (let i = 1; i <= days; i++) {
      const date = addDays(today, i);
      const avg = historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + d.quantity, 0) / historicalData.length
        : 0;
      
      predictions.push({
        date: format(date, "yyyy-MM-dd"),
        value: avg,
      });
      
      confidenceBand.push({
        date: format(date, "yyyy-MM-dd"),
        lower: avg * 0.85,
        upper: avg * 1.15,
      });
    }

    return { predictions, confidenceBand };
  }

  // Calculate moving average (last 7 days)
  const recentData = historicalData.slice(-7);
  const avg = recentData.reduce((sum, d) => sum + d.quantity, 0) / recentData.length;

  // Calculate trend (simple linear regression on last 14 days)
  const trendData = historicalData.slice(-14);
  let trend = 0;
  if (trendData.length >= 2) {
    const first = trendData[0].quantity;
    const last = trendData[trendData.length - 1].quantity;
    trend = (last - first) / trendData.length;
  }

  // Generate predictions
  const today = new Date();
  const predictions: Prediction[] = [];
  const confidenceBand: ConfidenceBand[] = [];

  for (let i = 1; i <= days; i++) {
    const date = addDays(today, i);
    const predictedValue = avg + (trend * i);
    
    predictions.push({
      date: format(date, "yyyy-MM-dd"),
      value: Math.max(0, predictedValue), // Ensure non-negative
    });
    
    // Confidence band: ±15% with trend adjustment
    const confidence = 0.15;
    confidenceBand.push({
      date: format(date, "yyyy-MM-dd"),
      lower: Math.max(0, predictedValue * (1 - confidence)),
      upper: predictedValue * (1 + confidence),
    });
  }

  return { predictions, confidenceBand };
}

export async function processMilkForecast(job: Job) {
  const { tenantId } = job.data;

  if (!adminDb) {
    throw new Error("Database not available");
  }

  try {
    console.log(`Processing milk forecast for tenant: ${tenantId}`);

    // Fetch last 365 days of milk logs
    const milkLogsRef = getTenantSubcollection(tenantId, "milkLogs", "logs");
    const startDate = format(subDays(new Date(), 365), "yyyy-MM-dd");
    const endDate = format(new Date(), "yyyy-MM-dd");

    const snapshot = await milkLogsRef
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "asc")
      .get();

    // Aggregate by date (sum morning + evening sessions)
    const dailyTotals: Record<string, number> = {};
    snapshot.docs.forEach((doc) => {
      const log = doc.data();
      const date = log.date;
      dailyTotals[date] = (dailyTotals[date] || 0) + (log.quantity || 0);
    });

    // Convert to array and sort
    const historicalData: MilkLogData[] = Object.entries(dailyTotals)
      .map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Generate 7-day forecast
    const { predictions, confidenceBand } = forecastMilkProduction(historicalData, 7);

    // Store predictions in Firestore
    const predictionsRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("predictions")
      .doc("milk_7d");

    await predictionsRef.set({
      predictions,
      confidenceBand,
      lastUpdated: new Date(),
      modelVersion: "1.0",
      historicalDataPoints: historicalData.length,
    }, { merge: true });

    console.log(`Forecast generated for tenant ${tenantId}: ${predictions.length} predictions`);

    return {
      success: true,
      tenantId,
      predictionsCount: predictions.length,
    };
  } catch (error) {
    console.error(`Error processing forecast for tenant ${tenantId}:`, error);
    throw error;
  }
}

