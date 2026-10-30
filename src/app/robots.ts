import { MetadataRoute } from 'next';

const productionDomain = 'https://dairy.mtkcodex.site';
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL &&
  !process.env.NEXT_PUBLIC_APP_URL.includes('localhost') &&
  !process.env.NEXT_PUBLIC_APP_URL.includes('127.0.0.1')
    ? process.env.NEXT_PUBLIC_APP_URL
    : productionDomain;

// Private app and auth areas. Pages also send `noindex`; robots keeps crawl budget
// on the public site. (Do not block /_next/: Google needs CSS/JS to render pages.)
const PRIVATE_PATHS = [
  '/api/',
  '/dashboard',
  '/animals',
  '/milk',
  '/health',
  '/breeding',
  '/reports',
  '/settings',
  '/staff',
  '/tasks',
  '/feed',
  '/finance',
  '/analytics',
  '/subscription',
  '/super-admin',
  '/admin',
  '/apply',
  '/onboarding',
  '/select-farm',
  '/sign-in',
  '/sign-up',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVATE_PATHS }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
