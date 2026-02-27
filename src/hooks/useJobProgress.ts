'use client';

// src/hooks/useJobProgress.ts
// React hook — subscribes to Supabase Realtime on re_jobs to provide live progress updates.
// Uses the browser Supabase client (anon key, cookie session) for Realtime.

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'complete' | 'error' | 'cancelled';
  progress: number;           // 0-100
  errorMessage: string | null;
  result: { videoId?: string; transcriptSegmentCount?: number } | null;
}

/**
 * useJobProgress(jobId) — Subscribes to Supabase Realtime on re_jobs filtered by jobId.
 * Returns live JobProgress or null if jobId is null or data not yet loaded.
 */
export function useJobProgress(jobId: string | null): JobProgress | null {
  const [data, setData] = useState<JobProgress | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const supabaseClient = createClient();

    // Initial fetch to get current state immediately
    supabaseClient
      .from('re_jobs')
      .select('id, status, progress, error_message, result')
      .eq('id', jobId)
      .single()
      .then(({ data: row }) => {
        if (row) {
          setData({
            jobId,
            status: row.status as JobProgress['status'],
            progress: row.progress,
            errorMessage: row.error_message,
            result: row.result as JobProgress['result'],
          });
        }
      });

    // Subscribe to Realtime updates
    const subscription = supabaseClient
      .channel(`re_jobs_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 're_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          setData({
            jobId,
            status: row['status'] as JobProgress['status'],
            progress: row['progress'] as number,
            errorMessage: row['error_message'] as string | null,
            result: row['result'] as JobProgress['result'],
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [jobId]);

  return data;
}
