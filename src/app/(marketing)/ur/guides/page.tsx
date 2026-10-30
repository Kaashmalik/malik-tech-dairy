import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { urduGuides } from '@/content/guides';
import { siteConfig } from '@/lib/seo/config';
import { JsonLdScript } from '@/components/seo/JsonLdScript';

const url = `${siteConfig.url}/ur/guides`;

export const metadata: Metadata = {
  title: { absolute: 'ڈیری فارمنگ رہنمائی | ایم ٹی کے ڈیری' },
  description:
    'پاکستانی ڈیری فارمرز کے لیے مفت رہنمائی: ویکسینیشن، گرمی کی پہچان، حمل کا دورانیہ، دودھ میں چکنائی اور ایس این ایف، تھنیلا اور دودھ بڑھانے کے طریقے۔',
  alternates: {
    canonical: url,
    languages: { 'en-PK': `${siteConfig.url}/guides`, 'ur-PK': url, 'x-default': `${siteConfig.url}/guides` },
  },
  openGraph: { title: 'ڈیری فارمنگ رہنمائی', url, locale: 'ur_PK', type: 'website' },
};

export default function UrduGuidesIndexPage() {
  return (
    <div className='bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900'>
      <JsonLdScript
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'ڈیری فارمنگ رہنمائی',
          inLanguage: 'ur-PK',
          url,
          hasPart: urduGuides.map(g => ({
            '@type': 'Article',
            headline: g.ur.title,
            url: `${url}/${g.slug}`,
          })),
        }}
      />
      <section className='container mx-auto max-w-5xl px-4 py-14'>
        <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
          <BookOpen className='h-4 w-4' /> معلومات کا مرکز
        </div>
        <h1 className='mt-5 text-4xl font-extrabold leading-[1.6] text-slate-900 sm:text-5xl dark:text-white'>
          ڈیری فارمنگ رہنمائی
        </h1>
        <p className='mt-4 max-w-2xl text-lg leading-loose text-slate-600 dark:text-slate-400'>
          پاکستان کے گائے اور بھینس پالنے والوں کے لیے عملی مشورے — فارم پر استعمال کے لیے لکھے
          گئے۔
        </p>
        <p className='mt-2 text-sm text-slate-500'>
          مزید رہنمائی{' '}
          <Link href='/guides' hrefLang='en-PK' className='font-sans text-emerald-700 underline' dir='ltr'>
            English
          </Link>{' '}
          میں دستیاب ہے۔
        </p>

        <div className='mt-10 grid gap-4 md:grid-cols-2'>
          {urduGuides.map(guide => (
            <Link
              key={guide.slug}
              href={`/ur/guides/${guide.slug}`}
              className='group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
            >
              <h2 className='text-lg font-semibold leading-loose text-slate-900 group-hover:text-emerald-700 dark:text-white'>
                {guide.ur.title}
              </h2>
              <p className='mt-2 flex-1 text-sm leading-loose text-slate-600 dark:text-slate-400'>
                {guide.ur.description}
              </p>
              <span className='mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400'>
                {guide.readingMinutes} منٹ مطالعہ <ArrowLeft className='h-4 w-4' />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
