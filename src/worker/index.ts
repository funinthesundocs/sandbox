/**
 * Worker entry point — runs as separate Node.js process outside Next.js.
 * Uses tsconfig.worker.json. No @/ aliases. Import from relative paths only.
 *
 * Start with: npx ts-node -p tsconfig.worker.json src/worker/index.ts
 * Or build: npx tsc -p tsconfig.worker.json && node dist/worker/worker/index.js
 *
 * NOTE: process.env is read directly here — documented exception for the worker process.
 * The worker runs outside Next.js and cannot use getServerConfig() for Redis URL.
 */

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { handleScrapeJob } from './handlers/scrape';

const redisConnection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// ----------------------------------------------------------------
// Register workers
// ----------------------------------------------------------------

const scrapeWorker = new Worker('scrape', handleScrapeJob, {
  connection: redisConnection,
  concurrency: 3,
});

scrapeWorker.on('completed', (job) => {
  console.log(`[scrapeWorker] Job ${job.id} completed for video ${job.data?.videoId}`);
});

scrapeWorker.on('failed', (job, err) => {
  console.error(`[scrapeWorker] Job ${job?.id} failed:`, err.message);
});

console.log('RemixEngine worker running. Waiting for jobs...');

// ----------------------------------------------------------------
// Graceful shutdown
// ----------------------------------------------------------------

const shutdown = async (signal: string) => {
  console.log(`RemixEngine worker received ${signal}, shutting down gracefully...`);
  await scrapeWorker.close();
  await redisConnection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
