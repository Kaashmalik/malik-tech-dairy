'use client';

import React, { useState } from 'react';
import { AnimalCard, AnimalGrid, StatsCard } from '@/components/ui/animal-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Users,
  Heart,
  Activity,
  TrendingUp,
} from 'lucide-react';

// Mock data for demonstration
const mockAnimals = [
  {
    id: '1',
    tag: 'COW-001',
    name: 'Bessie',
    breed: 'Holstein',
    status: 'active',
    lastMilkYield: 25,
    lastHealthCheck: '2024-01-15',
    nextVaccination: '2024-02-01',
  },
  {
    id: '2',
    tag: 'COW-002',
    name: 'Daisy',
    breed: 'Jersey',
    status: 'active',
    lastMilkYield: 18,
    lastHealthCheck: '2024-01-10',
    nextVaccination: '2024-01-25',
  },
  {
    id: '3',
    tag: 'BUF-001',
    name: 'Ganga',
    breed: 'Buffalo',
    status: 'sick',
    lastMilkYield: 15,
    lastHealthCheck: '2024-01-20',
    nextVaccination: '2024-02-05',
  },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      {/* Background pattern */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10' />
        <div
          className='absolute inset-0'
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className='relative z-10'>
        {/* Header */}
        <header className='sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl'>
          <div className='container mx-auto px-4 py-4'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-white'>Farm Dashboard</h1>
                <p className='text-sm text-white/60'>Green Valley Dairy</p>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='border-white/20 text-white hover:bg-white/10'
                >
                  <Download className='mr-2 h-4 w-4' />
                  Export
                </Button>
                <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Animal
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className='container mx-auto space-y-6 px-4 py-6'>
          {/* Stats Grid */}
          <section className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <StatsCard
              title='Total Animals'
              value={156}
              change='+12 this month'
              icon={Users}
              trend='up'
            />
            <StatsCard
              title='Milk Production'
              value='2,450L'
              change='+5% vs last week'
              icon={Activity}
              trend='up'
            />
            <StatsCard
              title='Health Score'
              value='94%'
              change='-2% vs last week'
              icon={Heart}
              trend='down'
            />
            <StatsCard
              title='Active Breedings'
              value={8}
              change='3 due this week'
              icon={TrendingUp}
              trend='neutral'
            />
          </section>

          {/* Quick Actions */}
          <section className='flex flex-wrap gap-2'>
            <Badge variant='outline' className='border-white/20 px-3 py-1 text-white'>
              <Calendar className='mr-1 h-3 w-3' />3 Checkups Today
            </Badge>
            <Badge variant='outline' className='border-white/20 px-3 py-1 text-white'>
              <Activity className='mr-1 h-3 w-3' />2 Vaccinations Due
            </Badge>
            <Badge variant='outline' className='border-yellow-500/50 px-3 py-1 text-yellow-300'>
              <Heart className='mr-1 h-3 w-3' />1 Animal Sick
            </Badge>
          </section>

          {/* Search and Filter */}
          <section className='flex flex-col gap-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white/40' />
              <Input
                placeholder='Search animals by tag or name...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:bg-white/10'
              />
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='border-white/20 text-white hover:bg-white/10'
              >
                <Filter className='mr-2 h-4 w-4' />
                Filter
              </Button>
              <select
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
                className='rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:bg-white/10 focus:outline-none'
              >
                <option value='all'>All Animals</option>
                <option value='active'>Active</option>
                <option value='sick'>Sick</option>
                <option value='sold'>Sold</option>
              </select>
            </div>
          </section>

          {/* Animals Grid */}
          <section>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-semibold text-white'>Recent Animals</h2>
              <Button variant='ghost' size='sm' className='text-white/60 hover:text-white'>
                View All
              </Button>
            </div>

            <AnimalGrid>
              {mockAnimals.map(animal => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </AnimalGrid>
          </section>
        </main>
      </div>
    </div>
  );
}
