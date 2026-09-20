import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { pricingPlans, siteConfig } from '@/lib/seo/config';
import { ProductSchema, BreadcrumbSchema } from '@/components/seo/JsonLd';
import {
  CheckCircle2,
  X,
  HelpCircle,
  Zap,
  Shield,
  PhoneCall,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing Plans & Subscriptions | MTK Dairy Farm Software',
  description:
    'Affordable and transparent dairy farm management software pricing in Pakistan. Free plan available for small farms, with scalable plans for commercial cattle & buffalo herds.',
  alternates: {
    canonical: `${siteConfig.url}/pricing`,
  },
  openGraph: {
    title: 'MTK Dairy Pricing - Free & Professional Plans in Pakistan',
    description:
      'Transparent pricing for smart dairy farm management in PKR. Track milk, cattle health, and farm finances.',
    url: `${siteConfig.url}/pricing`,
  },
};

const comparisonFeatures = [
  {
    name: 'Animal Records Limit',
    free: '5 Animals',
    pro: '100 Animals',
    farm: '500 Animals',
    enterprise: 'Unlimited',
  },
  {
    name: 'Staff & Team Users',
    free: '1 User',
    pro: '5 Users',
    farm: '15 Users',
    enterprise: 'Unlimited',
  },
  { name: 'Daily Milk Production Logging', free: true, pro: true, farm: true, enterprise: true },
  { name: 'Offline PWA Support', free: true, pro: true, farm: true, enterprise: true },
  {
    name: 'Vaccination & Medical History',
    free: 'Basic',
    pro: 'Advanced + Alerts',
    farm: 'Complete + Quarantine',
    enterprise: 'Custom Workflows',
  },
  { name: 'Breeding & Calving Forecasts', free: false, pro: true, farm: true, enterprise: true },
  { name: 'Feed Formulation & Stock Alerts', free: false, pro: true, farm: true, enterprise: true },
  {
    name: 'Financial Cashflow & Sales in PKR',
    free: 'Basic',
    pro: 'Full Reports',
    farm: 'Profitability per Cow',
    enterprise: 'Multi-Entity Ledger',
  },
  { name: 'Bulk Data Import & CSV Export', free: false, pro: true, farm: true, enterprise: true },
  {
    name: 'WhatsApp & Phone Support',
    free: 'Community',
    pro: 'Priority Email/Chat',
    farm: 'Direct WhatsApp',
    enterprise: '24/7 Dedicated Manager',
  },
  { name: 'Custom Domain / White-label', free: false, pro: false, farm: false, enterprise: true },
];

export default function PricingPage() {
  const breadcrumbItems = [
    { name: 'Home', url: siteConfig.url },
    { name: 'Pricing', url: `${siteConfig.url}/pricing` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      {pricingPlans.map((plan, i) => (
        <ProductSchema key={i} plan={plan} />
      ))}

      <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100'>
        {/* Header */}
        <section className='container mx-auto px-4 py-16 text-center lg:py-24'>
          <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
            <Sparkles className='h-3.5 w-3.5' /> Transparent & Fair Pricing in PKR
          </div>
          <h1 className='mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl'>
            Invest in Your Farm’s{' '}
            <span className='bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent'>
              Productivity
            </span>
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400'>
            Start free with up to 5 animals. Upgrade whenever your herd grows. No hidden fees,
            cancel anytime.
          </p>
          <p className='font-urdu mt-3 text-base text-slate-500'>
            چھوٹے اور تجارتی ڈیری فارمز کے لیے پاکستان کا سب سے آسان اور سستا سافٹ ویئر
          </p>
        </section>

        {/* Pricing Cards */}
        <section className='container mx-auto px-4 pb-20'>
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
            {pricingPlans.map((plan, index) => {
              const isPopular = plan.name === 'Professional';
              return (
                <div
                  key={index}
                  className={`relative flex flex-col justify-between rounded-3xl border bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl dark:bg-slate-900 ${
                    isPopular
                      ? 'border-emerald-500 shadow-emerald-500/10 ring-2 ring-emerald-500 dark:border-emerald-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isPopular && (
                    <div className='absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md'>
                      Most Popular in Pakistan
                    </div>
                  )}

                  <div>
                    <h3 className='text-2xl font-bold text-slate-900 dark:text-white'>
                      {plan.name}
                    </h3>
                    <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>
                      {plan.name === 'Free' &&
                        'Ideal for small local farms and beginners starting digital records.'}
                      {plan.name === 'Professional' &&
                        'For growing dairy setups requiring comprehensive analytics.'}
                      {plan.name === 'Farm' &&
                        'Built for commercial high-yield dairy operations and multiple sheds.'}
                      {plan.name === 'Enterprise' &&
                        'Tailored solution with custom integrations and dedicated servers.'}
                    </p>

                    <div className='my-8'>
                      <div className='flex items-baseline gap-1'>
                        <span className='text-4xl font-black tracking-tight text-slate-900 dark:text-white'>
                          {plan.price === 0 ? 'Rs. 0' : `Rs. ${plan.price.toLocaleString()}`}
                        </span>
                        {plan.price > 0 && (
                          <span className='text-sm font-semibold text-slate-500 dark:text-slate-400'>
                            /month
                          </span>
                        )}
                      </div>
                      <span className='text-xs text-slate-400'>
                        {plan.price === 0 ? 'Free forever' : 'Billed monthly in PKR'}
                      </span>
                    </div>

                    <div className='space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800'>
                      <span className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                        Included Features
                      </span>
                      <ul className='space-y-3 text-sm'>
                        {plan.features.map((feature, fIdx) => (
                          <li
                            key={fIdx}
                            className='flex items-start gap-3 text-slate-700 dark:text-slate-300'
                          >
                            <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-emerald-500' />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className='mt-8 pt-4'>
                    <Link
                      href='/apply'
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-center text-sm font-bold transition-all ${
                        isPopular
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>Get Started Now</span>
                      <ArrowRight className='h-4 w-4' />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className='container mx-auto px-4 py-16'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white'>
              Compare Plan Features
            </h2>
            <p className='mt-4 text-slate-600 dark:text-slate-400'>
              Detailed breakdown of software capabilities across tiers.
            </p>
          </div>

          <div className='overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
            <table className='w-full text-left text-sm'>
              <thead className='border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300'>
                <tr>
                  <th className='p-4 sm:px-6'>Feature</th>
                  <th className='p-4 text-center'>Free (Rs. 0)</th>
                  <th className='p-4 text-center text-emerald-600 dark:text-emerald-400'>
                    Professional (Rs. 4,999)
                  </th>
                  <th className='p-4 text-center'>Farm (Rs. 12,999)</th>
                  <th className='p-4 text-center'>Enterprise</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                {comparisonFeatures.map((row, idx) => (
                  <tr key={idx} className='hover:bg-slate-50/50 dark:hover:bg-slate-800/30'>
                    <td className='p-4 font-medium text-slate-900 sm:px-6 dark:text-white'>
                      {row.name}
                    </td>
                    <td className='p-4 text-center text-slate-600 dark:text-slate-400'>
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <CheckCircle2 className='mx-auto h-5 w-5 text-emerald-500' />
                        ) : (
                          <X className='mx-auto h-5 w-5 text-slate-300 dark:text-slate-600' />
                        )
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className='p-4 text-center font-semibold text-emerald-700 dark:text-emerald-400'>
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <CheckCircle2 className='mx-auto h-5 w-5 text-emerald-500' />
                        ) : (
                          <X className='mx-auto h-5 w-5 text-slate-300 dark:text-slate-600' />
                        )
                      ) : (
                        row.pro
                      )}
                    </td>
                    <td className='p-4 text-center text-slate-600 dark:text-slate-400'>
                      {typeof row.farm === 'boolean' ? (
                        row.farm ? (
                          <CheckCircle2 className='mx-auto h-5 w-5 text-emerald-500' />
                        ) : (
                          <X className='mx-auto h-5 w-5 text-slate-300 dark:text-slate-600' />
                        )
                      ) : (
                        row.farm
                      )}
                    </td>
                    <td className='p-4 text-center font-medium text-slate-900 dark:text-white'>
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise ? (
                          <CheckCircle2 className='mx-auto h-5 w-5 text-emerald-500' />
                        ) : (
                          <X className='mx-auto h-5 w-5 text-slate-300 dark:text-slate-600' />
                        )
                      ) : (
                        row.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Local Support & Payment Notice */}
        <section className='container mx-auto px-4 pb-24'>
          <div className='rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 sm:p-12 dark:border-emerald-900 dark:bg-emerald-950/20'>
            <div className='flex flex-col items-center justify-between gap-6 sm:flex-row'>
              <div>
                <h3 className='text-2xl font-bold text-slate-900 dark:text-white'>
                  Need custom setup or have questions?
                </h3>
                <p className='mt-2 text-slate-600 dark:text-slate-400'>
                  We support local Pakistani payment methods (JazzCash, EasyPaisa, Bank Transfer)
                  with direct onboarding assistance.
                </p>
              </div>
              <div className='flex flex-wrap gap-4'>
                <Link
                  href='/contact'
                  className='flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700'
                >
                  <PhoneCall className='h-4 w-4' />
                  <span>Contact Sales</span>
                </Link>
                <Link
                  href='/apply'
                  className='rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
