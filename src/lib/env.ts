import { z } from 'zod';

// Environment variable schema for validation
const envSchema = z.object({
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  CLERK_WEBHOOK_SECRET: z.string().min(1, 'Clerk webhook secret is required'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  SUPABASE_DATABASE_URL: z.string().min(1, 'Supabase database URL is required'),

  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: z.string().url('Invalid Firebase database URL'),

  // Firebase Admin
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1, 'Firebase admin project ID is required'),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email('Invalid Firebase admin client email'),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1, 'Firebase admin private key is required'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary cloud name is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API key is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API secret is required'),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Public Cloudinary cloud name is required'),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'Resend API key is required'),
  RESEND_FROM_EMAIL: z.string().email('Invalid Resend from email'),

  // Groq AI
  GROQ_API_KEY: z.string().min(1, 'Groq API key is required'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1, 'App name is required'),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().email('Invalid support email'),

  // Feature Flags
  REQUIRE_ADMIN_APPROVAL: z.string().transform((val) => val === 'true'),
  FREE_PLAN_FEATURE_LIMITS: z.string().transform((val) => val === 'true'),
  PROFESSIONAL_PLAN_FEATURE_LIMITS: z.string().transform((val) => val === 'true'),
  FARM_PLAN_FEATURE_LIMITS: z.string().transform((val) => val === 'true'),
  ENTERPRISE_PLAN_FEATURE_LIMITS: z.string().transform((val) => val === 'true'),

  // Security
  ENCRYPTION_KEY: z.string().length(64, 'Encryption key must be 64 characters (32 bytes hex encoded)'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Optional variables
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Payment Gateways (optional for MVP)
  JAZZCASH_MERCHANT_ID: z.string().optional(),
  JAZZCASH_PASSWORD: z.string().optional(),
  JAZZCASH_INTEGRETY_SALT: z.string().optional(),
  JAZZCASH_RETURN_URL: z.string().url().optional(),

  EASYPAISA_STORE_ID: z.string().optional(),
  EASYPAISA_HASH_KEY: z.string().optional(),
  EASYPAISA_RETURN_URL: z.string().url().optional(),

  // Monitoring (optional)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Twilio (optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

// Validate environment variables
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`   • ${err.path.join('.')}: ${err.message}`);
      });

      // In development, show helpful message
      if (process.env.NODE_ENV === 'development') {
      }
    }
    return { success: false, error };
  }
}

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

// Export validated environment
export const env = process.env as unknown as Env;
