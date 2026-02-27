// src/app/api/remix-engine/videos/[videoId]/route.ts
// GET  — fetch video detail
// DELETE — remove video from storage and DB

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/remix-engine/videos/[videoId]
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

  const { data: video, error } = await supabase
    .from('re_videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  return NextResponse.json({ video });
}

// DELETE /api/remix-engine/videos/[videoId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role — require editor or admin
  const { data: reUser } = await supabase
    .from('re_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!reUser || (reUser.role !== 'editor' && reUser.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { videoId } = await params;

  // Fetch video to get file paths
  const { data: video, error: fetchError } = await supabaseAdmin
    .from('re_videos')
    .select('video_file_path, thumbnail_file_path, transcript_file_path')
    .eq('id', videoId)
    .single();

  if (fetchError || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  // Delete storage files (guard against nulls)
  const paths = [video.video_file_path, video.thumbnail_file_path, video.transcript_file_path]
    .filter(Boolean) as string[];

  if (paths.length > 0) {
    await supabaseAdmin.storage.from('remix-engine').remove(paths);
  }

  // Delete DB record (CASCADE deletes re_jobs, re_scenes related to this video)
  const { error: deleteError } = await supabaseAdmin
    .from('re_videos')
    .delete()
    .eq('id', videoId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
