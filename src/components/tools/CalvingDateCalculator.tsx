'use client';

import { useMemo, useState } from 'react';
import { GESTATION_PERIODS } from '@/lib/breeding-constants';

const SPECIES = [
  { value: 'cow', label: 'Cow', dryOffDays: 60 },
  { value: 'buffalo', label: 'Buffalo', dryOffDays: 60 },
  { value: 'goat', label: 'Goat', dryOffDays: 45 },
  { value: 'sheep', label: 'Sheep', dryOffDays: 45 },
] as const;

type Species = (typeof SPECIES)[number]['value'];

const DAY_MS = 86_400_000;
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);
const fmt = (d: Date) =>
  d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function calvingPlan(species: Species, breedingDate: Date) {
  const gestation = GESTATION_PERIODS[species];
  const dryOffDays = SPECIES.find(s => s.value === species)!.dryOffDays;
  const due = addDays(breedingDate, gestation.average);
  return {
    gestationDays: gestation.average,
    returnToHeatCheck: addDays(breedingDate, 21),
    pregnancyCheck: { from: addDays(breedingDate, 30), to: addDays(breedingDate, 60) },
    dryOff: addDays(due, -dryOffDays),
    steamingUp: addDays(due, -21),
    dueEarliest: addDays(breedingDate, gestation.min),
    due,
    dueLatest: addDays(breedingDate, gestation.max),
  };
}

export function CalvingDateCalculator() {
  const [species, setSpecies] = useState<Species>('buffalo');
  const [date, setDate] = useState('');

  const plan = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return calvingPlan(species, new Date(`${date}T00:00:00Z`));
  }, [species, date]);

  const rows = plan
    ? [
        ['Check for return to heat', fmt(plan.returnToHeatCheck)],
        [
          'Pregnancy check (vet)',
          `${fmt(plan.pregnancyCheck.from)} – ${fmt(plan.pregnancyCheck.to)}`,
        ],
        ['Dry off', fmt(plan.dryOff)],
        ['Start steaming up', fmt(plan.steamingUp)],
        ['Expected calving date', fmt(plan.due)],
        ['Normal calving window', `${fmt(plan.dueEarliest)} – ${fmt(plan.dueLatest)}`],
      ]
    : [];

  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>
          Animal
          <select
            className='mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-800'
            value={species}
            onChange={e => setSpecies(e.target.value as Species)}
          >
            {SPECIES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label} (~{GESTATION_PERIODS[s.value].average} days)
              </option>
            ))}
          </select>
        </label>
        <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>
          Breeding / insemination date
          <input
            type='date'
            className='mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-800'
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </label>
      </div>

      {plan ? (
        <dl className='mt-6 divide-y divide-slate-100 dark:divide-slate-800'>
          {rows.map(([label, value]) => (
            <div
              key={label}
              className={`flex flex-col gap-1 py-3 sm:flex-row sm:justify-between ${
                label === 'Expected calving date'
                  ? 'font-bold text-emerald-700 dark:text-emerald-400'
                  : ''
              }`}
            >
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className='mt-6 text-sm text-slate-500'>
          Choose the animal and enter the breeding date.
        </p>
      )}
    </div>
  );
}
