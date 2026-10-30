'use client';

import { useState } from 'react';

/** Average milk density used by buyers to convert litres to kg. */
export const MILK_DENSITY_KG_PER_L = 1.03;

export type PricingMethod = 'ts' | 'fat_snf' | 'per_litre';

export interface MilkPriceInput {
  litres: number;
  fat: number; // %
  snf: number; // %
  method: PricingMethod;
  tsRate: number; // PKR per kg total solids
  fatRate: number; // PKR per kg fat
  snfRate: number; // PKR per kg SNF
  litreRate: number; // PKR per litre
}

export function milkPrice(input: MilkPriceInput) {
  const kg = input.litres * MILK_DENSITY_KG_PER_L;
  const fatKg = (kg * input.fat) / 100;
  const snfKg = (kg * input.snf) / 100;
  const total =
    input.method === 'ts'
      ? (fatKg + snfKg) * input.tsRate
      : input.method === 'fat_snf'
        ? fatKg * input.fatRate + snfKg * input.snfRate
        : input.litres * input.litreRate;
  return {
    kg,
    fatKg,
    snfKg,
    tsKg: fatKg + snfKg,
    total,
    perLitre: input.litres > 0 ? total / input.litres : 0,
  };
}

const num = (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pkr = (n: number) => `Rs ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>
      {props.label}
      <input
        type='number'
        inputMode='decimal'
        min='0'
        step={props.step || 'any'}
        className='mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-800'
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
      />
    </label>
  );
}

export function MilkPriceCalculator() {
  const [litres, setLitres] = useState('100');
  const [fat, setFat] = useState('6.5');
  const [snf, setSnf] = useState('9');
  const [method, setMethod] = useState<PricingMethod>('ts');
  const [tsRate, setTsRate] = useState('');
  const [fatRate, setFatRate] = useState('');
  const [snfRate, setSnfRate] = useState('');
  const [litreRate, setLitreRate] = useState('');

  const result = milkPrice({
    litres: num(litres),
    fat: num(fat),
    snf: num(snf),
    method,
    tsRate: num(tsRate),
    fatRate: num(fatRate),
    snfRate: num(snfRate),
    litreRate: num(litreRate),
  });
  const hasRate =
    (method === 'ts' && num(tsRate) > 0) ||
    (method === 'fat_snf' && (num(fatRate) > 0 || num(snfRate) > 0)) ||
    (method === 'per_litre' && num(litreRate) > 0);

  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
      <div className='grid gap-4 sm:grid-cols-3'>
        <Field label='Milk (litres)' value={litres} onChange={setLitres} />
        <Field label='Fat %' value={fat} onChange={setFat} step='0.1' />
        <Field label='SNF %' value={snf} onChange={setSnf} step='0.1' />
      </div>

      <fieldset className='mt-6'>
        <legend className='text-sm font-medium text-slate-700 dark:text-slate-300'>
          How does your buyer pay?
        </legend>
        <div className='mt-2 flex flex-wrap gap-2'>
          {(
            [
              ['ts', 'Per kg total solids (TS)'],
              ['fat_snf', 'Separate fat & SNF rates'],
              ['per_litre', 'Flat rate per litre'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type='button'
              onClick={() => setMethod(value)}
              className={`rounded-full border px-4 py-2 text-sm ${
                method === value
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        {method === 'ts' && (
          <Field label='Rate (Rs per kg TS)' value={tsRate} onChange={setTsRate} />
        )}
        {method === 'fat_snf' && (
          <>
            <Field label='Fat rate (Rs per kg fat)' value={fatRate} onChange={setFatRate} />
            <Field label='SNF rate (Rs per kg SNF)' value={snfRate} onChange={setSnfRate} />
          </>
        )}
        {method === 'per_litre' && (
          <Field label='Rate (Rs per litre)' value={litreRate} onChange={setLitreRate} />
        )}
      </div>

      <div className='mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3 dark:bg-slate-800/60'>
        <div>
          <p className='text-slate-500'>Milk weight</p>
          <p className='font-semibold'>{result.kg.toFixed(1)} kg</p>
        </div>
        <div>
          <p className='text-slate-500'>Fat / SNF</p>
          <p className='font-semibold'>
            {result.fatKg.toFixed(2)} kg / {result.snfKg.toFixed(2)} kg
          </p>
        </div>
        <div>
          <p className='text-slate-500'>Total solids</p>
          <p className='font-semibold'>{result.tsKg.toFixed(2)} kg</p>
        </div>
      </div>

      <div className='mt-4 rounded-xl border border-emerald-200 p-4 dark:border-emerald-900'>
        {hasRate ? (
          <>
            <p className='text-sm text-slate-500'>Estimated value</p>
            <p className='text-3xl font-extrabold text-emerald-700 dark:text-emerald-400'>
              {pkr(result.total)}
            </p>
            <p className='text-sm text-slate-500'>≈ {pkr(result.perLitre)} per litre</p>
          </>
        ) : (
          <p className='text-sm text-slate-500'>Enter your buyer’s rate to see the value.</p>
        )}
      </div>
      <p className='mt-3 text-xs text-slate-500'>
        Uses an average density of {MILK_DENSITY_KG_PER_L} kg per litre. Buyers&apos; formulas
        differ — confirm the exact method and rates with your collection centre.
      </p>
    </div>
  );
}
