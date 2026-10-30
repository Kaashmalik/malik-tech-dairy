import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, Languages } from 'lucide-react';
import { getRelatedGuides, guideUrl, type Guide } from '@/content/guides';
import { siteConfig } from '@/lib/seo/config';
import { GuideBody, guideHeadings } from '@/components/guides/GuideBody';
import { JsonLdScript } from '@/components/seo/JsonLdScript';
import { AdSlot } from '@/components/ads/AdSense';

export type GuideLang = 'en' | 'ur';

const LABELS = {
  en: {
    home: 'Home',
    guides: 'Guides',
    by: `By the ${siteConfig.name} Editorial Team`,
    updated: 'Updated',
    minRead: 'min read',
    onThisPage: 'On this page',
    faq: 'Frequently asked questions',
    disclaimerTitle: 'Disclaimer:',
    disclaimer:
      'This guide is general information for farmers, not a substitute for advice from a qualified veterinarian or your provincial Livestock & Dairy Development Department. Always follow medicine and vaccine labels.',
    furtherReading: 'Further reading',
    related: 'Related guides',
    switchTo: 'اردو میں پڑھیں',
  },
  ur: {
    home: 'ہوم',
    guides: 'رہنمائی',
    by: 'ایم ٹی کے ڈیری ادارتی ٹیم',
    updated: 'تازہ کاری',
    minRead: 'منٹ مطالعہ',
    onThisPage: 'اس صفحے پر',
    faq: 'عام سوالات',
    disclaimerTitle: 'نوٹ:',
    disclaimer:
      'یہ رہنمائی کسانوں کے لیے عمومی معلومات ہے، ویٹرنری ڈاکٹر یا محکمہ لائیو اسٹاک کے مشورے کا متبادل نہیں۔ ہمیشہ دوا اور ویکسین کے لیبل پر عمل کریں۔',
    furtherReading: 'مزید معلومات',
    related: 'متعلقہ رہنمائی',
    switchTo: 'Read in English',
  },
} as const;

/** Localized view of a guide; Urdu falls back to English for untranslated fields. */
function localize(guide: Guide, lang: GuideLang) {
  const t = lang === 'ur' && guide.ur ? guide.ur : null;
  return {
    title: t?.title ?? guide.title,
    description: t?.description ?? guide.description,
    body: t?.body ?? guide.body,
    faqs: t ? t.faqs : guide.faqs,
  };
}

/** hreflang pairs: only when the Urdu translation exists. */
export function guideAlternates(guide: Guide, lang: GuideLang): Metadata['alternates'] {
  const en = `${siteConfig.url}${guideUrl(guide.slug, 'en')}`;
  const ur = `${siteConfig.url}${guideUrl(guide.slug, 'ur')}`;
  return {
    canonical: lang === 'ur' ? ur : en,
    ...(guide.ur ? { languages: { 'en-PK': en, 'ur-PK': ur, 'x-default': en } } : {}),
  };
}

export function guideMetadata(guide: Guide, lang: GuideLang): Metadata {
  const { title, description } = localize(guide, lang);
  const alternates = guideAlternates(guide, lang);
  return {
    title,
    description,
    keywords: guide.keywords,
    alternates,
    openGraph: {
      type: 'article',
      url: alternates?.canonical as string,
      title,
      description,
      locale: lang === 'ur' ? 'ur_PK' : 'en_PK',
      publishedTime: guide.published,
      modifiedTime: guide.updated,
      section: guide.category,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

const formatDate = (iso: string, lang: GuideLang) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function GuideArticle({ guide, lang }: { guide: Guide; lang: GuideLang }) {
  const L = LABELS[lang];
  const { title, description, body, faqs } = localize(guide, lang);
  const url = `${siteConfig.url}${guideUrl(guide.slug, lang)}`;
  const guidesHref = lang === 'ur' ? '/ur/guides' : '/guides';
  const headings = guideHeadings(body);
  // In Urdu, only link to related guides that are also translated
  const related = getRelatedGuides(guide, 6)
    .filter(r => lang === 'en' || r.ur)
    .slice(0, 3);

  const structuredData: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      inLanguage: lang === 'ur' ? 'ur-PK' : 'en-PK',
      datePublished: guide.published,
      dateModified: guide.updated,
      mainEntityOfPage: url,
      articleSection: guide.category,
      keywords: guide.keywords.join(', '),
      author: { '@type': 'Organization', name: `${siteConfig.name} Editorial Team`, url: siteConfig.url },
      publisher: {
        '@type': 'Organization',
        name: siteConfig.name,
        logo: { '@type': 'ImageObject', url: `${siteConfig.url}${siteConfig.logo}` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: L.home, item: `${siteConfig.url}${lang === 'ur' ? '/ur' : ''}` },
        { '@type': 'ListItem', position: 2, name: L.guides, item: `${siteConfig.url}${guidesHref}` },
        { '@type': 'ListItem', position: 3, name: title, item: url },
      ],
    },
  ];
  if (faqs?.length) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  const otherLang: GuideLang = lang === 'ur' ? 'en' : 'ur';
  const showSwitch = lang === 'ur' || Boolean(guide.ur);

  return (
    <article
      lang={lang === 'ur' ? 'ur' : 'en'}
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
      className={`bg-white dark:bg-slate-950 ${lang === 'ur' ? 'font-urdu' : ''}`}
    >
      <JsonLdScript data={structuredData} />
      <div className='container mx-auto max-w-3xl px-4 py-10'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <nav aria-label='Breadcrumb' className='text-sm text-slate-500'>
            <Link href={lang === 'ur' ? '/ur' : '/'} className='hover:text-emerald-700'>
              {L.home}
            </Link>{' '}
            /{' '}
            <Link href={guidesHref} className='hover:text-emerald-700'>
              {L.guides}
            </Link>
          </nav>
          {showSwitch && (
            <Link
              href={guideUrl(guide.slug, otherLang)}
              hrefLang={otherLang === 'ur' ? 'ur-PK' : 'en-PK'}
              className='inline-flex items-center gap-1.5 rounded-full border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400'
            >
              <Languages className='h-4 w-4' />
              <span className={otherLang === 'ur' ? 'font-urdu' : 'font-sans'}>{L.switchTo}</span>
            </Link>
          )}
        </div>

        <header className='mt-6'>
          <h1 className='text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-white'>
            {title}
          </h1>
          {lang === 'en' && guide.urdu && (
            <p className='font-urdu mt-3 text-lg text-slate-500' lang='ur' dir='rtl'>
              {guide.urdu}
            </p>
          )}
          <div className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500'>
            <span>{L.by}</span>
            <span className='inline-flex items-center gap-1'>
              <CalendarDays className='h-4 w-4' /> {L.updated}{' '}
              <time dateTime={guide.updated}>{formatDate(guide.updated, lang)}</time>
            </span>
            <span className='inline-flex items-center gap-1'>
              <Clock className='h-4 w-4' /> {guide.readingMinutes} {L.minRead}
            </span>
          </div>
        </header>

        {headings.length > 2 && (
          <nav
            aria-label={L.onThisPage}
            className='mt-8 rounded-2xl border border-slate-200 p-5 dark:border-slate-800'
          >
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>{L.onThisPage}</p>
            <ol className='mt-2 list-decimal space-y-1 ps-5 text-sm'>
              {headings.map(h => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className='text-emerald-700 hover:underline dark:text-emerald-400'>
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className='mt-8'>
          <GuideBody body={body} lang={lang} />
        </div>

        <AdSlot className='my-10' />

        {guide.cta && (
          <Link
            href={guide.cta.href}
            className='mt-10 flex items-center justify-between gap-4 rounded-2xl bg-emerald-600 p-5 font-semibold text-white transition hover:bg-emerald-700'
          >
            {guide.cta.label}
            <ArrowRight className='h-5 w-5 shrink-0 rtl:rotate-180' />
          </Link>
        )}

        {faqs?.length ? (
          <section className='mt-12'>
            <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>{L.faq}</h2>
            <div className='mt-4 space-y-4'>
              {faqs.map(f => (
                <details key={f.q} className='rounded-xl border border-slate-200 p-4 dark:border-slate-800'>
                  <summary className='cursor-pointer font-semibold text-slate-900 dark:text-white'>
                    {f.q}
                  </summary>
                  <p className='mt-2 text-slate-700 dark:text-slate-300'>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <aside className='mt-12 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400'>
          <p>
            <strong>{L.disclaimerTitle}</strong> {L.disclaimer}
          </p>
          {guide.furtherReading?.length ? (
            <div dir='ltr' lang='en' className='mt-3 text-left font-sans'>
              <p className='font-semibold text-slate-700 dark:text-slate-300'>Further reading</p>
              <ul className='mt-1 list-disc pl-5'>
                {guide.furtherReading.map(source => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        {related.length > 0 && (
          <section className='mt-12'>
            <h2 className='text-xl font-bold text-slate-900 dark:text-white'>{L.related}</h2>
            <div className='mt-4 grid gap-4 sm:grid-cols-3'>
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={guideUrl(r.slug, lang)}
                  className='rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 dark:border-slate-800 dark:text-white'
                >
                  {lang === 'ur' && r.ur ? r.ur.title : r.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
