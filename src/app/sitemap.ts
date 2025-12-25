import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maliktechdairy.com';
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
  // Add tenant subdomains if in production
  if (adminDb && process.env.NODE_ENV === 'production') {
    try {
      const tenantsSnapshot = await adminDb.collection('tenants').get();
      for (const tenantDoc of tenantsSnapshot.docs) {
        const configDoc = await tenantDoc.ref.collection('config').doc('main').get();
        if (configDoc.exists) {
          const config = configDoc.data();
          const subdomain = config?.subdomain;
          if (subdomain) {
            routes.push({
              url: `https://${subdomain}.${baseUrl.replace('https://', '')}`,
              lastModified: new Date(),
              changeFrequency: 'daily',
              priority: 0.7,
            });
          }
        }
      }
    } catch (error) {
    }
  }
  return routes;
}