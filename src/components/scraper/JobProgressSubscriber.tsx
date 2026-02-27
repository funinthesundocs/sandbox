'use client';

// src/components/scraper/JobProgressSubscriber.tsx
// Orchestrates live scrape progress display and auto-navigation.
// Uses useJobProgress to subscribe to Realtime updates, renders ScrapeProgressSteps,
// and auto-navigates to the video detail page 800ms after status=complete.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJobProgress } from '@/hooks/useJobProgress';
import { ScrapeProgressSteps } from './ScrapeProgressSteps';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface JobProgressSubscriberProps {
  jobId: string;
  videoId: string;
  projectId: string;
  videoTitle?: string;
  onDismiss?: () => void;
}

export function JobProgressSubscriber({
  jobId,
  videoId,
  projectId,
  videoTitle,
  onDismiss,
}: JobProgressSubscriberProps) {
  const router = useRouter();
  const progress = useJobProgress(jobId);

  // Auto-navigate when scrape completes
  useEffect(() => {
    if (progress?.status === 'complete') {
      const timer = setTimeout(() => {
        router.push(`/dashboard/projects/${projectId}/videos/${videoId}`);
      }, 800); // Brief delay so user sees the complete state
      return () => clearTimeout(timer);
    }
  }, [progress?.status, projectId, videoId, router]);

  if (!progress) return null;

  return (
    <div
      className="p-4 rounded-[--re-border-radius] bg-[--re-bg-secondary]/80 border border-[--re-border]/60 relative"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Dismiss button — only when not actively processing */}
      {(progress.status === 'error' || progress.status === 'cancelled') &&
        onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 w-6 h-6"
            onClick={onDismiss}
          >
            <X className="w-3 h-3" />
          </Button>
        )}

      {/* Video title */}
      {videoTitle && (
        <p className="text-[--re-text-primary] text-sm font-medium mb-3 truncate pr-8">
          {videoTitle}
        </p>
      )}

      {/* Step progress indicator */}
      <ScrapeProgressSteps
        progress={progress.progress}
        status={progress.status}
        errorMessage={progress.errorMessage}
      />

      {/* Completion message */}
      {progress.status === 'complete' && (
        <p className="text-[--re-success] text-sm mt-3">
          Scrape complete! Navigating to video...
        </p>
      )}
    </div>
  );
}
