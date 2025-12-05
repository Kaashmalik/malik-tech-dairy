import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.firebaseapp.com",
      },
      {
        protocol: "https",
        hostname: "**.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "**.clerk.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons", "date-fns"],
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
    }
    return config;
  },
};

// Conditionally wrap with Sentry only if configured
let exportedConfig = withNextIntl(nextConfig);

if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Only import and use Sentry if DSN is configured
  const { withSentryConfig } = require("@sentry/nextjs");
  
  exportedConfig = withSentryConfig(exportedConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  });
}

export default exportedConfig;
