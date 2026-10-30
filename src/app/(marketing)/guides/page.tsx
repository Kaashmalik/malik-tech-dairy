import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator } from 'lucide-react';
import { guides } from '@/content/guides';
import { siteConfig } from '@/lib/seo/config';
import { JsonLdScript } from '@/components/seo/JsonLdScript';

const url = `${siteConfig.url}/guides`;

export const metadata: Metadata = {
  title: { absolute: 'Dairy Farming Guides for Pakistan | MTK Dairy' },
  description:
    'Free, practical guides for Pakistani dairy farmers: vaccination schedules, heat detection, calving, milk fat and SNF, mastitis, fodder and silage, breeds and record keeping.',
  alternates: { canonical: url },
  openGraph: {
    title: 'Dairy Farming Guides for Pakistan',
    description:
      'Practical, farmer-friendly guides on cattle and buffalo health, breeding, milk and feeding.',
    url,
    type: 'website',
  },
};

const CATEGORY_ORDER = ['Health', 'Breeding', 'Milk', 'Nutrition', 'Breeds', 'Management'] as const;

export default function GuidesIndexPage() {
  const byCategory = CATEGORY_ORDER.map(category => ({
    category,
    items: guides.filter(g => g.category === category),
  })).filter(group => group.items.length > 0);

  return (
    <div className='bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900'>
      <JsonLdScript
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Dairy Farming Guides for Pakistan',
          url,
          hasPart: guides.map(g => ({
            '@type': 'Article',
            headline: g.title,
            url: `${url}/${g.slug}`,
          })),
        }}
      />
      <section className='container mx-auto max-w-5xl px-4 py-14'>
        <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
          <BookOpen className='h-3.5 w-3.5' /> Knowledge hub
        </div>
        <h1 className='mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white'>
          Dairy Farming Guides
        </h1>
        <p className='mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400'>
          Practical advice for cattle and buffalo farmers in Pakistan — written to be used on the
          farm, not just read.
        </p>
        <p className='font-urdu mt-2 text-slate-500'>ڈیری فارمنگ کے بارے میں مفید معلومات</p>

        <div className='mt-8 grid gap-4 sm:grid-cols-2'>
          {[
            {
              href: '/tools/calving-date-calculator',
              title: 'Calving date calculator',
              text: 'Expected calving, dry-off and pregnancy-check dates for cows, buffaloes, goats and sheep.',
            },
            {
              href: '/tools/milk-price-calculator',
              title: 'Milk price calculator (fat/SNF)',
              text: 'See what a delivery is worth from litres, fat, SNF and your buyer’s rate.',
            },
          ].map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className='group rounded-2xl border border-emerald-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-emerald-900 dark:bg-slate-900'
            >
              <div className='flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400'>
                <Calculator className='h-4 w-4' /> Free tool
              </div>
              <p className='mt-2 text-lg font-bold text-slate-900 dark:text-white'>{tool.title}</p>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>{tool.text}</p>
            </Link>
          ))}
        </div>

        {byCategory.map(group => (
          <div key={group.category} className='mt-12'>
            <h2 className='text-xl font-bold text-slate-900 dark:text-white'>{group.category}</h2>
            <div className='mt-4 grid gap-4 md:grid-cols-2'>
              {group.items.map(guide => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className='group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                >
                  <h3 className='text-lg font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-white'>
                    {guide.title}
                  </h3>
                  <p className='mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400'>
                    {guide.description}
                  </p>
                  <span className='mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400'>
                    {guide.readingMinutes} min read <ArrowRight className='h-4 w-4' />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
