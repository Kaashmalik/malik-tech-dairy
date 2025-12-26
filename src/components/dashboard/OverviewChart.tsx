'use client';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTheme } from 'next-themes';

const data = [
    { name: 'Mon', total: 120 },
    { name: 'Tue', total: 145 },
    { name: 'Wed', total: 132 },
    { name: 'Thu', total: 168 },
    { name: 'Fri', total: 189 },
    { name: 'Sat', total: 175 },
    { name: 'Sun', total: 210 },
];

export function OverviewChart() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDark ? "#34d399" : "#059669"} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isDark ? "#34d399" : "#059669"} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="name"
                    stroke={isDark ? "#525252" : "#888888"}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke={isDark ? "#525252" : "#888888"}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}L`}
                />
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Production
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                                {payload[0].value} L
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke={isDark ? "#34d399" : "#059669"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    animationDuration={2000}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
