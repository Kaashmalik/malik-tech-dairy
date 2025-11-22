"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, addDays, parseISO } from "date-fns";

interface ForecastChartProps {
  predictions: Array<{ date: string; value: number }>;
  confidenceBand: Array<{ date: string; lower: number; upper: number }>;
}

export function ForecastChart({ predictions, confidenceBand }: ForecastChartProps) {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No predictions available yet.</p>
        <p className="text-sm mt-2">
          Predictions are generated daily. Please check back tomorrow.
        </p>
      </div>
    );
  }

  // Combine predictions with confidence band
  const chartData = predictions.map((pred) => {
    const band = confidenceBand.find((b) => b.date === pred.date);
    return {
      date: format(parseISO(pred.date), "MMM dd"),
      forecast: pred.value,
      lower: band?.lower || pred.value * 0.9,
      upper: band?.upper || pred.value * 1.1,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: "Liters", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="upper"
          stroke="none"
          fill="url(#confidenceGradient)"
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="lower"
          stroke="none"
          fill="#fff"
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Forecast"
          dot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

