'use client';

import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Beef, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Alias for semantic clarity
const CowIcon = Beef;

const COLORS = [
  { fill: '#10B981', name: 'Emerald' },
  { fill: '#3B82F6', name: 'Blue' },
  { fill: '#F59E0B', name: 'Amber' },
  { fill: '#8B5CF6', name: 'Purple' },
  { fill: '#EC4899', name: 'Pink' },
  { fill: '#06B6D4', name: 'Cyan' },
];

const SPECIES_ICONS: Record<string, string> = {
  cow: '🐄',
  buffalo: '🐃',
  goat: '🐐',
  sheep: '🐑',
  chicken: '🐔',
  horse: '🐴',
};

export function AnimalsBySpeciesChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await fetch('/api/animals');
      if (!res.ok) return { animals: [] };
      const response = await res.json();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className='flex h-[280px] items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-2 h-8 w-8 animate-spin text-emerald-500' />
          <p className='text-sm text-gray-500'>Loading chart...</p>
        </div>
      </div>
    );
  }

  const animals = data?.animals || [];
  const speciesCount = animals.reduce((acc: Record<string, number>, animal: any) => {
    acc[animal.species] = (acc[animal.species] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(speciesCount).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
    icon: SPECIES_ICONS[name.toLowerCase()] || '🐾',
    color: COLORS[index % COLORS.length].fill,
  }));

  if (chartData.length === 0) {
    return (
      <div className='flex h-[280px] flex-col items-center justify-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30'>
          <CowIcon className='h-8 w-8 text-emerald-500' />
        </div>
        <h4 className='mb-1 font-medium text-gray-900 dark:text-white'>No animals yet</h4>
        <p className='mb-4 max-w-[200px] text-center text-sm text-gray-500 dark:text-gray-400'>
          Add your first animal to see the distribution
        </p>
        <Link
          href='/animals/new'
          className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25'
        >
          <CowIcon className='h-4 w-4' />
          Add Animal
        </Link>
      </div>
    );
  }

  const totalAnimals = animals.length;

  return (
    <div className='space-y-4'>
      {/* Total count badge */}
      <div className='inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 dark:bg-emerald-900/30'>
        <CowIcon className='h-4 w-4 text-emerald-500' />
        <span className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
          Total: {totalAnimals} animals
        </span>
      </div>

      <div className='flex items-center gap-4'>
        {/* Chart */}
        <div className='flex-1'>
          <ResponsiveContainer width='100%' height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey='value'
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke='none' />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number, name: string) => [`${value} animals`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className='flex-shrink-0 space-y-2'>
          {chartData.map((item, index) => (
            <div key={index} className='flex items-center gap-2'>
              <div className='h-3 w-3 rounded-full' style={{ backgroundColor: item.color }} />
              <span className='text-lg'>{item.icon}</span>
              <span className='text-sm text-gray-600 dark:text-gray-400'>{item.name}</span>
              <span className='text-sm font-semibold text-gray-900 dark:text-white'>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
