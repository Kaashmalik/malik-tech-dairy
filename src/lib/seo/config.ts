// SEO Configuration for MTK Dairy
// Centralized SEO settings for Pakistan & International targeting

export const siteConfig = {
  name: 'MTK Dairy',
  title: 'MTK Dairy - Smart Dairy Farm Management Software Pakistan',
  description:
    "Pakistan's #1 smart dairy farm management software. Track milk production, manage cattle health, breeding records, and finances. Trusted by farmers in Punjab, Sindh, and KPK. ڈیری فارم مینجمنٹ سافٹ ویئر",
  url: 'https://dairy.mtkcodex.site',
  ogImage: '/opengraph-image.png',
  logo: '/icon.png',
  locale: 'en_PK',

  // Contact Information
  contact: {
    email: 'support@maliktechdairy.com',
    phone: '+92-302-0718182',
    address: {
      street: 'Bhubtian Branch',
      city: 'Lahore',
      region: 'Punjab',
      postalCode: '54000',
      country: 'Pakistan',
      countryCode: 'PK',
    },
    coordinates: {
      latitude: 31.5204,
      longitude: 74.3587,
    },
  },

  // Social Links
  social: {
    facebook: 'https://facebook.com/mtkdairy',
    twitter: 'https://twitter.com/mtkdairy',
    instagram: 'https://instagram.com/mtkdairy',
    linkedin: 'https://linkedin.com/company/mtk-dairy',
    youtube: 'https://youtube.com/@mtkdairy',
    whatsapp: 'https://wa.me/923020718182',
  },

  // Verification Tags
  verification: {
    google: 'your-google-verification-code',
    bing: 'your-bing-verification-code',
    yandex: 'your-yandex-verification-code',
  },
} as const;

// Primary Keywords for Pakistan Market
export const pakistanKeywords = [
  // English Keywords
  'dairy farm management software Pakistan',
  'cattle management system Lahore',
  'livestock management app Pakistan',
  'buffalo farm management software',
  'milk production tracking app',
  'dairy farm software Punjab',
  'cattle record keeping software',
  'herd management system Pakistan',
  'dairy accounting software',
  'farm management SaaS Pakistan',

  // Urdu Keywords
  'ڈیری فارم مینجمنٹ سافٹ ویئر',
  'مویشی مینجمنٹ سسٹم',
  'دودھ کی پیداوار ٹریکنگ',
  'بھینس فارم مینجمنٹ',
];

// International Keywords
export const internationalKeywords = [
  'dairy farm management software',
  'livestock management system',
  'cattle tracking app',
  'smart dairy solutions',
  'herd health management software',
  'cattle breeding tracking system',
  'farm management SaaS',
  'dairy farm analytics',
  'IoT dairy farming',
  'precision dairy management',
];

// Long-tail Keywords for Content Strategy
export const longTailKeywords = [
  'best dairy farm management software for small farms',
  'how to increase milk production in cows',
  'vaccination schedule for dairy cattle Pakistan',
  'cattle pregnancy calculator',
  'buffalo breeding cycle tracking',
  'dairy farm profit calculator',
  'modern dairy farming techniques Pakistan',
  'wanda feed formulation for buffaloes',
];

// Cities for Local SEO Targeting
export const targetCities = [
  { name: 'Lahore', province: 'Punjab', primary: true },
  { name: 'Karachi', province: 'Sindh', primary: true },
  { name: 'Islamabad', province: 'Islamabad Capital Territory', primary: true },
  { name: 'Faisalabad', province: 'Punjab', primary: false },
  { name: 'Multan', province: 'Punjab', primary: false },
  { name: 'Peshawar', province: 'Khyber Pakhtunkhwa', primary: false },
  { name: 'Quetta', province: 'Balochistan', primary: false },
  { name: 'Sialkot', province: 'Punjab', primary: false },
  { name: 'Gujranwala', province: 'Punjab', primary: false },
  { name: 'Sahiwal', province: 'Punjab', primary: false },
];

// Alternate Languages for hreflang
export const alternateLanguages = [
  { hrefLang: 'en-PK', href: 'https://dairy.mtkcodex.site' },
  { hrefLang: 'ur-PK', href: 'https://dairy.mtkcodex.site/ur' },
  { hrefLang: 'en-US', href: 'https://dairy.mtkcodex.site' },
  { hrefLang: 'x-default', href: 'https://dairy.mtkcodex.site' },
];

// Pricing Plans for Schema
export const pricingPlans = [
  {
    name: 'Free',
    price: 0,
    currency: 'PKR',
    billingPeriod: 'month',
    features: ['Up to 5 animals', '1 user', 'Basic features'],
  },
  {
    name: 'Professional',
    price: 4999,
    currency: 'PKR',
    billingPeriod: 'month',
    features: ['Up to 100 animals', '5 users', 'Full analytics', 'Health records'],
  },
  {
    name: 'Farm',
    price: 12999,
    currency: 'PKR',
    billingPeriod: 'month',
    features: ['Up to 500 animals', '15 users', 'IoT integration', 'API access'],
  },
  {
    name: 'Enterprise',
    price: 0, // Custom pricing
    currency: 'PKR',
    billingPeriod: 'month',
    features: ['Unlimited animals', 'Unlimited users', 'White-label', 'Dedicated support'],
    isCustom: true,
  },
];

// FAQ Data for Schema
export const faqData = [
  {
    question: 'What is MTK Dairy?',
    answer:
      "MTK Dairy is Pakistan's leading smart dairy farm management software that helps farmers track milk production, manage cattle health, breeding records, and farm finances all in one place.",
  },
  {
    question: 'Is MTK Dairy free to use?',
    answer:
      'Yes! MTK Dairy offers a free plan for small farms with up to 5 animals. We also offer Professional and Farm plans for larger operations with more features.',
  },
  {
    question: 'Can I use MTK Dairy in Urdu?',
    answer:
      'Yes, MTK Dairy supports both English and Urdu languages. You can switch between languages in your settings. ہاں، ایم ٹی کے ڈیری اردو اور انگریزی دونوں زبانوں میں دستیاب ہے۔',
  },
  {
    question: 'Does MTK Dairy work on mobile phones?',
    answer:
      'Absolutely! MTK Dairy is a Progressive Web App (PWA) that works on any smartphone, tablet, or computer. You can install it on your phone for quick access.',
  },
  {
    question: 'How do I track milk production?',
    answer:
      'Simply log your daily milk production with our easy-to-use interface. You can record morning and evening sessions, track by animal, and view detailed analytics and reports.',
  },
  {
    question: 'Can I manage buffalo and cow farms together?',
    answer:
      'Yes! MTK Dairy supports multiple animal types including cows, buffaloes, goats, sheep, and chickens. You can manage all your livestock from a single dashboard.',
  },
  {
    question: 'Is my farm data secure?',
    answer:
      'Your data is encrypted and stored securely on enterprise-grade servers. We use bank-level security to protect your farm information.',
  },
  {
    question: 'How can I contact support?',
    answer:
      'You can reach our support team via WhatsApp at +92-302-0718182, email at support@maliktechdairy.com, or through the in-app chat feature.',
  },
];

// Generate all keywords as a single array
export const allKeywords = [...pakistanKeywords, ...internationalKeywords, ...longTailKeywords];

// Metadata generator function
export function generateMetadata(pageTitle?: string, pageDescription?: string) {
  const title = pageTitle ? `${pageTitle} | ${siteConfig.name}` : siteConfig.title;
  const description = pageDescription || siteConfig.description;

  return {
    title,
    description,
    keywords: allKeywords.join(', '),
    authors: [{ name: 'MTK Dairy Team', url: siteConfig.url }],
    creator: 'MalikTech',
    publisher: 'MTK Dairy',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: siteConfig.url,
      languages: Object.fromEntries(alternateLanguages.map(lang => [lang.hrefLang, lang.href])),
    },
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: siteConfig.name,
      title,
      description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: 'MTK Dairy - Smart Dairy Farm Management',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [siteConfig.ogImage],
      creator: '@mtkdairy',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: siteConfig.verification,
  };
}
