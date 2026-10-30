'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface RealtimeMilkLogsProps {
  animalId: string;
}

interface MilkLog {
  id: string;
  date: string;
  session: string;
  quantity: number;
  createdAt?: string;
}

const REFRESH_MS = 30_000;

/** Latest milk logs for one animal, refreshed every 30s (and on window focus). */
export function RealtimeMilkLogs({ animalId }: RealtimeMilkLogsProps) {
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['milk-logs', 'animal', animalId, 'recent'],
    queryFn: async (): Promise<MilkLog[]> => {
      const params = new URLSearchParams({ animalId, limit: '5', page: '1' });
      const res = await fetch(`/api/milk?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load milk logs');
      const json = await res.json();
      return json.data?.logs || json.logs || [];
    },
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });

  if (recentLogs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Milk Logs</CardTitle>
        <CardDescription>Updates automatically when staff log milk</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {recentLogs.map(log => (
            <div key={log.id} className='flex items-center justify-between rounded border p-2'>
              <div>
                <p className='font-medium'>{log.date || 'N/A'}</p>
                <p className='text-muted-foreground text-sm'>
                  {log.session} - {log.quantity}L
                </p>
              </div>
              <div className='text-muted-foreground text-xs'>
                {log.createdAt ? format(new Date(log.createdAt), 'HH:mm') : ''}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
