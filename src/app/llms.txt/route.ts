import { NextResponse } from 'next/server';
import { siteConfig, pricingPlans } from '@/lib/seo/config';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export async function GET() {
  const content = `# MTK Dairy (MalikTech Dairy)
> Pakistan's #1 Smart Dairy & Livestock Farm Management SaaS Platform.

## Summary
MTK Dairy is modern, bilingual (English & Urdu) cloud and offline-first PWA software engineered specifically for dairy and cattle farmers in Pakistan. It simplifies tracking daily milk production (for cows and buffaloes), individual animal biometric ear-tag profiles, veterinary treatments, vaccination calendars, reproduction/artificial insemination timelines, feed formulations (Wanda & silage), and farm accounting in Pakistani Rupees (PKR).

## Core Capabilities
- **Livestock Profiling**: Complete digital ear-tag records, pedigree tracing, lifecycle tracking, weight monitoring, and health history.
- **Milk Production Logging**: Morning, evening, and total daily milk logging per animal with automatic fat percentage and quality metrics.
- **Veterinary & Disease Management**: Vaccination schedules, treatment logs, quarantine alerts, and withdrawal period tracking for milk safety.
- **Reproduction & Breeding Cycles**: Heat detection alerts, artificial insemination (AI) records, pregnancy checks, and expected calving forecasts.
- **Feed & Nutrition**: Daily ration calculations, low-stock threshold notifications, batch tracking, and feed cost per litre optimization.
- **Financial Accounting**: Cash flow, expenses, milk sales, livestock sales, and cow-level profitability in PKR.
- **Offline PWA Support**: Mobile progressive web app capable of logging milk in rural sheds without internet and auto-syncing when online.
- **Enterprise Multi-Tenancy**: Strict tenant isolation via PostgreSQL Row Level Security (RLS) and encrypted cloud storage.

## Pricing Plans (in PKR)
- **Free**: Rs. 0/month - Up to 5 animals, 1 user, core milk and animal records.
- **Professional**: Rs. 4,999/month - Up to 100 animals, 5 staff users, advanced health, breeding & financial reports.
- **Farm**: Rs. 12,999/month - Up to 500 animals, 15 staff users, IoT integration, feed formulation, WhatsApp alerts.
- **Enterprise**: Custom pricing - Unlimited animals, custom domain / white-label, dedicated SLA support.

## Key URLs
- Homepage: https://dairy.mtkcodex.site
- Features Overview: https://dairy.mtkcodex.site/features
- Pricing & Subscriptions: https://dairy.mtkcodex.site/pricing
- About Us: https://dairy.mtkcodex.site/about
- Customer Support & Contact: https://dairy.mtkcodex.site/contact
- Frequently Asked Questions: https://dairy.mtkcodex.site/faq
- Register / Start Free Trial: https://dairy.mtkcodex.site/apply
- Farmer Sign In: https://dairy.mtkcodex.site/sign-in
- Privacy Policy: https://dairy.mtkcodex.site/privacy-policy
- Terms of Service: https://dairy.mtkcodex.site/terms-of-service
- Sitemap: https://dairy.mtkcodex.site/sitemap.xml

## Contact & Head Office
- Company: MTK Dairy / MalikTech
- Founder: Muhammad Kashif
- Phone / WhatsApp: +92 302 0718182
- Support Email: mtkdairy@gmail.com / support@dairy.mtkcodex.site
- Headquarters: Bhubtian Branch, Lahore, Punjab, Pakistan
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
