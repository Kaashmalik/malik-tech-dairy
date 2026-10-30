'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyAnimals } from '@/components/ui/empty-state';
import { invalidateMilkQueries } from '@/lib/query/farm-cache';

const MILKING_SPECIES = ['cow', 'cattle', 'buffalo', 'goat', 'sheep'];
const NON_MILKING_STATUSES = ['deceased', 'sold'];

interface AnimalOption {
  id: string;
  tag: string;
  name?: string | null;
  species?: string;
  gender?: string;
  status?: string;
}

interface RowValues {
  quantity: string;
  fat: string;
  snf: string;
}

type Session = 'morning' | 'evening';

const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v));

/** Whole-herd milk entry for one date + session: one row per milking animal. */
export function BulkMilkEntry() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [session, setSession] = useState<Session>(
    new Date().getHours() < 13 ? 'morning' : 'evening'
  );
  const [values, setValues] = useState<Record<string, RowValues>>({});
  const [showQuality, setShowQuality] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['animals', 'milking'],
    queryFn: async (): Promise<AnimalOption[]> => {
      const all: AnimalOption[] = [];
      for (let page = 1; page <= 20; page++) {
        const res = await fetch(`/api/animals?limit=100&page=${page}`);
        if (!res.ok) throw new Error('Failed to load animals');
        const json = await res.json();
        all.push(...(json.data?.animals || []));
        if (page >= (json.data?.pagination?.totalPages || 1)) break;
      }
      return all;
    },
  });

  // Animals already logged for this date/session are shown as done
  const { data: loggedIds = new Set<string>(), refetch: refetchLogged } = useQuery({
    queryKey: ['milk-logs', 'logged', date, session],
    queryFn: async () => {
      const res = await fetch(`/api/milk?date=${date}&session=${session}&limit=100`);
      if (!res.ok) return new Set<string>();
      const json = await res.json();
      return new Set<string>((json.data?.logs || []).map((l: { animalId: string }) => l.animalId));
    },
  });

  const milkingAnimals = useMemo(
    () =>
      animals.filter(
        a =>
          MILKING_SPECIES.includes((a.species || '').toLowerCase()) &&
          (a.gender || 'female') !== 'male' &&
          !NON_MILKING_STATUSES.includes(a.status || '')
      ),
    [animals]
  );

  const setValue = (id: string, field: keyof RowValues, value: string) =>
    setValues(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { quantity: '', fat: '', snf: '' }), [field]: value },
    }));

  const filledEntries = milkingAnimals
    .filter(a => !loggedIds.has(a.id) && toNumber(values[a.id]?.quantity || '') !== undefined)
    .map(a => ({
      animalId: a.id,
      quantity: toNumber(values[a.id].quantity)!,
      fat: toNumber(values[a.id].fat),
      snf: toNumber(values[a.id].snf),
    }));
  const invalid = filledEntries.find(
    e => !(e.quantity > 0 && e.quantity <= 100) || (e.fat ?? 0) > 20 || (e.snf ?? 0) > 20
  );
  const totalLiters = filledEntries.reduce((s, e) => s + (e.quantity || 0), 0);

  async function handleSubmit() {
    if (filledEntries.length === 0) {
      toast.error('Enter milk quantity for at least one animal');
      return;
    }
    if (invalid) {
      toast.error('Quantities must be between 0.1 and 100 L; fat/SNF at most 20%');
      return;
    }
    setSubmitting(true);
    setRowErrors({});
    try {
      const res = await fetch('/api/milk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, session, entries: filledEntries }),
      });
      const json = await res.json();
      if (!res.ok && !json.loggedCount) {
        toast.error(json.errors?.[0]?.error || json.error || 'Failed to save milk entries');
      } else {
        toast.success(`Saved ${json.loggedCount} entries`);
      }
      const errs: Record<string, string> = {};
      for (const e of json.errors || []) errs[e.animalId] = e.error.replace(/^[A-Z_]+: /, '');
      setRowErrors(errs);
      // Clear saved rows, keep rows that failed
      setValues(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => errs[id])));
      await Promise.all([invalidateMilkQueries(queryClient), refetchLogged()]);
    } catch {
      toast.error('Network error - entries were not saved');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoading && milkingAnimals.length === 0) {
    return <EmptyAnimals />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Herd Milk Entry</CardTitle>
        <CardDescription>
          Record one session for the whole herd. Leave a row empty to skip that animal.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-4 sm:grid-cols-3'>
          <div>
            <Label htmlFor='bulk-date'>Date</Label>
            <Input
              id='bulk-date'
              type='date'
              value={date}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='bulk-session'>Session</Label>
            <select
              id='bulk-session'
              className='border-input bg-background h-10 w-full rounded-md border px-3 text-sm'
              value={session}
              onChange={e => setSession(e.target.value as Session)}
            >
              <option value='morning'>Morning</option>
              <option value='evening'>Evening</option>
            </select>
          </div>
          <label className='flex items-end gap-2 pb-2 text-sm'>
            <input
              type='checkbox'
              checked={showQuality}
              onChange={e => setShowQuality(e.target.checked)}
            />
            Record fat / SNF
          </label>
        </div>

        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/50 text-left'>
              <tr>
                <th className='p-2'>Animal</th>
                <th className='p-2'>Litres</th>
                {showQuality && <th className='p-2'>Fat %</th>}
                {showQuality && <th className='p-2'>SNF %</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className='text-muted-foreground p-4' colSpan={4}>
                    Loading animals…
                  </td>
                </tr>
              )}
              {milkingAnimals.map(a => {
                const done = loggedIds.has(a.id);
                return (
                  <tr key={a.id} className='border-t'>
                    <td className='p-2'>
                      <div className='font-medium'>{a.tag}</div>
                      <div className='text-muted-foreground text-xs'>
                        {a.name || a.species}
                        {rowErrors[a.id] && (
                          <span className='text-destructive ml-2'>{rowErrors[a.id]}</span>
                        )}
                      </div>
                    </td>
                    <td className='p-2'>
                      {done ? (
                        <span className='text-xs text-emerald-600'>Logged ✓</span>
                      ) : (
                        <Input
                          aria-label={`Litres for ${a.tag}`}
                          type='number'
                          inputMode='decimal'
                          step='0.1'
                          min='0'
                          max='100'
                          className='w-24'
                          value={values[a.id]?.quantity || ''}
                          onChange={e => setValue(a.id, 'quantity', e.target.value)}
                        />
                      )}
                    </td>
                    {showQuality && (
                      <td className='p-2'>
                        {!done && (
                          <Input
                            aria-label={`Fat % for ${a.tag}`}
                            type='number'
                            inputMode='decimal'
                            step='0.1'
                            className='w-20'
                            value={values[a.id]?.fat || ''}
                            onChange={e => setValue(a.id, 'fat', e.target.value)}
                          />
                        )}
                      </td>
                    )}
                    {showQuality && (
                      <td className='p-2'>
                        {!done && (
                          <Input
                            aria-label={`SNF % for ${a.tag}`}
                            type='number'
                            inputMode='decimal'
                            step='0.1'
                            className='w-20'
                            value={values[a.id]?.snf || ''}
                            onChange={e => setValue(a.id, 'snf', e.target.value)}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-muted-foreground text-sm'>
            {filledEntries.length} animals · {Math.round(totalLiters * 10) / 10} L total
          </p>
          <Button onClick={handleSubmit} disabled={submitting || filledEntries.length === 0}>
            {submitting ? 'Saving…' : 'Save all entries'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
