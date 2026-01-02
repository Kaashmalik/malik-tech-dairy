// BullMQ Worker: Process Prediction Jobs
// Note: BullMQ requires ioredis (TCP Redis), not available on Vercel serverless
// This module provides a no-op export during build and when Redis is not configured

import { QUEUE_NAMES } from './queue';

// Check if Redis TCP is available (BullMQ requires ioredis, not Upstash REST)
// Since Vercel serverless doesn't support persistent TCP connections,
// we use Upstash's REST API for caching and skip BullMQ workers
const canUseBullMQ = false; // BullMQ not supported on Vercel serverless

// Export a null worker - jobs will be processed synchronously via API routes
// or through Vercel Cron Jobs for scheduled tasks
export const predictionWorker = null;

// Note: For background job processing on Vercel, consider:
// 1. Vercel Cron Jobs for scheduled tasks
// 2. Upstash QStash for async job queues
// 3. Processing jobs synchronously in API routes
