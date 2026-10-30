'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MonthlyReport {
  month: string;
  totalLiters: number;
  daysRecorded: number;
  averagePerDay: number;
  animals: Array<{
    animalId: string;
    tag: string;
    name: string;
    totalLiters: number;
    daysMilked: number;
    averagePerDay: number;
    averageFat: number | null;
  }>;
  daily: Array<{ date: string; liters: number }>;
}

function downloadCsv(report: MonthlyReport) {
  const escape = (v: string | number | null) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    ['Animal', 'Name', 'Total (L)', 'Days milked', 'Avg / day (L)', 'Avg fat %'].join(','),
    ...report.animals.map(a =>
      [a.tag, a.name, a.totalLiters, a.daysMilked, a.averagePerDay, a.averageFat]
        .map(escape)
        .join(',')
    ),
    '',
    ['Date', 'Litres'].join(','),
    ...report.daily.map(d => [d.date, d.liters].join(',')),
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `milk-${report.month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Month-at-a-glance milk report: totals, per-animal ranking, daily totals, CSV export. */
export function MonthlyMilkReport() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['milk-report', 'monthly', month],
    queryFn: async (): Promise<MonthlyReport> => {
      const res = await fetch(`/api/milk?report=monthly&month=${month}`);
      if (!res.ok) throw new Error('Failed to load report');
      return (await res.json()).data;
    },
  });

  return (
    <Card>
      <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <CardTitle>Monthly Milk Summary</CardTitle>
          <CardDescription>
            Production per animal and per day for the selected month
          </CardDescription>
        </div>
        <div className='flex items-end gap-2'>
          <div>
            <Label htmlFor='milk-month'>Month</Label>
            <Input
              id='milk-month'
              type='month'
              value={month}
              max={format(new Date(), 'yyyy-MM')}
              onChange={e => e.target.value && setMonth(e.target.value)}
            />
          </div>
          <Button
            variant='outline'
            disabled={!report || report.animals.length === 0}
            onClick={() => report && downloadCsv(report)}
          >
            Download CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading && <p className='text-muted-foreground text-sm'>Loading…</p>}
        {isError && <p className='text-destructive text-sm'>Could not load the report.</p>}
        {report && (
          <>
            <div className='grid gap-3 sm:grid-cols-3'>
              {[
                ['Total', `${report.totalLiters} L`],
                ['Days recorded', String(report.daysRecorded)],
                ['Average per day', `${report.averagePerDay} L`],
              ].map(([label, value]) => (
                <div key={label} className='rounded-lg border p-3'>
                  <p className='text-muted-foreground text-xs'>{label}</p>
                  <p className='text-xl font-semibold'>{value}</p>
                </div>
              ))}
            </div>
            {report.animals.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No milk recorded in this month.</p>
            ) : (
              <div className='overflow-x-auto rounded-md border'>
                <table className='w-full text-sm'>
                  <thead className='bg-muted/50 text-left'>
                    <tr>
                      <th className='p-2'>Animal</th>
                      <th className='p-2 text-right'>Total (L)</th>
                      <th className='p-2 text-right'>Days</th>
                      <th className='p-2 text-right'>Avg / day</th>
                      <th className='p-2 text-right'>Avg fat %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.animals.map(a => (
                      <tr key={a.animalId} className='border-t'>
                        <td className='p-2'>
                          <span className='font-medium'>{a.tag}</span>
                          {a.name && <span className='text-muted-foreground ml-2'>{a.name}</span>}
                        </td>
                        <td className='p-2 text-right'>{a.totalLiters}</td>
                        <td className='p-2 text-right'>{a.daysMilked}</td>
                        <td className='p-2 text-right'>{a.averagePerDay}</td>
                        <td className='p-2 text-right'>{a.averageFat ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
