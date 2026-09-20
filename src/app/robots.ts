import { MetadataRoute } from 'next';

const productionDomain = 'https://dairy.mtkcodex.site';
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL &&
  !process.env.NEXT_PUBLIC_APP_URL.includes('localhost') &&
  !process.env.NEXT_PUBLIC_APP_URL.includes('127.0.0.1')
    ? process.env.NEXT_PUBLIC_APP_URL
    : productionDomain;

export default function robots(): MetadataRoute.Robots {
  const disallowed = [
    '/api/',
    '/dashboard/',
    '/admin/',
    '/super-admin/',
    '/onboarding/',
    '/_next/',
    '/private/',
  ];

  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowed,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: disallowed,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: disallowed,
      },
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: disallowed,
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: disallowed,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: disallowed,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: disallowed,
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowed,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
