import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Activity,
  Milk,
  Heart,
  Baby,
  Wheat,
  DollarSign,
  TrendingUp,
  Shield,
  Smartphone,
  Cloud,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features | MTK Dairy SaaS Platform',
  description:
    'Comprehensive livestock management, IoT milk yield tracking, breeding cycles, disease diagnosis, feed optimization, and offline PWA capability.',
};

const featureList = [
  {
    icon: Activity,
    title: 'Individual Animal Profiling',
    desc: 'Complete digital ear-tag records, pedigree tracing, lifecycle tracking, weight monitoring, and health history.',
    badge: 'Core',
  },
  {
    icon: Milk,
    title: 'Smart Milk Yield Logging',
    desc: 'Morning, evening, and total daily milk logging per animal with automatic fat percentage and quality metrics.',
    badge: 'Production',
  },
  {
    icon: Heart,
    title: 'Veterinary Health & Treatment',
    desc: 'Vaccination schedules, treatment logs, quarantine alerts, and withdrawal period tracking for safety.',
    badge: 'Health',
  },
  {
    icon: Baby,
    title: 'Reproduction & Breeding Cycles',
    desc: 'Heat detection alerts, artificial insemination records, pregnancy check tracking, and expected calving forecast.',
    badge: 'Breeding',
  },
  {
    icon: Wheat,
    title: 'Feed Inventory & Nutrition',
    desc: 'Daily ration calculations, low-stock threshold notifications, batch tracking, and feed cost per litre optimization.',
    badge: 'Feed',
  },
  {
    icon: DollarSign,
    title: 'Financial & Cash Flow Analytics',
    desc: 'Expense tracking, milk and animal sales, profitability per cow, and automated reporting in PKR.',
    badge: 'Finance',
  },
  {
    icon: Smartphone,
    title: 'Offline PWA Support',
    desc: 'Full progressive web app capability. Record milk and treatments offline in the shed; auto-syncs when online.',
    badge: 'Offline-First',
  },
  {
    icon: Shield,
    title: 'Enterprise Multi-Tenancy',
    desc: 'Strict tenant isolation via PostgreSQL Row Level Security, role-based access control, and encrypted data.',
    badge: 'Security',
  },
];

export default function FeaturesPage() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100'>
      {/* Hero Section */}
      <section className='container mx-auto px-4 py-16 text-center lg:py-24'>
        <span className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
          Built for Modern Dairy & Livestock Farms
        </span>
        <h1 className='mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl'>
          Everything you need to run a{' '}
          <span className='bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent'>
            profitable farm
          </span>
        </h1>
        <p className='mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400'>
          From individual cattle biometric records to real-time milk production, breeding timelines,
          feed analytics, and accounting.
        </p>
        <div className='mt-8 flex justify-center gap-4'>
          <Link
            href='/apply'
            className='flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
          >
            Start Free Trial <ArrowRight className='h-4 w-4' />
          </Link>
          <Link
            href='/'
            className='rounded-xl border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
          >
            Back to Home
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className='container mx-auto px-4 pb-24'>
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {featureList.map((f, i) => (
            <div
              key={i}
              className='relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
            >
              <div className='flex items-center justify-between'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'>
                  <f.icon className='h-6 w-6' />
                </div>
                <span className='rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400'>
                  {f.badge}
                </span>
              </div>
              <h3 className='mt-4 text-lg font-bold text-slate-900 dark:text-white'>{f.title}</h3>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
