// src/lib/remix-engine/server-helpers.ts
// Server-side utility functions — safe to import in API routes and worker.
// Does NOT import from React. Client-side helpers are in hooks.ts.

import { getServerConfig } from './config';

/**
 * table(name) — SERVER-SIDE helper. Returns prefixed table name.
 * Example: table('videos') → 're_videos'
 * Never write bare table names in queries — always use this helper.
 */
export function table(name: string): string {
  return `${getServerConfig().tablePrefix}${name}`;
}

/**
 * storagePath(...segments) — SERVER-SIDE helper. Returns prefixed storage path.
 * Example: storagePath('videos', projectId, videoId, 'original.mp4')
 *          → 'remix-engine/videos/{projectId}/{videoId}/original.mp4'
 * Never construct storage paths manually — always use this helper.
 */
export function storagePath(...segments: string[]): string {
  return [getServerConfig().storagePrefix, ...segments].join('/');
}
