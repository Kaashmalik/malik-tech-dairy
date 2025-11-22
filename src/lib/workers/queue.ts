// BullMQ Queue Setup for Background Jobs
import { Queue, Worker, QueueEvents } from "bullmq";
import { Redis } from "@upstash/redis";

// Initialize Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create connection config for BullMQ
const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL?.replace("https://", "").replace(".upstash.io", "") || "",
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
};

// Queue names
export const QUEUE_NAMES = {
  REPORTS: "reports",
  SMS: "sms",
  EMAIL: "email",
  PREDICTIONS: "predictions",
  PAYMENT_RENEWAL: "payment_renewal",
} as const;

// Create queues
export const reportQueue = new Queue(QUEUE_NAMES.REPORTS, { connection });
export const smsQueue = new Queue(QUEUE_NAMES.SMS, { connection });
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection });
export const predictionQueue = new Queue(QUEUE_NAMES.PREDICTIONS, { connection });
export const paymentRenewalQueue = new Queue(QUEUE_NAMES.PAYMENT_RENEWAL, { connection });

// Queue events for monitoring
export const reportQueueEvents = new QueueEvents(QUEUE_NAMES.REPORTS, { connection });
export const smsQueueEvents = new QueueEvents(QUEUE_NAMES.SMS, { connection });
export const emailQueueEvents = new QueueEvents(QUEUE_NAMES.EMAIL, { connection });

// Export Redis instance for direct use if needed
export { redis };

