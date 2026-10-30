import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/seo/config';
import { BreadcrumbSchema } from '@/components/seo/JsonLd';
import { FileText, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Terms of Service | MTK Dairy Farm Software' },
  description:
    'Read the terms of service governing the use of MTK Dairy SaaS farm management application, subscriptions, and offline services.',
  alternates: {
    canonical: `${siteConfig.url}/terms-of-service`,
  },
};

export default function TermsOfServicePage() {
  const breadcrumbItems = [
    { name: 'Home', url: siteConfig.url },
    { name: 'Terms of Service', url: `${siteConfig.url}/terms-of-service` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className='min-h-screen bg-slate-50 py-16 text-slate-800 dark:bg-slate-950 dark:text-slate-200'>
        <div className='container mx-auto max-w-4xl px-4'>
          <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 dark:border-slate-800 dark:bg-slate-900'>
            <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
              <FileText className='h-3.5 w-3.5' /> Service Agreement
            </div>

            <h1 className='mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white'>
              Terms of Service
            </h1>
            <p className='mt-2 text-sm text-slate-500'>
              Effective date: September 2026 • MTK Dairy / MalikTech
            </p>

            <div className='mt-8 space-y-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300'>
              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  1. Acceptance of Terms
                </h2>
                <p className='mt-2'>
                  By accessing or registering an account on MTK Dairy (dairy.mtkcodex.site), you
                  agree to be bound by these Terms of Service. If you do not agree to these terms,
                  do not access or use the services.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  2. Description of Services
                </h2>
                <p className='mt-2'>
                  MTK Dairy provides cloud-based and offline-capable software for dairy and
                  livestock farm management, including cattle profiling, milk production logging,
                  health records, breeding tracking, feed inventory, and financial accounting.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  3. Account Responsibilities
                </h2>
                <p className='mt-2'>
                  You are responsible for maintaining the confidentiality of your credentials and
                  all activities occurring under your tenant account. You agree to immediately
                  notify MTK Dairy of any unauthorized use or security compromise.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  4. Subscription Fees & Currency
                </h2>
                <p className='mt-2'>
                  Paid subscriptions are billed in Pakistani Rupees (PKR) on a recurring monthly or
                  annual basis unless cancelled. You may cancel your subscription at any time prior
                  to the next billing cycle. Fees paid are non-refundable for active billing
                  periods.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  5. Limitation of Liability
                </h2>
                <p className='mt-2'>
                  MTK Dairy provides livestock analytics, calculation algorithms, and veterinary
                  reminders for informational farm management purposes. Farmers and veterinarians
                  retain full responsibility for physical medical decisions, dosage administration,
                  and livestock health.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  6. Governing Law
                </h2>
                <p className='mt-2'>
                  These Terms shall be governed and interpreted under the laws of the Islamic
                  Republic of Pakistan, with primary jurisdiction in Lahore, Punjab.
                </p>
              </section>
            </div>

            <div className='mt-10 border-t border-slate-200 pt-6 dark:border-slate-800'>
              <Link
                href='/'
                className='text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400'
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
