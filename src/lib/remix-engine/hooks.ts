// src/lib/remix-engine/hooks.ts
// Client-side hook and server-side helpers for RemixEngine.
// DO NOT read process.env here — use getServerConfig() or useRemixEngine().

import { createContext, useContext } from 'react';
import { RemixEngineConfig, getServerConfig } from './config';

// Exported so RemixEngineProvider can import and populate it.
export const RemixEngineContext = createContext<RemixEngineConfig | null>(null);

/**
 * useRemixEngine() — Client-side hook to access RemixEngine config.
 * Must be used inside <RemixEngineProvider>.
 */
export function useRemixEngine(): RemixEngineConfig {
  const ctx = useContext(RemixEngineContext);
  if (!ctx) {
    throw new Error(
      'useRemixEngine() must be used inside <RemixEngineProvider>. ' +
      'Wrap your app (or the relevant subtree) with <RemixEngineProvider>.'
    );
  }
  return ctx;
}

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
