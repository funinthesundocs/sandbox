'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApprovalGateProps {
  videoId: string;
  projectId: string;
  hasTitleSelected: boolean;
  hasThumbnailSelected: boolean;
  hasScript: boolean;
  selectedTitleText?: string;
  selectedThumbnailIndex?: number;
  sceneCount: number;
}

export function ApprovalGate({
  videoId,
  projectId,
  hasTitleSelected,
  hasThumbnailSelected,
  hasScript,
  selectedTitleText,
  selectedThumbnailIndex,
  sceneCount,
}: ApprovalGateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const router = useRouter();

  const allReady = hasTitleSelected && hasThumbnailSelected && hasScript;

  async function confirm() {
    setApproving(true);
    try {
      const res = await fetch(
        `/api/remix-engine/videos/${videoId}/approve`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const { error } = await res.json();
        alert(error ?? 'Approval failed');
        return;
      }
      router.push(`/dashboard/projects/${projectId}/videos/${videoId}`);
    } finally {
      setApproving(false);
      setDialogOpen(false);
    }
  }

  const checks = [
    { label: 'Title selected', done: hasTitleSelected },
    { label: 'Thumbnail selected', done: hasThumbnailSelected },
    { label: 'Script reviewed', done: hasScript },
  ];

  return (
    <>
      {/* Sticky bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3 rounded-lg mb-6"
        style={{
          background: 'var(--re-bg-secondary)',
          border: '1px solid var(--re-border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-1.5">
              {check.done ? (
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: 'var(--re-success)' }}
                />
              ) : (
                <Circle
                  className="w-4 h-4"
                  style={{ color: 'var(--re-text-muted)' }}
                />
              )}
              <span
                className="text-sm"
                style={{
                  color: check.done
                    ? 'var(--re-text-primary)'
                    : 'var(--re-text-muted)',
                }}
              >
                {check.label}
              </span>
            </div>
          ))}
        </div>

        <Button
          variant="default"
          size="sm"
          disabled={!allReady}
          onClick={() => setDialogOpen(true)}
        >
          Approve &amp; Continue
        </Button>
      </div>

      {/* Confirmation dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-xl p-6 shadow-xl"
            style={{
              background: 'var(--re-bg-secondary)',
              border: '1px solid var(--re-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDialogOpen(false)}
              className="absolute top-4 right-4 p-1 rounded transition-colors"
              style={{
                color: 'var(--re-text-muted)',
                background: 'transparent',
              }}
            >
              <X className="w-4 h-4" />
            </button>

            <h3
              className="font-semibold mb-1"
              style={{
                fontSize: 'var(--re-text-lg)',
                color: 'var(--re-text-primary)',
              }}
            >
              Confirm your selections
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: 'var(--re-text-secondary)' }}
            >
              Ready to proceed to generation with these choices:
            </p>

            <div className="space-y-3 mb-6">
              <div
                className="rounded-lg p-3"
                style={{ background: 'var(--re-bg-hover)' }}
              >
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: 'var(--re-text-muted)' }}
                >
                  Title
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: 'var(--re-text-primary)' }}
                >
                  {selectedTitleText ?? '—'}
                </div>
              </div>
              <div
                className="rounded-lg p-3"
                style={{ background: 'var(--re-bg-hover)' }}
              >
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: 'var(--re-text-muted)' }}
                >
                  Thumbnail
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--re-text-primary)' }}
                >
                  {selectedThumbnailIndex != null
                    ? `Variation ${selectedThumbnailIndex + 1}`
                    : '—'}
                </div>
              </div>
              <div
                className="rounded-lg p-3"
                style={{ background: 'var(--re-bg-hover)' }}
              >
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: 'var(--re-text-muted)' }}
                >
                  Script
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--re-text-primary)' }}
                >
                  {sceneCount} scenes
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Back — keep editing
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={confirm}
                disabled={approving}
                className="flex-1"
              >
                {approving ? 'Confirming...' : 'Confirm & Continue'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
