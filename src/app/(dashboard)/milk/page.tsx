'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Droplets, Sun, Moon, TrendingUp, TrendingDown, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function MilkLogsPage() {
  const [page, setPage] = useState(1);
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Daily summary query
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['milk-summary'],
    queryFn: async () => {
      const res = await fetch('/api/milk?summary=true');
      if (!res.ok) return null;
      const json = await res.json();
      return json.summary || json.data;
    },
    staleTime: 60000,
  });

  // Logs list query
  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['milk-logs', page, sessionFilter, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (sessionFilter !== 'all') {
        params.append('session', sessionFilter);
      }
      if (dateFilter) {
        params.append('date', dateFilter);
      }
      const res = await fetch(`/api/milk?${params.toString()}`);
      if (!res.ok) return { logs: [], pagination: { total: 0, totalPages: 1 } };
      const json = await res.json();
      return {
        logs: json.logs || json.data?.logs || [],
        pagination: json.data?.pagination || { total: 0, totalPages: 1, page: 1, limit: 20 },
      };
    },
    staleTime: 30000,
  });

  const summary = summaryData;
  const logs = logsData?.logs || [];
  const pagination = logsData?.pagination || { total: 0, totalPages: 1, page: 1 };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Milk Production</h1>
          <p className='text-muted-foreground'>
            Monitor daily milking performance, record yield sessions, and track dairy herd trends.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Link href='/milk/new'>
            <Button className='gap-2'>
              <Plus className='h-4 w-4' />
              Log Milk
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Today&apos;s Total</CardTitle>
            <Droplets className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className='h-8 w-24' />
            ) : (
              <div>
                <div className='text-2xl font-bold'>{summary?.todayTotal?.toFixed(1) || '0.0'} L</div>
                <div className='flex items-center gap-1 text-xs text-muted-foreground mt-1'>
                  {summary?.percentChange !== undefined && (
                    <>
                      {summary.percentChange >= 0 ? (
                        <span className='text-emerald-600 flex items-center font-medium'>
                          <TrendingUp className='h-3 w-3 mr-0.5' />
                          +{summary.percentChange}%
                        </span>
                      ) : (
                        <span className='text-rose-600 flex items-center font-medium'>
                          <TrendingDown className='h-3 w-3 mr-0.5' />
                          {summary.percentChange}%
                        </span>
                      )}
                      <span>vs yesterday ({summary?.yesterdayTotal?.toFixed(1) || '0'} L)</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Morning Session</CardTitle>
            <Sun className='h-4 w-4 text-amber-500' />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className='h-8 w-24' />
            ) : (
              <div>
                <div className='text-2xl font-bold'>{summary?.morningTotal?.toFixed(1) || '0.0'} L</div>
                <p className='text-xs text-muted-foreground mt-1'>Early yield</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Evening Session</CardTitle>
            <Moon className='h-4 w-4 text-indigo-500' />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className='h-8 w-24' />
            ) : (
              <div>
                <div className='text-2xl font-bold'>{summary?.eveningTotal?.toFixed(1) || '0.0'} L</div>
                <p className='text-xs text-muted-foreground mt-1'>Late yield</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Herd Average</CardTitle>
            <Droplets className='h-4 w-4 text-emerald-500' />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className='h-8 w-24' />
            ) : (
              <div>
                <div className='text-2xl font-bold'>{summary?.averagePerAnimal?.toFixed(1) || '0.0'} L/head</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {summary?.activeMilkingAnimals || 0} active milking animals
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
            <div className='flex flex-wrap items-center gap-3 w-full sm:w-auto'>
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>Filters:</span>
              </div>
              <select
                value={sessionFilter}
                onChange={e => {
                  setSessionFilter(e.target.value);
                  setPage(1);
                }}
                className='rounded-md border bg-background px-3 py-1.5 text-sm ring-offset-background'
              >
                <option value='all'>All Sessions</option>
                <option value='morning'>Morning Only</option>
                <option value='evening'>Evening Only</option>
              </select>

              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <input
                  type='date'
                  value={dateFilter}
                  onChange={e => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className='rounded-md border bg-background px-3 py-1.5 text-sm ring-offset-background'
                />
              </div>

              {(sessionFilter !== 'all' || dateFilter) && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setSessionFilter('all');
                    setDateFilter('');
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className='text-sm text-muted-foreground'>
              Showing {logs.length} records {pagination.total > 0 && `of ${pagination.total}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milk Logs List */}
      {isLogsLoading ? (
        <div className='space-y-3'>
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className='pb-2'>
                <Skeleton className='h-5 w-1/3' />
              </CardHeader>
              <CardContent>
                <Skeleton className='mb-2 h-7 w-1/4' />
                <Skeleton className='h-4 w-1/2' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className='py-16 text-center space-y-4'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950'>
              <Droplets className='h-6 w-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <h3 className='text-lg font-medium'>No milk logs found</h3>
              <p className='text-muted-foreground text-sm max-w-md mx-auto mt-1'>
                {sessionFilter !== 'all' || dateFilter
                  ? 'No records matched your current filter criteria. Try adjusting the filters above.'
                  : 'Start recording your herd daily milking sessions to track production metrics and trends.'}
              </p>
            </div>
            <Link href='/milk/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Log First Milk Entry
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {logs.map((log: any) => (
            <Card key={log.id} className='hover:border-primary/40 transition-colors'>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='flex items-start sm:items-center gap-4'>
                    <div className={`p-2.5 rounded-lg ${log.session === 'morning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'}`}>
                      {log.session === 'morning' ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-base'>
                          {log.animalTag || 'Animal'}
                        </span>
                        {log.animalName && (
                          <span className='text-muted-foreground text-sm font-normal'>
                            • {log.animalName}
                          </span>
                        )}
                        <span className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted capitalize'>
                          {log.session}
                        </span>
                      </div>
                      <p className='text-muted-foreground text-xs mt-0.5'>
                        {format(new Date(log.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-6 self-end sm:self-auto'>
                    <div className='text-right'>
                      <div className='text-2xl font-bold tracking-tight text-foreground'>
                        {log.quantity} <span className='text-sm font-normal text-muted-foreground'>L</span>
                      </div>
                      {log.quality && (
                        <p className='text-xs text-muted-foreground'>Quality: {log.quality}/10</p>
                      )}
                    </div>
                    {log.notes && (
                      <p className='hidden md:block max-w-xs text-xs text-muted-foreground text-right italic truncate'>
                        &ldquo;{log.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className='flex items-center justify-between pt-4'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className='gap-1'
              >
                <ChevronLeft className='h-4 w-4' /> Previous
              </Button>
              <span className='text-sm text-muted-foreground'>
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className='gap-1'
              >
                Next <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
