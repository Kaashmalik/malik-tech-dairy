import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Calculator, HeartPulse, Milk, Users, Baby } from 'lucide-react';
import { siteConfig } from '@/lib/seo/config';
import { urduGuides } from '@/content/guides';
import { JsonLdScript } from '@/components/seo/JsonLdScript';

const url = `${siteConfig.url}/ur`;

export const metadata: Metadata = {
  title: { absolute: 'ایم ٹی کے ڈیری — ڈیری فارم مینجمنٹ سافٹ ویئر پاکستان' },
  description:
    'ڈیری فارم کا مکمل ریکارڈ: جانور، دودھ (چکنائی اور ایس این ایف کے ساتھ)، صحت، ویکسینیشن، نسل کشی اور اخراجات۔ چھوٹے فارموں کے لیے مفت پلان۔',
  alternates: {
    canonical: url,
    languages: { 'en-PK': siteConfig.url, 'ur-PK': url, 'x-default': siteConfig.url },
  },
  openGraph: {
    title: 'ایم ٹی کے ڈیری — ڈیری فارم مینجمنٹ سافٹ ویئر',
    url,
    locale: 'ur_PK',
    type: 'website',
  },
};

const FEATURES = [
  {
    icon: Milk,
    title: 'دودھ کا ریکارڈ',
    text: 'ہر جانور کا صبح اور شام کا دودھ، چکنائی اور ایس این ایف۔ پورے ریوڑ کا دودھ ایک ہی اسکرین پر درج کریں۔',
  },
  {
    icon: HeartPulse,
    title: 'صحت اور ویکسینیشن',
    text: 'علاج، ویکسین اور اگلی تاریخوں کا ریکارڈ، تاکہ کوئی ویکسین نہ چھوٹے۔',
  },
  {
    icon: Baby,
    title: 'نسل کشی اور حمل',
    text: 'گرمی، انسیمینیشن، حمل کی تصدیق اور بچہ دینے کی متوقع تاریخیں۔',
  },
  {
    icon: BarChart3,
    title: 'ماہانہ رپورٹیں',
    text: 'ہر جانور کا ماہانہ دودھ، اوسط اور فارم کی آمدنی و اخراجات — PDF اور CSV میں۔',
  },
  {
    icon: Users,
    title: 'عملہ اور ٹیم',
    text: 'اپنے عملے کو دعوت دیں اور ہر ایک کو اس کے کام کے مطابق رسائی دیں۔',
  },
  {
    icon: Calculator,
    title: 'مفت کیلکولیٹر',
    text: 'بچہ دینے کی تاریخ اور چکنائی و ایس این ایف کے حساب سے دودھ کی قیمت معلوم کریں۔',
  },
];

export default function UrduHomePage() {
  return (
    <div className='bg-gradient-to-b from-emerald-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'>
      <JsonLdScript
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'ایم ٹی کے ڈیری',
          inLanguage: 'ur-PK',
          url,
        }}
      />
      <section className='container mx-auto max-w-5xl px-4 py-16 text-center'>
        <h1 className='text-4xl font-extrabold leading-[1.7] text-slate-900 sm:text-5xl dark:text-white'>
          اپنے ڈیری فارم کا حساب کتاب آسان بنائیں
        </h1>
        <p className='mx-auto mt-6 max-w-2xl text-lg leading-loose text-slate-600 dark:text-slate-400'>
          ایم ٹی کے ڈیری پاکستانی ڈیری فارمرز کے لیے بنایا گیا ہے: جانوروں، دودھ، صحت، نسل کشی اور
          اخراجات کا مکمل ریکارڈ، موبائل اور کمپیوٹر دونوں پر۔
        </p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          <Link
            href='/sign-up'
            className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700'
          >
            مفت شروع کریں <ArrowLeft className='h-5 w-5' />
          </Link>
          <Link
            href='/ur/guides'
            className='rounded-xl border border-emerald-300 px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'
          >
            ڈیری رہنمائی پڑھیں
          </Link>
        </div>
        <p className='mt-4 text-sm text-slate-500'>
          مفت پلان میں 5 جانور اور 1 صارف شامل ہیں۔{' '}
          <Link href='/pricing' className='text-emerald-700 underline'>
            تمام پلان دیکھیں
          </Link>
        </p>
      </section>

      <section className='container mx-auto max-w-5xl px-4 pb-16'>
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {FEATURES.map(f => (
            <div
              key={f.title}
              className='rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900'
            >
              <f.icon className='h-7 w-7 text-emerald-600' />
              <h2 className='mt-3 text-xl font-bold leading-loose text-slate-900 dark:text-white'>
                {f.title}
              </h2>
              <p className='mt-1 leading-loose text-slate-600 dark:text-slate-400'>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='container mx-auto max-w-5xl px-4 pb-20'>
        <h2 className='text-2xl font-bold leading-loose text-slate-900 dark:text-white'>
          مقبول رہنمائی
        </h2>
        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          {urduGuides.slice(0, 4).map(g => (
            <Link
              key={g.slug}
              href={`/ur/guides/${g.slug}`}
              className='rounded-2xl border border-slate-200 bg-white p-5 font-semibold leading-loose text-slate-900 transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white'
            >
              {g.ur.title}
            </Link>
          ))}
        </div>
        <div className='mt-6 flex flex-wrap gap-4 text-sm'>
          <Link href='/tools/calving-date-calculator' className='text-emerald-700 underline'>
            بچہ دینے کی تاریخ کیلکولیٹر
          </Link>
          <Link href='/tools/milk-price-calculator' className='text-emerald-700 underline'>
            دودھ کی قیمت کیلکولیٹر
          </Link>
          <Link href='/contact' className='text-emerald-700 underline'>
            ہم سے رابطہ کریں
          </Link>
        </div>
      </section>
    </div>
  );
}
