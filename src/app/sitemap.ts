import { MetadataRoute } from 'next';
import { guides, urduGuides } from '@/content/guides';

const productionDomain = 'https://dairy.mtkcodex.site';
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL &&
  !process.env.NEXT_PUBLIC_APP_URL.includes('localhost') &&
  !process.env.NEXT_PUBLIC_APP_URL.includes('127.0.0.1')
    ? process.env.NEXT_PUBLIC_APP_URL
    : productionDomain;

// Fixed dates for static pages: a fresh `new Date()` on every build tells crawlers
// that every page changed, which they learn to ignore.
const SITE_UPDATED = '2026-10-30';

export default function sitemap(): MetadataRoute.Sitemap {
  // Only public, indexable pages. Sign-in, sign-up, apply and the app are excluded.
  const staticPages: MetadataRoute.Sitemap = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/features', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/guides', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/tools/calving-date-calculator', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/tools/milk-price-calculator', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms-of-service', priority: 0.3, changeFrequency: 'yearly' as const },
  ].map(p => ({
    url: `${baseUrl}${p.path}`,
    lastModified: SITE_UPDATED,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const pair = (en: string, ur: string) => ({
    languages: { 'en-PK': `${baseUrl}${en}`, 'ur-PK': `${baseUrl}${ur}` },
  });

  const guidePages: MetadataRoute.Sitemap = guides.map(g => ({
    url: `${baseUrl}/guides/${g.slug}`,
    lastModified: g.updated,
    changeFrequency: 'monthly',
    priority: 0.8,
    ...(g.ur ? { alternates: pair(`/guides/${g.slug}`, `/ur/guides/${g.slug}`) } : {}),
  }));

  // Urdu pages (each declares its English counterpart)
  const urduPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/ur`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: pair('', '/ur'),
    },
    {
      url: `${baseUrl}/ur/guides`,
      lastModified: SITE_UPDATED,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: pair('/guides', '/ur/guides'),
    },
    ...urduGuides.map(g => ({
      url: `${baseUrl}/ur/guides/${g.slug}`,
      lastModified: g.updated,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: pair(`/guides/${g.slug}`, `/ur/guides/${g.slug}`),
    })),
  ];

  return [...staticPages, ...guidePages, ...urduPages];
}
