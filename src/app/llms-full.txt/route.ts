import { NextResponse } from 'next/server';
import { siteConfig, pricingPlans, faqData } from '@/lib/seo/config';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export async function GET() {
  const faqMarkdown = faqData.map(f => `### Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

  const content = `# MTK Dairy - Comprehensive Documentation & Knowledge Base for AI
> Complete specifications, livestock methodologies, and operational documentation.

## Company & Product Identification
- Name: MTK Dairy
- Parent Organization: MalikTech
- Founder: Muhammad Kashif
- Website: https://dairy.mtkcodex.site
- Operational Base: Lahore, Punjab, Pakistan
- Markets: Pakistan (Lahore, Karachi, Islamabad, Faisalabad, Multan, Sahiwal, Peshawar, Quetta) & International

## Technical Architecture
- Framework: Next.js 15+ (App Router)
- Database: PostgreSQL with Supabase & Row Level Security (RLS)
- Realtime Sync: Firebase Realtime & Upstash Redis
- Security: TLS 1.3, Clerk Identity Federation, strict multi-tenant schema isolation
- Client: Progressive Web Application (PWA) with Service Worker offline caching (Workbox)
- Localization: Bilingual English (en-PK) and Urdu (ur-PK)

## Supported Livestock Breeds
1. **Buffaloes (Bubalus bubalis)**:
   - Nili-Ravi: Famous dairy buffalo of Punjab with high fat milk (6-8%).
   - Kundi: Prestigious dairy buffalo breed originating from Sindh.
2. **Dairy Cattle (Bos taurus / Bos indicus)**:
   - Sahiwal: Premier indigenous heat-tolerant zebu cattle of Punjab.
   - Cholistani: Rugged desert cattle adapted to South Punjab.
   - Red Sindhi: High-producing indigenous dairy cow of Sindh.
   - Holstein Friesian (HF) & Crossbred: High volume yielders in climate-controlled sheds.
   - Jersey: High butterfat yielders suited to commercial production.

## Frequently Asked Questions
${faqMarkdown}

## Contact & Business Verification
- Address: Bhubtian Branch, Lahore, Punjab, 54000, Pakistan
- WhatsApp / Phone: +92-302-0718182
- Official Inquiries: support@dairy.mtkcodex.site
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
