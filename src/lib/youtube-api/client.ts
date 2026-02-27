// src/lib/youtube-api/client.ts
// Authenticated fetch wrapper for YouTube Data API v3.
// API key is ALWAYS sourced from getServerConfig() — never process.env.

import { getServerConfig } from '@/lib/remix-engine/config';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * youtubeGet — Authenticated fetch wrapper for YouTube Data API v3.
 *
 * @param endpoint - API endpoint name (e.g. 'videos', 'search', 'channels')
 * @param params   - Query parameters (key is added automatically)
 * @returns Parsed JSON response typed as T
 * @throws Error on non-OK response or quota exceeded
 */
export async function youtubeGet<T = unknown>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = getServerConfig().apiKeys.youtube;
  const url = `${YOUTUBE_API_BASE}/${endpoint}?${new URLSearchParams({ ...params, key: apiKey })}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.text();

    // Special case: quota exceeded
    if (response.status === 403 && errorBody.includes('quotaExceeded')) {
      throw new Error('YouTube API quota exceeded. Try again tomorrow.');
    }

    throw new Error(`YouTube API ${response.status}: ${errorBody}`);
  }

  return (await response.json()) as T;
}

/**
 * parseIsoDuration — Converts YouTube ISO 8601 duration string to total seconds.
 *
 * Examples:
 *   "PT5M30S"   → 330
 *   "PT1H2M3S"  → 3723
 *   "PT45S"     → 45
 *   "P0D"       → 0
 */
export function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const h = parseInt(match[1] ?? '0', 10);
  const m = parseInt(match[2] ?? '0', 10);
  const s = parseInt(match[3] ?? '0', 10);

  return h * 3600 + m * 60 + s;
}
