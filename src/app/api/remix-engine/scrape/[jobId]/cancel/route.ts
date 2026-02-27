// src/app/api/remix-engine/scrape/[jobId]/cancel/route.ts
// POST — Mark a scrape job as cancelled in the DB.
//
// Note: This does NOT stop the BullMQ worker mid-execution. It marks the DB
// record as cancelled. The worker will still complete (or fail) and write its
// final state. True worker cancellation is a Phase 6 polish item.
//
// Returns:
//   200 { success: true }
//   401 { error: 'Unauthorized' }
//   404 { error: 'Job not found' }
//   500 { error }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;

  // Fetch the job to get the linked video_id
  const { data: job, error: fetchError } = await supabaseAdmin
    .from('re_jobs')
    .select('id, video_id, status')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Mark job as cancelled
  const { error: jobUpdateError } = await supabaseAdmin
    .from('re_jobs')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (jobUpdateError) {
    return NextResponse.json({ error: jobUpdateError.message }, { status: 500 });
  }

  // Also update the linked video's scrape_status to 'error'
  if (job.video_id) {
    await supabaseAdmin
      .from('re_videos')
      .update({
        scrape_status: 'error',
        error_message: 'Scrape was cancelled',
      })
      .eq('id', job.video_id);
    // Fire-and-forget — cancellation is best-effort on the video record
  }

  return NextResponse.json({ success: true });
}
