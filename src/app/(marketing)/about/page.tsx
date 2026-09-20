import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/seo/config';
import { BreadcrumbSchema } from '@/components/seo/JsonLd';
import {
  Shield,
  Heart,
  Users,
  Award,
  Sparkles,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Activity,
  Milk,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About MTK Dairy | Pakistan’s Leading Dairy Management Platform',
  description:
    'Learn about MTK Dairy by MalikTech, our mission to empower Pakistani dairy farmers with cutting-edge livestock technology, offline PWA access, and precision analytics.',
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
  openGraph: {
    title: 'About MTK Dairy - Empowering Pakistani Livestock Farmers',
    description:
      'The story, team, and technology driving MTK Dairy. Built in Lahore for cattle and buffalo herds across Pakistan.',
    url: `${siteConfig.url}/about`,
  },
};

export default function AboutPage() {
  const breadcrumbItems = [
    { name: 'Home', url: siteConfig.url },
    { name: 'About Us', url: `${siteConfig.url}/about` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100'>
        {/* Hero Section */}
        <section className='container mx-auto px-4 py-16 text-center lg:py-24'>
          <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
            <Sparkles className='h-3.5 w-3.5' /> Our Mission & Vision
          </div>
          <h1 className='mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl'>
            Digitizing Pakistan’s Dairy Heritage with{' '}
            <span className='bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent'>
              Precision Tech
            </span>
          </h1>
          <p className='mx-auto mt-6 max-w-3xl text-lg text-slate-600 dark:text-slate-400'>
            MTK Dairy was engineered from the ground up to solve the real operational challenges
            faced by dairy and livestock farmers across Pakistan. From rural sheds in Punjab to
            commercial setups in Sindh.
          </p>
          <p className='font-urdu mt-4 text-lg text-emerald-700 dark:text-emerald-400'>
            پاکستان کے مویشی پال کسانوں کے لیے جدید اور قابلِ اعتماد ڈیجیٹل حل
          </p>
        </section>

        {/* Pillars / Values Grid */}
        <section className='container mx-auto px-4 pb-20'>
          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'>
                <Milk className='h-6 w-6' />
              </div>
              <h3 className='mt-6 text-xl font-bold text-slate-900 dark:text-white'>
                Native to Pakistani Livestock
              </h3>
              <p className='mt-3 text-sm text-slate-600 dark:text-slate-400'>
                Unlike generic western software, MTK Dairy accommodates both cow and buffalo breeds
                (Nili-Ravi, Kundi, Sahiwal, Cholistani, HF cross), local calving seasons, and
                Pakistani feed formulations (Wanda, silage).
              </p>
            </div>

            <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'>
                <Activity className='h-6 w-6' />
              </div>
              <h3 className='mt-6 text-xl font-bold text-slate-900 dark:text-white'>
                Offline-First PWA Architecture
              </h3>
              <p className='mt-3 text-sm text-slate-600 dark:text-slate-400'>
                Internet connectivity shouldn't stop farm routines. Our progressive web app allows
                staff to record milk sessions and medical treatments offline inside animal sheds,
                syncing effortlessly when signal returns.
              </p>
            </div>

            <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'>
                <Shield className='h-6 w-6' />
              </div>
              <h3 className='mt-6 text-xl font-bold text-slate-900 dark:text-white'>
                Bank-Grade Multi-Tenant Privacy
              </h3>
              <p className='mt-3 text-sm text-slate-600 dark:text-slate-400'>
                Each farm gets an isolated, encrypted database tenant with strict Row Level
                Security. Your herd genetics, milk pricing, and revenue records remain strictly
                private and protected.
              </p>
            </div>
          </div>
        </section>

        {/* Narrative & Origin */}
        <section className='border-y border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900'>
          <div className='container mx-auto px-4'>
            <div className='mx-auto max-w-3xl space-y-8'>
              <div>
                <h2 className='text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white'>
                  Why We Built MTK Dairy
                </h2>
                <div className='mt-4 h-1 w-20 rounded bg-emerald-500' />
              </div>

              <p className='text-base leading-relaxed text-slate-600 dark:text-slate-300'>
                Pakistan ranks among the top milk-producing nations globally, yet thousands of
                progressive farmers struggle with manual paper ledgers, lost ear-tag histories,
                missed artificial insemination heat cycles, and untracked veterinary expenses.
              </p>

              <p className='text-base leading-relaxed text-slate-600 dark:text-slate-300'>
                Founded under the MalikTech technology umbrella by Muhammad Kashif, MTK Dairy
                bridges the digital divide. We combined modern cloud engineering, bilingual English
                & Urdu UX, and localized agronomic logic into an accessible platform that runs
                smoothly on any smartphone or tablet.
              </p>

              <div className='grid gap-6 sm:grid-cols-2'>
                <div className='rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/40'>
                  <div className='text-3xl font-black text-emerald-600 dark:text-emerald-400'>
                    500+
                  </div>
                  <div className='mt-1 font-semibold text-slate-800 dark:text-white'>
                    Farmers & Herds
                  </div>
                  <p className='mt-1 text-xs text-slate-500'>
                    Across Lahore, Faisalabad, Multan, Sahiwal, and Karachi
                  </p>
                </div>
                <div className='rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/40'>
                  <div className='text-3xl font-black text-emerald-600 dark:text-emerald-400'>
                    99.9%
                  </div>
                  <div className='mt-1 font-semibold text-slate-800 dark:text-white'>
                    System Reliability
                  </div>
                  <p className='mt-1 text-xs text-slate-500'>
                    Cloud automated backup, offline recovery, and SSL protection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Headquarter / Contact Banner */}
        <section className='container mx-auto px-4 py-20 text-center'>
          <div className='mx-auto max-w-2xl'>
            <div className='inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
              <MapPin className='h-5 w-5' />
              <span className='font-semibold'>Lahore, Punjab, Pakistan</span>
            </div>
            <h2 className='mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white'>
              Ready to modernise your farm operations?
            </h2>
            <p className='mt-4 text-slate-600 dark:text-slate-400'>
              Join hundreds of innovative Pakistani dairy owners stepping into the digital era.
            </p>
            <div className='mt-8 flex justify-center gap-4'>
              <Link
                href='/apply'
                className='flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-emerald-700'
              >
                <span>Register Farm for Free</span>
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                href='/contact'
                className='rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              >
                Contact Our Team
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
