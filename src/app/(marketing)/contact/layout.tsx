import type { Metadata } from 'next';
import { siteConfig } from '@/lib/seo/config';

// The contact page is a client component, so its metadata lives here
export const metadata: Metadata = {
  title: { absolute: 'Contact MTK Dairy | Dairy Farm Software Support Pakistan' },
  description:
    'Contact the MTK Dairy team for help choosing a plan, setting up your farm records or booking a demo. Call, WhatsApp or send a message.',
  alternates: { canonical: `${siteConfig.url}/contact` },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
