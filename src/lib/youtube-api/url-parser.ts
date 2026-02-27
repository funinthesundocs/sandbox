// src/lib/youtube-api/url-parser.ts
// Parse all YouTube URL formats into a normalized shape.

export interface ParsedYouTubeUrl {
  type: 'video' | 'channel' | 'handle' | 'playlist';
  id: string;       // videoId, channelId, @handle, or playlistId
  rawUrl: string;   // Original URL
}

/**
 * parseYouTubeUrl — Normalizes all YouTube URL formats into a consistent shape.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://m.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - https://www.youtube.com/channel/UCxxxxxxxx
 * - https://www.youtube.com/c/ChannelName
 * - https://www.youtube.com/@HandleName
 * - https://www.youtube.com/playlist?list=PLxxxxxxxx
 */
export function parseYouTubeUrl(url: string): ParsedYouTubeUrl {
  // Will throw if invalid URL
  const parsed = new URL(url);
  const { hostname, pathname, searchParams } = parsed;

  // youtu.be short links → video
  if (hostname === 'youtu.be') {
    const id = pathname.slice(1).split('?')[0];
    if (!id) throw new Error(`Unsupported YouTube URL format: ${url}`);
    return { type: 'video', id, rawUrl: url };
  }

  // Must be youtube.com (www, m, or bare)
  const isYouTube =
    hostname === 'www.youtube.com' ||
    hostname === 'youtube.com' ||
    hostname === 'm.youtube.com';
  if (!isYouTube) {
    throw new Error(`Unsupported YouTube URL format: ${url}`);
  }

  // /watch?v=...
  if (pathname.startsWith('/watch')) {
    const id = searchParams.get('v');
    if (!id) throw new Error(`Unsupported YouTube URL format: ${url}`);
    return { type: 'video', id, rawUrl: url };
  }

  // /shorts/<id>
  if (pathname.startsWith('/shorts/')) {
    const id = pathname.split('/')[2];
    if (!id) throw new Error(`Unsupported YouTube URL format: ${url}`);
    return { type: 'video', id, rawUrl: url };
  }

  // /channel/<channelId>
  if (pathname.startsWith('/channel/')) {
    const id = pathname.split('/')[2];
    if (!id) throw new Error(`Unsupported YouTube URL format: ${url}`);
    return { type: 'channel', id, rawUrl: url };
  }

  // /c/<slug>  (custom URL slug — needs resolve via API)
  if (pathname.startsWith('/c/')) {
    const id = pathname.split('/')[2];
    if (!id) throw new Error(`Unsupported YouTube URL format: ${url}`);
    return { type: 'channel', id, rawUrl: url };
  }

  // /@handle  (keep @ prefix)
  if (pathname.startsWith('/@')) {
    const id = '@' + pathname.split('/')[1].slice(1);
    if (id === '@') throw new Error(`Unsupported YouTube URL format: ${url}`);
    return { type: 'handle', id, rawUrl: url };
  }

  // /playlist?list=...
  if (pathname.startsWith('/playlist')) {
    const id = searchParams.get('list');
    if (!id) throw new Error(`Unsupported YouTube URL format: ${url}`);
    return { type: 'playlist', id, rawUrl: url };
  }

  throw new Error(`Unsupported YouTube URL format: ${url}`);
}

/**
 * extractYouTubeId — Convenience function. Returns the video ID from a YouTube URL.
 * Throws if the URL is not a video URL.
 */
export function extractYouTubeId(url: string): string {
  const parsed = parseYouTubeUrl(url);
  if (parsed.type !== 'video') {
    throw new Error(
      `Expected a YouTube video URL but got type '${parsed.type}': ${url}`
    );
  }
  return parsed.id;
}

/**
 * isVideoUrl — Returns true if the URL is a YouTube video URL.
 */
export function isVideoUrl(url: string): boolean {
  try {
    return parseYouTubeUrl(url).type === 'video';
  } catch {
    return false;
  }
}

/**
 * isChannelUrl — Returns true if the URL is a YouTube channel or handle URL.
 */
export function isChannelUrl(url: string): boolean {
  try {
    const { type } = parseYouTubeUrl(url);
    return type === 'channel' || type === 'handle';
  } catch {
    return false;
  }
}
