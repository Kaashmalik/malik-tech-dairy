'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';

export function MarketingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className='sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        {/* Logo */}
        <Link href='/' className='group flex items-center gap-2.5'>
          <LogoMark className='rounded-xl shadow-md shadow-emerald-500/20 transition-transform group-hover:scale-105' />
          <div>
            <span className='text-lg font-bold tracking-tight text-slate-900 dark:text-white'>
              MTK Dairy
            </span>
            <span className='-mt-1 hidden text-[10px] font-semibold uppercase tracking-wider text-emerald-600 sm:block dark:text-emerald-400'>
              Smart Farm Management
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className='hidden items-center gap-6 md:flex'>
          <Link
            href='/features'
            className='text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'
          >
            Features
          </Link>
          <Link
            href='/pricing'
            className='text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'
          >
            Pricing
          </Link>
          <Link
            href='/about'
            className='text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'
          >
            About
          </Link>
          <Link
            href='/faq'
            className='text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'
          >
            FAQ
          </Link>
          <Link
            href='/guides'
            className='text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'
          >
            Guides
          </Link>
          <Link
            href='/ur'
            hrefLang='ur-PK'
            lang='ur'
            className='font-urdu text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'
          >
            اردو
          </Link>
          <Link
            href='/contact'
            className='text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400'
          >
            Contact
          </Link>
        </nav>

        {/* Right CTA */}
        <div className='hidden items-center gap-3 sm:flex'>
          <Link
            href='/sign-in'
            className='rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          >
            Sign In
          </Link>
          <Link
            href='/sign-up'
            className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:bg-emerald-700'
          >
            <span>Start Free</span>
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800'
          aria-label='Toggle menu'
        >
          {isOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className='border-b border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-900'>
          <nav className='flex flex-col gap-3'>
            <Link
              href='/features'
              onClick={() => setIsOpen(false)}
              className='rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            >
              Features
            </Link>
            <Link
              href='/pricing'
              onClick={() => setIsOpen(false)}
              className='rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            >
              Pricing
            </Link>
            <Link
              href='/about'
              onClick={() => setIsOpen(false)}
              className='rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            >
              About Us
            </Link>
            <Link
              href='/faq'
              onClick={() => setIsOpen(false)}
              className='rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            >
              FAQ
            </Link>
            <Link
              href='/guides'
              onClick={() => setIsOpen(false)}
              className='rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            >
              Guides
            </Link>
            <Link
              href='/ur'
              hrefLang='ur-PK'
              lang='ur'
              onClick={() => setIsOpen(false)}
              className='font-urdu rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            >
              اردو
            </Link>
            <Link
              href='/contact'
              onClick={() => setIsOpen(false)}
              className='rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            >
              Contact Us
            </Link>
            <div className='mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-800'>
              <Link
                href='/sign-in'
                onClick={() => setIsOpen(false)}
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200'
              >
                Sign In
              </Link>
              <Link
                href='/sign-up'
                onClick={() => setIsOpen(false)}
                className='w-full rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white shadow hover:bg-emerald-700'
              >
                Start Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
