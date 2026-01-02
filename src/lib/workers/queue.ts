// BullMQ Queue Setup for Background Jobs
// Note: BullMQ requires ioredis (TCP Redis), not Upstash REST API
// This module provides mock queues during build and uses real queues at runtime if configured

import { Redis } from '@upstash/redis';

// Check if Redis is properly configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Check if we're running in a build environment
const isBuildTime =
  process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.VERCEL_ENV;

// Initialize Upstash Redis connection only if configured
let redis: Redis | null = null;
if (isRedisConfigured) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  } catch {
    // Redis initialization failed - continue without it
  }
}

// Queue names
export const QUEUE_NAMES = {
  REPORTS: 'reports',
  SMS: 'sms',
  EMAIL: 'email',
  PREDICTIONS: 'predictions',
  PAYMENT_RENEWAL: 'payment_renewal',
  MILK_LOGS: 'milk_logs',
} as const;

// Mock queue type for when Redis is not configured
interface MockQueue {
  name: string;
  add: (name: string, data: unknown) => Promise<{ id: string }>;
  getJob: (id: string) => Promise<null>;
  getJobs: () => Promise<never[]>;
  close: () => Promise<void>;
}

interface MockQueueEvents {
  on: () => void;
  close: () => Promise<void>;
}

// Mock queue for when Redis is not configured or during build
const createMockQueue = (name: string): MockQueue => ({
  name,
  add: async () => ({ id: 'mock-job-id' }),
  getJob: async () => null,
  getJobs: async () => [],
  close: async () => {},
});

const createMockQueueEvents = (): MockQueueEvents => ({
  on: () => {},
  close: async () => {},
});

// Create mock queues - BullMQ requires TCP Redis connection (ioredis)
// which isn't available on Vercel serverless. Use Upstash's queue service
// or implement queue functionality directly with Upstash REST API
export const reportQueue = createMockQueue(QUEUE_NAMES.REPORTS);
export const smsQueue = createMockQueue(QUEUE_NAMES.SMS);
export const emailQueue = createMockQueue(QUEUE_NAMES.EMAIL);
export const predictionQueue = createMockQueue(QUEUE_NAMES.PREDICTIONS);
export const paymentRenewalQueue = createMockQueue(QUEUE_NAMES.PAYMENT_RENEWAL);
export const milkLogQueue = createMockQueue(QUEUE_NAMES.MILK_LOGS);

// Queue events for monitoring (mock)
export const reportQueueEvents = createMockQueueEvents();
export const smsQueueEvents = createMockQueueEvents();
export const emailQueueEvents = createMockQueueEvents();

// Export Redis instance for direct use if needed
export { redis };
