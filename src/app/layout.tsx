import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import { PWARegister } from '@/components/PWARegister';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { siteConfig, allKeywords } from '@/lib/seo/config';
import { AllSchemas } from '@/components/seo/JsonLd';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', // Optimizes font loading for Core Web Vitals
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const notoUrdu = Noto_Nastaliq_Urdu({
  variable: '--font-urdu',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#047857' },
    { media: '(prefers-color-scheme: dark)', color: '#064E3B' },
  ],
};

// Comprehensive SEO Metadata
export const metadata: Metadata = {
  // Primary Meta Tags
  title: {
    default: 'MTK Dairy - Smart Dairy Farm Management Software Pakistan',
    template: '%s | MTK Dairy',
  },
  description:
    'Dairy farm management software for Pakistan. Track milk production, cattle health, breeding records, and finances with English & Urdu support and offline PWA. Free plan available. ڈیری فارم مینجمنٹ سافٹ ویئر',
  keywords: allKeywords,
  authors: [{ name: 'MTK Dairy Team', url: siteConfig.url }],
  creator: 'MalikTech',
  publisher: 'MTK Dairy',
  applicationName: 'MTK Dairy',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',

  // Manifest. Icons come from the app/ file conventions (favicon.ico, icon.svg, apple-icon.png),
  // generated from public/brand/logo-mark.svg by scripts/generate-icons.mjs.
  manifest: '/manifest.json',

  // Metadata Base for Canonical URLs
  metadataBase: new URL(siteConfig.url),

  // Canonical URLs are set per page (a root canonical would be inherited by every
  // page and mark them all as duplicates of the homepage). No hreflang until a real
  // Urdu route exists.

  // Open Graph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'MTK Dairy - Smart Dairy Farm Management Software Pakistan',
    description:
      'Dairy farm management software for Pakistan. Track milk, health, breeding & finances. Free plan available.',
    // og:image comes from app/opengraph-image.tsx (file convention)
    countryName: 'Pakistan',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@mtkdairy',
    creator: '@mtkdairy',
    title: 'MTK Dairy - Smart Dairy Farm Management',
    description: 'Dairy farm management software for Pakistan. Free plan available.',
  },

  // Robots Directives
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification Tags
  verification: {
    ...(siteConfig.verification.google ? { google: siteConfig.verification.google } : {}),
    ...(siteConfig.verification.yandex ? { yandex: siteConfig.verification.yandex } : {}),
    ...(siteConfig.verification.bing
      ? { other: { 'msvalidate.01': siteConfig.verification.bing } }
      : {}),
  },

  // App Links
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MTK Dairy',
  },

  // Format Detection
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Category
  category: 'Agriculture Software',

  // Classification
  classification: 'Business',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const isRTL = locale === 'ur';

  return (
    <ClerkProvider>
      <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${notoUrdu.variable} ${isRTL ? 'font-urdu' : ''} antialiased`}
        >
          {/* JSON-LD for search engines. Rendered in <body>: a hand-written <head> with
              scripts caused a hydration mismatch (full client re-render on every page). */}
          <AllSchemas />
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <PWARegister />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
