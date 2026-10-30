import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/seo/config';
import { CalvingDateCalculator } from '@/components/tools/CalvingDateCalculator';
import { JsonLdScript } from '@/components/seo/JsonLdScript';
import { AdSlot } from '@/components/ads/AdSense';

const url = `${siteConfig.url}/tools/calving-date-calculator`;

export const metadata: Metadata = {
  title: { absolute: 'Calving Date Calculator for Cows & Buffaloes | MTK Dairy' },
  description:
    'Free calving date calculator: enter the breeding date to get the expected calving date, dry-off date and pregnancy-check window for cows, buffaloes, goats and sheep.',
  alternates: { canonical: url },
  openGraph: { title: 'Calving Date Calculator', url, type: 'website' },
};

export default function CalvingDateCalculatorPage() {
  return (
    <div className='bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900'>
      <JsonLdScript
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Calving Date Calculator',
          url,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'PKR' },
        }}
      />
      <section className='container mx-auto max-w-3xl px-4 py-12'>
        <h1 className='text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white'>
          Calving Date Calculator
        </h1>
        <p className='font-urdu mt-2 text-slate-500'>بچہ دینے کی متوقع تاریخ معلوم کریں</p>
        <p className='mt-4 text-slate-600 dark:text-slate-400'>
          Enter the date your cow or buffalo was bred to plan the pregnancy check, dry-off and
          expected calving. Average gestation: cow about 283 days, buffalo about 310 days.
        </p>
        <div className='mt-8'>
          <CalvingDateCalculator />
        </div>
        <AdSlot className='my-10' />
        <div className='prose-sm mt-8 space-y-3 text-slate-600 dark:text-slate-400'>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>How it works</h2>
          <p>
            The expected date adds the breed-average gestation length to the breeding date. Real
            calvings fall within a window of several days either side, so start watching closely two
            weeks before. Dry-off is placed about 60 days before calving for cows and buffaloes.
          </p>
          <p>
            Learn more in our guides on{' '}
            <Link
              href='/guides/calving-calendar-gestation-period'
              className='text-emerald-700 underline'
            >
              gestation and calving planning
            </Link>{' '}
            and{' '}
            <Link
              href='/guides/heat-detection-cows-buffaloes'
              className='text-emerald-700 underline'
            >
              heat detection
            </Link>
            . MTK Dairy tracks these dates automatically for every animal.
          </p>
        </div>
      </section>
    </div>
  );
}
