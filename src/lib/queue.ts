/**
 * Background Job Queue with BullMQ
 * Handles asynchronous tasks like email sending, notifications, data processing
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis connection for BullMQ
let redisConnection: Redis | null = null;
if (isRedisConfigured) {
  redisConnection = new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
    password: process.env.UPSTASH_REDIS_REST_TOKEN,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });
}

/**
 * Job types
 */
export enum JobType {
  SEND_EMAIL = 'send-email',
  SEND_NOTIFICATION = 'send-notification',
  GENERATE_REPORT = 'generate-report',
  PROCESS_EXPORT = 'process-export',
  PROCESS_IMPORT = 'process-import',
  CLEANUP_OLD_DATA = 'cleanup-old-data',
  SYNC_EXTERNAL_DATA = 'sync-external-data',
  CALCULATE_ANALYTICS = 'calculate-analytics',
  SEND_REMINDER = 'send-reminder',
  BACKUP_DATA = 'backup-data',
}

/**
 * Job data interfaces
 */
export interface SendEmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tenantId?: string;
}

export interface SendNotificationJobData {
  userId: string;
  tenantId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface GenerateReportJobData {
  tenantId: string;
  userId: string;
  reportType: string;
  startDate: string;
  endDate: string;
}

export interface ProcessExportJobData {
  tenantId: string;
  userId: string;
  resource: string;
  filters: Record<string, unknown>;
}

/**
 * Create a job queue
 */
export function createQueue<T = unknown>(name: string): Queue<T> {
  if (!redisConnection) {
    throw new Error('Redis not configured for job queue');
  }

  return new Queue<T>(name, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        count: 100,
        age: 24 * 3600, // 24 hours
      },
      removeOnFail: {
        count: 500,
        age: 7 * 24 * 3600, // 7 days
      },
    },
  });
}

/**
 * Create a job worker
 */
export function createWorker<T = unknown>(
  name: string,
  processor: (job: Job<T>) => Promise<void>,
  options?: {
    concurrency?: number;
  }
): Worker<T> {
  if (!redisConnection) {
    throw new Error('Redis not configured for job queue');
  }

  return new Worker<T>(name, processor, {
    connection: redisConnection,
    concurrency: options?.concurrency || 5,
  });
}

/**
 * Add a job to the queue
 */
export async function addJob<T = unknown>(
  queueName: string,
  jobType: string,
  data: T,
  options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  }
): Promise<Job> {
  const queue = createQueue<T>(queueName);

  const job = await queue.add(jobType as any, data as any, {
    delay: options?.delay,
    priority: options?.priority,
    attempts: options?.attempts,
  });

  return job as unknown as Job;
}

/**
 * Get job status
 */
export async function getJobStatus<T = unknown>(
  queueName: string,
  jobId: string
): Promise<{
  id: string;
  name: string;
  progress: number;
  data: T;
  failedReason?: string;
  processedOn?: number;
  finishedOn?: number;
} | null> {
  const queue = createQueue<T>(queueName);
  const job = await queue.getJob(jobId);

  if (!job) return null;

  const state = await job.getState();

  return {
    id: job.id!,
    name: job.name,
    progress: typeof job.progress === 'number' ? job.progress : 0,
    data: job.data,
    failedReason: job.failedReason || undefined,
    processedOn: job.processedOn || undefined,
    finishedOn: job.finishedOn || undefined,
  };
}

/**
 * Initialize all job queues and workers
 */
export function initializeJobQueues() {
  if (!redisConnection) {
    console.warn('Redis not configured, job queues disabled');
    return;
  }

  // Email queue
  const emailQueue = createQueue<SendEmailJobData>('emails');

  // Notification queue
  const notificationQueue = createQueue<SendNotificationJobData>('notifications');

  // Reports queue
  const reportsQueue = createQueue<GenerateReportJobData>('reports');

  // Exports queue
  const exportsQueue = createQueue<ProcessExportJobData>('exports');

  console.log('Job queues initialized');

  return {
    emailQueue,
    notificationQueue,
    reportsQueue,
    exportsQueue,
  };
}

/**
 * Initialize job workers
 */
export function initializeJobWorkers() {
  if (!redisConnection) {
    console.warn('Redis not configured, job workers disabled');
    return;
  }

  // Email worker
  const emailWorker = createWorker<SendEmailJobData>('emails', async job => {
    const { to, subject, html, text } = job.data;

    // Send email using Resend
    try {
      const resend = await import('resend');
      const resendClient = new resend.Resend(process.env.RESEND_API_KEY);

      await resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@maliktechdairy.com',
        to,
        subject,
        html,
        text,
      });

      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  });

  // Notification worker
  const notificationWorker = createWorker<SendNotificationJobData>('notifications', async job => {
    const { userId, tenantId, title, message, type } = job.data;

    // Create notification in database
    const supabase = (await import('@/lib/supabase/server')).getSupabaseClient();
    await supabase.from('notifications').insert({
      user_id: userId,
      tenant_id: tenantId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    });

    console.log(`Notification created for user ${userId}`);
  });

  // Reports worker
  const reportsWorker = createWorker<GenerateReportJobData>('reports', async job => {
    const { tenantId, userId, reportType, startDate, endDate } = job.data;

    // Generate report based on type
    console.log(`Generating ${reportType} report for tenant ${tenantId}`);

    // Report generation logic would go here
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`Report generated for tenant ${tenantId}`);
  });

  // Handle worker errors
  const workers = [emailWorker, notificationWorker, reportsWorker];

  workers.forEach(worker => {
    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });

    worker.on('completed', job => {
      console.log(`Job ${job?.id} completed`);
    });
  });

  console.log('Job workers initialized');

  return {
    emailWorker,
    notificationWorker,
    reportsWorker,
  };
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: string) {
  const queue = createQueue(queueName);

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Pause a queue
 */
export async function pauseQueue(queueName: string) {
  const queue = createQueue(queueName);
  await queue.pause();
}

/**
 * Resume a queue
 */
export async function resumeQueue(queueName: string) {
  const queue = createQueue(queueName);
  await queue.resume();
}

/**
 * Clean up old jobs
 */
export async function cleanQueue(queueName: string, grace: number = 5000, limit: number = 1000) {
  const queue = createQueue(queueName);

  await queue.clean(grace, limit, 'completed');
  await queue.clean(grace, limit, 'failed');
}

/**
 * Shutdown all queues and workers
 */
export async function shutdownJobQueues() {
  if (!redisConnection) return;

  const queues = ['emails', 'notifications', 'reports', 'exports'];

  for (const queueName of queues) {
    const queue = createQueue(queueName);
    await queue.close();
  }

  await redisConnection.quit();
  console.log('Job queues shut down');
}
