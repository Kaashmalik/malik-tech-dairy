// Environment Variable Type Definitions
// Provides type safety for all environment variables

/**
 * Client-side environment variables (exposed to browser)
 */
export interface ClientEnv {
  // Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: string;
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: string;

  // Firebase (Legacy - to be migrated)
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;

  // Cloudinary
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string;

  // App Config
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_APP_NAME?: string;
}

/**
 * Server-side environment variables (never exposed to browser)
 */
export interface ServerEnv {
  // Clerk
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET?: string;

  // Firebase Admin
  FIREBASE_ADMIN_PROJECT_ID: string;
  FIREBASE_ADMIN_CLIENT_EMAIL: string;
  FIREBASE_ADMIN_PRIVATE_KEY: string;

  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;

  // Redis/Upstash
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;

  // Email
  RESEND_API_KEY: string;
  EMAIL_FROM?: string;

  // Cloudinary
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;

  // Sentry
  SENTRY_DSN?: string;
  SENTRY_ORG?: string;
  SENTRY_PROJECT?: string;
  SENTRY_AUTH_TOKEN?: string;

  // Payment Gateways
  JAZZCASH_MERCHANT_ID?: string;
  JAZZCASH_PASSWORD?: string;
  JAZZCASH_INTEGRITY_SALT?: string;
  EASYPAISA_STORE_ID?: string;
  EASYPAISA_HASH_KEY?: string;

  // OpenAI (for AI features)
  OPENAI_API_KEY?: string;
}

/**
 * Combined environment type
 */
export type Env = ClientEnv & ServerEnv;

/**
 * Get typed client environment variable
 */
export function getClientEnv<K extends keyof ClientEnv>(key: K): ClientEnv[K] {
  const value = process.env[key];
  if (!value && !key.endsWith('?')) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing client environment variable: ${key}`);
    }
  }
  return value as ClientEnv[K];
}

/**
 * Get typed server environment variable
 */
export function getServerEnv<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
  if (typeof window !== 'undefined') {
    throw new Error(`Cannot access server env ${key} on client side`);
  }
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'development') {
    console.warn(`Missing server environment variable: ${key}`);
  }
  return value as ServerEnv[K];
}

/**
 * Required environment variables for the app to function
 */
const REQUIRED_CLIENT_ENV: (keyof ClientEnv)[] = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const REQUIRED_SERVER_ENV: (keyof ServerEnv)[] = [
  'CLERK_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
];

/**
 * Validate required environment variables at startup
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const key of REQUIRED_CLIENT_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Only check server env on server side
  if (typeof window === 'undefined') {
    for (const key of REQUIRED_SERVER_ENV) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  return { valid: missing.length === 0, missing };
}

/**
 * Type-safe environment access with runtime validation
 */
export function requireEnv<K extends keyof Env>(key: K): Env[K] {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as Env[K];
}
