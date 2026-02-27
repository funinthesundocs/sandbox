import fs from 'fs';
import path from 'path';

const TEMP_BASE = '/tmp/remixengine';

/**
 * Returns the temp directory path for a given videoId.
 * Always use this function — never construct the path manually elsewhere.
 */
export function getTempDir(videoId: string): string {
  return path.join(TEMP_BASE, videoId);
}

/**
 * Ensures the temp directory for a given videoId exists, creating it if necessary.
 * Returns the directory path.
 */
export function ensureTempDir(videoId: string): string {
  const dir = getTempDir(videoId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * MANDATORY: Always call in finally block of worker handlers — even on error.
 *
 * Deletes the temp directory for a given videoId.
 * Swallows errors — safe to call even if the directory does not exist.
 */
export function cleanTempDir(videoId: string): void {
  const dir = getTempDir(videoId);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[cleanTempDir] Could not remove ${dir}:`, err);
  }
}
