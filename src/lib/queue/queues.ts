// src/lib/queue/queues.ts
// BullMQ queue definitions for the RemixEngine pipeline.
// Queue names: scrape, remix, generate, render
// Import these queues to enqueue jobs from API routes.
// Workers consume from these queues in src/worker/handlers/.

import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const scrapeQueue = new Queue('scrape', {
  connection: redisConnection,
});

export const remixQueue = new Queue('remix', {
  connection: redisConnection,
});

export const generateQueue = new Queue('generate', {
  connection: redisConnection,
});

export const renderQueue = new Queue('render', {
  connection: redisConnection,
});
