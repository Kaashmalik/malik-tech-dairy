// BullMQ Worker: Process Prediction Jobs
import { Worker } from 'bullmq';
import { QUEUE_NAMES } from './queue';
import { processMilkForecast } from './processors/predictions';

// Create connection config for BullMQ
const connection = {
  host:
    process.env.UPSTASH_REDIS_REST_URL?.replace('https://', '').replace('.upstash.io', '') || '',
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
};

// Create worker (only in server environment)
let predictionWorker: Worker | null = null;

if (typeof window === 'undefined' && process.env.UPSTASH_REDIS_REST_URL) {
  predictionWorker = new Worker(
    QUEUE_NAMES.PREDICTIONS,
    async job => {
      if (job.name === 'milk-forecast') {
        return await processMilkForecast(job);
      }
      throw new Error(`Unknown job type: ${job.name}`);
    },
    {
      connection,
      concurrency: 5, // Process up to 5 jobs concurrently
      limiter: {
        max: 10,
        duration: 1000, // Max 10 jobs per second
      },
    }
  );

  predictionWorker.on('completed', job => {
    console.log(`Prediction job ${job.id} completed`);
  });

  predictionWorker.on('failed', (job, err) => {
    console.error(`Prediction job ${job?.id} failed:`, err);
  });
}

export { predictionWorker };
