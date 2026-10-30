import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { getGuide, getRelatedGuides, guides } from '@/content/guides';
import { siteConfig } from '@/lib/seo/config';
import { GuideBody, guideHeadings } from '@/components/guides/GuideBody';
import { JsonLdScript } from '@/components/seo/JsonLdScript';
import { AdSlot } from '@/components/ads/AdSense';

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  const url = `${siteConfig.url}/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: guide.title,
      description: guide.description,
      publishedTime: guide.published,
      modifiedTime: guide.updated,
      section: guide.category,
    },
    twitter: { card: 'summary_large_image', title: guide.title, description: guide.description },
  };
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  const url = `${siteConfig.url}/guides/${guide.slug}`;
  const headings = guideHeadings(guide.body);
  const related = getRelatedGuides(guide);

  const structuredData: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      inLanguage: 'en-PK',
      datePublished: guide.published,
      dateModified: guide.updated,
      mainEntityOfPage: url,
      articleSection: guide.category,
      keywords: guide.keywords.join(', '),
      author: {
        '@type': 'Organization',
        name: `${siteConfig.name} Editorial Team`,
        url: siteConfig.url,
      },
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
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${siteConfig.url}/guides` },
        { '@type': 'ListItem', position: 3, name: guide.title, item: url },
      ],
    },
  ];
  if (guide.faqs?.length) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return (
    <article className='bg-white dark:bg-slate-950'>
      <JsonLdScript data={structuredData} />
      <div className='container mx-auto max-w-3xl px-4 py-10'>
        <nav aria-label='Breadcrumb' className='text-sm text-slate-500'>
          <Link href='/' className='hover:text-emerald-700'>
            Home
          </Link>{' '}
          /{' '}
          <Link href='/guides' className='hover:text-emerald-700'>
            Guides
          </Link>{' '}
          / <span className='text-slate-700 dark:text-slate-300'>{guide.category}</span>
        </nav>

        <header className='mt-6'>
          <h1 className='text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-white'>
            {guide.title}
          </h1>
          {guide.urdu && <p className='font-urdu mt-3 text-lg text-slate-500'>{guide.urdu}</p>}
          <div className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500'>
            <span>By the {siteConfig.name} Editorial Team</span>
            <span className='inline-flex items-center gap-1'>
              <CalendarDays className='h-4 w-4' /> Updated{' '}
              <time dateTime={guide.updated}>{formatDate(guide.updated)}</time>
            </span>
            <span className='inline-flex items-center gap-1'>
              <Clock className='h-4 w-4' /> {guide.readingMinutes} min read
            </span>
          </div>
        </header>

        {headings.length > 2 && (
          <nav
            aria-label='On this page'
            className='mt-8 rounded-2xl border border-slate-200 p-5 dark:border-slate-800'
          >
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>On this page</p>
            <ol className='mt-2 list-decimal space-y-1 pl-5 text-sm'>
              {headings.map(h => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className='text-emerald-700 hover:underline dark:text-emerald-400'
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className='mt-8'>
          <GuideBody body={guide.body} />
        </div>

        <AdSlot className='my-10' />

        {guide.cta && (
          <Link
            href={guide.cta.href}
            className='mt-10 flex items-center justify-between gap-4 rounded-2xl bg-emerald-600 p-5 font-semibold text-white transition hover:bg-emerald-700'
          >
            {guide.cta.label}
            <ArrowRight className='h-5 w-5 shrink-0' />
          </Link>
        )}

        {guide.faqs?.length ? (
          <section className='mt-12'>
            <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
              Frequently asked questions
            </h2>
            <div className='mt-4 space-y-4'>
              {guide.faqs.map(f => (
                <details
                  key={f.q}
                  className='rounded-xl border border-slate-200 p-4 dark:border-slate-800'
                >
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
            <strong>Disclaimer:</strong> This guide is general information for farmers, not a
            substitute for advice from a qualified veterinarian or your provincial Livestock &amp;
            Dairy Development Department. Always follow medicine and vaccine labels.
          </p>
          {guide.furtherReading?.length ? (
            <>
              <p className='mt-3 font-semibold text-slate-700 dark:text-slate-300'>
                Further reading
              </p>
              <ul className='mt-1 list-disc pl-5'>
                {guide.furtherReading.map(source => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>

        {related.length > 0 && (
          <section className='mt-12'>
            <h2 className='text-xl font-bold text-slate-900 dark:text-white'>Related guides</h2>
            <div className='mt-4 grid gap-4 sm:grid-cols-3'>
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={`/guides/${r.slug}`}
                  className='rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 dark:border-slate-800 dark:text-white'
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
