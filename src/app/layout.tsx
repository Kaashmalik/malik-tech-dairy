import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import { PWARegister } from '@/components/PWARegister';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AllSchemas } from '@/components/seo/JsonLd';
import { siteConfig, allKeywords, alternateLanguages } from '@/lib/seo/config';
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
    { media: '(prefers-color-scheme: light)', color: '#1F7A3D' },
    { media: '(prefers-color-scheme: dark)', color: '#155a2d' },
  ],
};

// Comprehensive SEO Metadata
export const metadata: Metadata = {
  // Primary Meta Tags
  title: {
    default: 'MTK Dairy - #1 Smart Dairy Farm Management Software Pakistan',
    template: '%s | MTK Dairy',
  },
  description:
    "Pakistan's leading smart dairy farm management software. Track milk production, manage cattle health, breeding records, and finances. Trusted by 500+ farmers in Punjab, Sindh, and KPK. Free plan available! ڈیری فارم مینجمنٹ سافٹ ویئر",
  keywords: allKeywords,
  authors: [{ name: 'MTK Dairy Team', url: siteConfig.url }],
  creator: 'MalikTech',
  publisher: 'MTK Dairy',
  applicationName: 'MTK Dairy',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',

  // Manifest & Icons
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },

  // Metadata Base for Canonical URLs
  metadataBase: new URL(siteConfig.url),

  // Alternate Languages (hreflang)
  alternates: {
    canonical: '/',
    languages: Object.fromEntries(alternateLanguages.map(lang => [lang.hrefLang, lang.href])),
  },

  // Open Graph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    alternateLocale: ['ur_PK', 'en_US'],
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'MTK Dairy - Smart Dairy Farm Management Software Pakistan',
    description:
      "Pakistan's #1 dairy farm management software. Track milk production, manage cattle health & breeding. Free plan available!",
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'MTK Dairy - Smart Dairy Farm Management Software',
        type: 'image/png',
      },
      {
        url: '/og-whatsapp.png', // Square image for WhatsApp
        width: 600,
        height: 600,
        alt: 'MTK Dairy',
        type: 'image/png',
      },
    ],
    countryName: 'Pakistan',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@mtkdairy',
    creator: '@mtkdairy',
    title: 'MTK Dairy - Smart Dairy Farm Management',
    description: "Pakistan's leading dairy farm management software. Free plan available!",
    images: ['/opengraph-image.png'],
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
    google: siteConfig.verification.google,
    yandex: siteConfig.verification.yandex,
    other: {
      'msvalidate.01': siteConfig.verification.bing,
    },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en' suppressHydrationWarning>
        <head>
          {/* Preconnect to External Resources */}
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
          <link rel='dns-prefetch' href='https://www.googletagmanager.com' />

          {/* PWA */}
          <link rel='manifest' href='/manifest.json' />
          <meta name='theme-color' content='#1F7A3D' />
          <meta name='mobile-web-app-capable' content='yes' />
          <meta name='apple-mobile-web-app-capable' content='yes' />
          <meta name='apple-mobile-web-app-status-bar-style' content='default' />
          <meta name='apple-mobile-web-app-title' content='MTK Dairy' />

          {/* Additional SEO Meta Tags */}
          <meta name='geo.region' content='PK-PB' />
          <meta name='geo.placename' content='Lahore' />
          <meta name='geo.position' content='31.5204;74.3587' />
          <meta name='ICBM' content='31.5204, 74.3587' />
          <meta name='language' content='English, Urdu' />
          <meta name='coverage' content='Worldwide' />
          <meta name='distribution' content='Global' />
          <meta name='rating' content='General' />
          <meta name='revisit-after' content='7 days' />

          {/* JSON-LD Structured Data */}
          <AllSchemas />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${notoUrdu.variable} antialiased`}
        >
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <PWARegister />
            <Toaster position='top-right' richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
