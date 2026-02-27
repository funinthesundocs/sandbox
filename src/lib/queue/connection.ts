// src/lib/queue/connection.ts
// IORedis connection instance shared across all BullMQ queues and workers.
// maxRetriesPerRequest: null is REQUIRED by BullMQ — do not remove.

import IORedis from 'ioredis';
import { getServerConfig } from '../remix-engine/config';

export const redisConnection = new IORedis(getServerConfig().redis.url, {
  maxRetriesPerRequest: null,
});
