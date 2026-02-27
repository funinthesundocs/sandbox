'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StartRemixButtonProps {
  videoId: string;
  projectId: string;
  scrapeStatus: 'pending' | 'processing' | 'complete' | 'error';
  remixStatus: 'pending' | 'processing' | 'complete' | 'error';
}

export function StartRemixButton({
  videoId,
  projectId,
  scrapeStatus,
  remixStatus,
}: StartRemixButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // If remix is already done, show "Re-remix" variant
  const isRemixed = remixStatus === 'complete';
  const isDisabled =
    scrapeStatus !== 'complete' || loading || remixStatus === 'processing';

  async function startRemix() {
    setLoading(true);
    setError(null);

    try {
      // Queue all 3 remix types in parallel — non-fatal if one fails
      await Promise.allSettled([
        fetch('/api/remix-engine/remix/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, projectId }),
        }),
        fetch('/api/remix-engine/remix/thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, projectId }),
        }),
        fetch('/api/remix-engine/remix/script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, projectId }),
        }),
      ]);

      // Navigate to remix review page regardless of individual failures
      // The review page will show what completed and what didn't
      router.push(
        `/dashboard/projects/${projectId}/videos/${videoId}/remix`
      );
    } catch {
      setError('Failed to start remix. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="default"
        size="sm"
        onClick={startRemix}
        disabled={isDisabled}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4 mr-1" />
        )}
        {loading ? 'Starting...' : isRemixed ? 'Re-remix' : 'Start Remix'}
      </Button>
      {error && (
        <span
          className="text-xs"
          style={{ color: 'var(--re-destructive)' }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
