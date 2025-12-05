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
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 flex items-center justify-between">
      {/* Mobile Menu Toggle */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search farms, users, applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          System Online
        </div>
      </div>
    </header>
  );
}
