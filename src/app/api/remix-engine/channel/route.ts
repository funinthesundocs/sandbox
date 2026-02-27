// src/app/api/remix-engine/channel/route.ts
// GET — List videos from a YouTube channel for the browse-and-pick UI.
//
// Query params:
//   channelUrl  (required) — YouTube channel URL (any supported format)
//   pageToken   (optional) — Pagination token from previous response
//
// Returns:
//   200 { channelId, items: ChannelVideo[], nextPageToken, totalResults }
//   400 { error }  — missing or invalid channelUrl, or URL is a video not a channel
//   401 { error: 'Unauthorized' }
//   502 { error }  — YouTube API error

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseYouTubeUrl } from '@/lib/youtube-api/url-parser';
import { resolveChannelId, fetchChannelVideos } from '@/lib/youtube-api/channel';

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const channelUrl = searchParams.get('channelUrl');
  const pageToken = searchParams.get('pageToken') ?? undefined;

  if (!channelUrl) {
    return NextResponse.json(
      { error: 'Missing required query parameter: channelUrl' },
      { status: 400 }
    );
  }

  // Parse the channel URL
  let parsed: ReturnType<typeof parseYouTubeUrl>;
  try {
    parsed = parseYouTubeUrl(channelUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid YouTube URL' },
      { status: 400 }
    );
  }

  // Reject video URLs — caller must provide a channel URL
  if (parsed.type === 'video') {
    return NextResponse.json(
      { error: 'URL is a video, not a channel. Provide a channel or handle URL.' },
      { status: 400 }
    );
  }

  // Resolve handle/slug to canonical UCxxxxxxxx channel ID
  let channelId: string;
  try {
    channelId = await resolveChannelId(parsed.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not resolve channel';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Fetch paginated video list
  let page: Awaited<ReturnType<typeof fetchChannelVideos>>;
  try {
    page = await fetchChannelVideos(channelId, pageToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch channel videos';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    channelId,
    items: page.items,
    nextPageToken: page.nextPageToken,
    totalResults: page.totalResults,
  });
}
