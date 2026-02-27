'use client';

// src/components/scraper/TranscriptViewer.tsx
// Scrollable transcript panel with fixed-width timestamp gutter, inline editing,
// and 1-second debounce auto-save.

import { useRef, useState } from 'react';

interface TranscriptSegment {
  timestamp: string;
  startMs: number;
  text: string;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  videoId: string;
  onSeek?: (seconds: number) => void; // Called when timestamp clicked
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function TranscriptViewer({ segments, videoId, onSeek }: TranscriptViewerProps) {
  const [localSegments, setLocalSegments] = useState<TranscriptSegment[]>(segments);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const saveTranscript = async (segs: TranscriptSegment[]) => {
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/remix-engine/videos/${videoId}/transcript`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments: segs }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleTextChange = (index: number, newText: string) => {
    const updated = [...localSegments];
    updated[index] = { ...updated[index], text: newText };
    setLocalSegments(updated);

    // Debounced auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveTranscript(updated), 1000);
  };

  return (
    <div className="h-96 overflow-y-auto rounded-[--re-border-radius] bg-[--re-bg-secondary] border border-[--re-border]">
      {/* Save status indicator — sticky header */}
      <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-[--re-bg-secondary] border-b border-[--re-border-subtle] text-xs text-[--re-text-muted] z-10">
        <span>Transcript</span>
        {saveStatus === 'saving' && (
          <span className="text-[--re-text-muted]">Saving...</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-[--re-success]">Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-[--re-destructive]">Save failed</span>
        )}
      </div>

      {/* Empty state */}
      {localSegments.length === 0 && (
        <div className="p-6 text-center text-[--re-text-muted] text-sm">
          No transcript available for this video.
        </div>
      )}

      {/* Segments */}
      {localSegments.map((seg, i) => (
        <div
          key={i}
          className="flex gap-0 hover:bg-[--re-bg-hover] transition-colors"
        >
          {/* GUTTER: fixed 64px — clickable timestamp, never interferes with text selection */}
          <button
            onClick={() => onSeek?.(seg.startMs / 1000)}
            className="flex-shrink-0 w-16 px-3 py-2 text-xs text-[--re-accent-primary] hover:text-[--re-accent-secondary] font-mono text-right self-start pt-2.5 cursor-pointer"
            title={`Jump to ${seg.timestamp}`}
            aria-label={`Seek to ${seg.timestamp}`}
            type="button"
          >
            {seg.timestamp}
          </button>

          {/* TEXT: full width column, clean selection */}
          <div className="flex-1 py-2 pr-4">
            {editingIndex === i ? (
              <textarea
                autoFocus
                value={localSegments[i].text}
                onChange={e => handleTextChange(i, e.target.value)}
                onBlur={() => setEditingIndex(null)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setEditingIndex(null);
                  }
                }}
                className="w-full bg-[--re-bg-input] text-[--re-text-primary] text-sm rounded px-2 py-1 resize-none outline-none focus:ring-1 focus:ring-[--re-accent-primary]"
                rows={Math.max(1, Math.ceil(localSegments[i].text.length / 80))}
              />
            ) : (
              <p
                onClick={() => setEditingIndex(i)}
                className="text-[--re-text-secondary] text-sm leading-relaxed cursor-text select-text"
                title="Click to edit"
              >
                {seg.text}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
