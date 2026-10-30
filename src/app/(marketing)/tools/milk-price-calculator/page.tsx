import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/seo/config';
import { MilkPriceCalculator, MILK_DENSITY_KG_PER_L } from '@/components/tools/MilkPriceCalculator';
import { JsonLdScript } from '@/components/seo/JsonLdScript';
import { AdSlot } from '@/components/ads/AdSense';

const url = `${siteConfig.url}/tools/milk-price-calculator`;

export const metadata: Metadata = {
  title: { absolute: 'Milk Price Calculator (Fat & SNF) | MTK Dairy' },
  description:
    'Free milk price calculator for Pakistan: work out the value of a milk delivery from litres, fat %, SNF % and your buyer’s rate per kg of total solids, fat/SNF or per litre.',
  alternates: { canonical: url },
  openGraph: { title: 'Milk Price Calculator (Fat & SNF)', url, type: 'website' },
};

export default function MilkPriceCalculatorPage() {
  return (
    <div className='bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900'>
      <JsonLdScript
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Milk Price Calculator (Fat & SNF)',
          url,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'PKR' },
        }}
      />
      <section className='container mx-auto max-w-3xl px-4 py-12'>
        <h1 className='text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white'>
          Milk Price Calculator (Fat &amp; SNF)
        </h1>
        <p className='font-urdu mt-2 text-slate-500'>
          چکنائی اور ایس این ایف کے حساب سے دودھ کی قیمت
        </p>
        <p className='mt-4 text-slate-600 dark:text-slate-400'>
          Check what your milk should earn. Enter the litres, the fat and SNF from your test slip,
          and how your collection centre pays.
        </p>
        <div className='mt-8'>
          <MilkPriceCalculator />
        </div>
        <AdSlot className='my-10' />
        <div className='mt-8 space-y-3 text-slate-600 dark:text-slate-400'>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>The formula</h2>
          <p>
            Milk weight (kg) = litres × {MILK_DENSITY_KG_PER_L}. Fat (kg) = weight × fat% ÷ 100, and
            SNF (kg) = weight × SNF% ÷ 100. Total solids = fat + SNF. On a total-solids basis the
            value is TS (kg) × rate per kg.
          </p>
          <p>
            Read our guide{' '}
            <Link href='/guides/milk-fat-snf-explained' className='text-emerald-700 underline'>
              Milk Fat and SNF Explained
            </Link>{' '}
            to learn what lowers fat and SNF and how feeding improves them.
          </p>
        </div>
      </section>
    </div>
  );
}
