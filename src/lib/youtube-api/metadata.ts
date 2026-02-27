// src/lib/youtube-api/metadata.ts
// YouTube video metadata fetch via YouTube Data API v3.
// Uses youtubeGet() from client.ts — never reads process.env directly.

import { youtubeGet, parseIsoDuration } from './client';

// Raw YouTube API shape for a single video item (not exported)
interface YoutubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    liveBroadcastContent: string;
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
      standard?: { url: string };
      maxres?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
  };
}

export interface VideoMetadata {
  youtubeId: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  publishedAt: string;        // ISO timestamp from YouTube
  thumbnailUrl: string;       // Highest quality available
  isLiveBroadcast: boolean;   // true for live streams
}

/**
 * fetchVideoMetadata — Fetches full video metadata from YouTube Data API v3.
 *
 * @param youtubeId - YouTube video ID (e.g. "dQw4w9WgXcQ")
 * @returns VideoMetadata object
 * @throws Error('VIDEO_NOT_FOUND') if video is private or deleted
 */
export async function fetchVideoMetadata(youtubeId: string): Promise<VideoMetadata> {
  const data = await youtubeGet<{ items: YoutubeVideoItem[] }>('videos', {
    part: 'snippet,contentDetails,statistics',
    id: youtubeId,
  });

  if (!data.items?.length) {
    throw new Error('VIDEO_NOT_FOUND');
  }

  const item = data.items[0];
  const { snippet, contentDetails, statistics } = item;

  // Pick highest-quality thumbnail available
  const thumbnailUrl =
    snippet.thumbnails.maxres?.url ??
    snippet.thumbnails.high?.url ??
    snippet.thumbnails.medium?.url ??
    snippet.thumbnails.default.url;

  return {
    youtubeId: item.id,
    title: snippet.title,
    description: snippet.description || '',
    channelName: snippet.channelTitle,
    channelId: snippet.channelId,
    durationSeconds: parseIsoDuration(contentDetails.duration),
    viewCount: parseInt(statistics.viewCount ?? '0', 10),
    likeCount: parseInt(statistics.likeCount ?? '0', 10),
    publishedAt: snippet.publishedAt,
    thumbnailUrl,
    isLiveBroadcast: snippet.liveBroadcastContent === 'live',
  };
}
