import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.+\/api\/(animals|milk|health)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'mtk-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

// Content Security Policy - Secure headers for production
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://js.sentry-cdn.com https://*.posthog.com https://challenges.cloudflare.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https: http:;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.supabase.co wss://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://*.sentry.io https://*.posthog.com https://api.cloudinary.com https://res.cloudinary.com https://*.upstash.io;
  frame-src 'self' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';${process.env.NODE_ENV === 'production' ? '\n  upgrade-insecure-requests;' : ''}
`
  .replace(/\s{2,}/g, ' ')
  .trim();

// Security headers configuration
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.firebaseapp.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // API configuration
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limit request body size to 1MB
    },
    responseLimit: '1mb', // Limit response size to 1MB
    externalResolver: true,
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Add CORS headers for API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://maliktechdairy.com' : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Request-ID, X-Tenant-ID, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 hours
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      '@supabase/supabase-js',
      '@clerk/nextjs',
      'recharts',
      'zod',
    ],
    // Enable turbopack for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Suppress warnings for lockfile detection
  outputFileTracingRoot: process.cwd(),

  // Reduce memory usage during development
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };

      // Fix for Array buffer allocation failed
      config.cache = {
        type: 'filesystem',
        compression: false,
      };
    }
    return config;
  },
};

// Chain the wrappers
let exportedConfig = withNextIntl(nextConfig);
exportedConfig = withPWA(exportedConfig as any);

if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Only import and use Sentry if DSN is configured
  const { withSentryConfig } = require('@sentry/nextjs');

  exportedConfig = withSentryConfig(exportedConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  });
}

// Disable Sentry in development to save memory
if (process.env.NODE_ENV === 'development') {
  exportedConfig = withNextIntl(nextConfig);
}

export default exportedConfig;
