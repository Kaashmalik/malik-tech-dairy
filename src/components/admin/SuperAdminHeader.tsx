'use client';

// Super Admin Header Component
import { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SuperAdminHeader() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className='flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-slate-700 dark:bg-slate-800'>
      {/* Mobile Menu Toggle */}
      <button
        className='rounded-lg p-2 hover:bg-gray-100 lg:hidden dark:hover:bg-slate-700'
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
      </button>

      {/* Search */}
      <div className='mx-4 max-w-xl flex-1'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            type='search'
            placeholder='Search farms, users, applications...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='border-gray-200 bg-gray-50 pl-10 dark:border-slate-600 dark:bg-slate-700'
          />
        </div>
      </div>

      {/* Right Side */}
      <div className='flex items-center gap-4'>
        {/* Notifications */}
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white'>
            3
          </span>
        </Button>

        {/* Status Indicator */}
        <div className='hidden items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm text-emerald-700 md:flex dark:bg-emerald-900/30 dark:text-emerald-400'>
          <span className='h-2 w-2 animate-pulse rounded-full bg-emerald-500' />
          System Online
        </div>
      </div>
    </header>
  );
}
