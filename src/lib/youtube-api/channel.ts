// src/lib/youtube-api/channel.ts
// Channel video listing and handle/slug resolution via YouTube Data API v3.
// Uses youtubeGet() from client.ts — never reads process.env directly.

import { youtubeGet } from './client';

// Raw YouTube API shape for a search result item (not exported)
interface YoutubeSearchItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

// Raw YouTube API shape for a channel item (not exported)
interface YoutubeChannelItem {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

export interface ChannelVideo {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number | null;  // null — search.list doesn't return duration
  publishedAt: string;
  channelName: string;
  channelId: string;
}

export interface ChannelVideosPage {
  items: ChannelVideo[];
  nextPageToken: string | null;
  totalResults: number;
}

/**
 * fetchChannelVideos — Lists videos from a channel using YouTube search.list.
 * Returns up to 50 videos per page ordered by most recent first.
 *
 * Note: durationSeconds is always null — search.list does not include contentDetails.
 * Call fetchVideoMetadata() separately for each video if durations are required.
 *
 * @param channelId  - YouTube channel ID (UCxxxxxxxx)
 * @param pageToken  - Optional pagination token from a previous response
 */
export async function fetchChannelVideos(
  channelId: string,
  pageToken?: string
): Promise<ChannelVideosPage> {
  const params: Record<string, string> = {
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: '50',
    ...(pageToken ? { pageToken } : {}),
  };

  const data = await youtubeGet<{
    items: YoutubeSearchItem[];
    nextPageToken?: string;
    pageInfo: { totalResults: number };
  }>('search', params);

  const items: ChannelVideo[] = (data.items ?? []).map((item) => ({
    youtubeId: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default.url,
    durationSeconds: null,
    publishedAt: item.snippet.publishedAt,
    channelName: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
  }));

  return {
    items,
    nextPageToken: data.nextPageToken ?? null,
    totalResults: data.pageInfo.totalResults,
  };
}

/**
 * resolveChannelId — Resolves a channel handle, slug, or direct channelId to a
 * canonical UCxxxxxxxx channel ID.
 *
 * @param urlOrHandle - One of:
 *   - "UCxxxxxxxx"    → returned as-is (already a channelId)
 *   - "@HandleName"   → resolved via channels.list?forHandle
 *   - "ChannelSlug"   → resolved via channels.list?forUsername
 */
export async function resolveChannelId(urlOrHandle: string): Promise<string> {
  // Already a channel ID
  if (urlOrHandle.startsWith('UC')) {
    return urlOrHandle;
  }

  let params: Record<string, string>;

  if (urlOrHandle.startsWith('@')) {
    // Handle — strip the leading @
    params = { part: 'snippet', forHandle: urlOrHandle.slice(1) };
  } else {
    // Legacy username / custom slug
    params = { part: 'snippet', forUsername: urlOrHandle };
  }

  const data = await youtubeGet<{ items?: YoutubeChannelItem[] }>(
    'channels',
    params
  );

  if (!data.items?.length) {
    throw new Error(`Channel not found: ${urlOrHandle}`);
  }

  return data.items[0].id;
}

/**
 * fetchChannelInfo — Returns basic display info for a channel.
 *
 * @param channelId - YouTube channel ID (UCxxxxxxxx)
 */
export async function fetchChannelInfo(
  channelId: string
): Promise<{ name: string; thumbnailUrl: string }> {
  const data = await youtubeGet<{ items: YoutubeChannelItem[] }>('channels', {
    part: 'snippet',
    id: channelId,
  });

  if (!data.items?.length) {
    throw new Error(`Channel not found: ${channelId}`);
  }

  const item = data.items[0];
  return {
    name: item.snippet.title,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.default.url,
  };
}
