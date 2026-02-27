// src/app/api/remix-engine/videos/[videoId]/transcript/route.ts
// PATCH — save edited transcript segments to Supabase Storage + re_videos.original_transcript

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { storagePath } from '@/lib/remix-engine/server-helpers';

interface TranscriptSegment {
  timestamp: string;
  startMs: number;
  text: string;
}

// PATCH /api/remix-engine/videos/[videoId]/transcript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { videoId } = await params;

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { segments } = body as { segments: TranscriptSegment[] };

  // Validate
  if (!Array.isArray(segments)) {
    return NextResponse.json({ error: 'segments must be an array' }, { status: 400 });
  }
  if (segments.length > 1000) {
    return NextResponse.json({ error: 'segments exceeds max of 1000 items' }, { status: 400 });
  }

  // Fetch project_id to construct storage path
  const { data: video, error: fetchError } = await supabaseAdmin
    .from('re_videos')
    .select('project_id')
    .eq('id', videoId)
    .single();

  if (fetchError || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  // Upload updated transcript.json to Supabase Storage (upsert)
  const transcriptPath = storagePath('videos', video.project_id, videoId, 'transcript.json');
  const { error: uploadError } = await supabaseAdmin.storage
    .from('remix-engine')
    .upload(
      transcriptPath,
      Buffer.from(JSON.stringify(segments)),
      { contentType: 'application/json', upsert: true }
    );

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Build plain text version and update re_videos.original_transcript
  const transcriptText = segments.map(s => s.text).join(' ');
  const { error: updateError } = await supabaseAdmin
    .from('re_videos')
    .update({ original_transcript: transcriptText, updated_at: new Date().toISOString() })
    .eq('id', videoId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
