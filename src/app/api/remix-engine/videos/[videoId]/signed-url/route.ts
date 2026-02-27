// src/app/api/remix-engine/videos/[videoId]/signed-url/route.ts
// GET — generate a 1-hour signed URL for video playback

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/remix-engine/videos/[videoId]/signed-url
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { videoId } = await params;

  // Fetch video to get video_file_path
  const { data: video, error: fetchError } = await supabase
    .from('re_videos')
    .select('video_file_path')
    .eq('id', videoId)
    .single();

  if (fetchError || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  if (!video.video_file_path) {
    return NextResponse.json({ error: 'Video not yet downloaded' }, { status: 404 });
  }

  // Generate 1-hour signed URL (3600 seconds)
  const { data, error: signedError } = await supabaseAdmin.storage
    .from('remix-engine')
    .createSignedUrl(video.video_file_path, 3600);

  if (signedError || !data) {
    return NextResponse.json({ error: signedError?.message ?? 'Failed to generate signed URL' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, expiresIn: 3600 });
}
