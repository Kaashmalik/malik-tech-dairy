'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface MilkYieldChartProps {
  data: Array<{ date: string; total: number }>;
}

export function MilkYieldChart({ data }: MilkYieldChartProps) {
  const chartData = data.map(item => ({
    date: format(parseISO(item.date), 'MMM dd'),
    yield: item.total,
  }));

  return (
    <ResponsiveContainer width='100%' height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='date' />
        <YAxis label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line
          type='monotone'
          dataKey='yield'
          stroke='#1F7A3D'
          strokeWidth={2}
          name='Milk Yield (L)'
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
