'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RefreshCw, Check } from 'lucide-react';

interface Thumbnail {
  id: string;
  prompt: string;
  file_path: string;
  is_selected: boolean;
  signedUrl: string | null;
}

interface ThumbnailCardsProps {
  thumbnails: Thumbnail[];
  videoId: string;
  projectId: string;
  onSelectionChange: (selectedId: string) => void;
}

export function ThumbnailCards({
  thumbnails,
  videoId,
  projectId,
  onSelectionChange,
}: ThumbnailCardsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    thumbnails.find((t) => t.is_selected)?.id ?? null
  );
  const [regenLoading, setRegenLoading] = useState<string | null>(null);
  const [stylePrompts, setStylePrompts] = useState<Record<string, string>>({});
  const [showPromptFor, setShowPromptFor] = useState<string | null>(null);

  async function selectThumbnail(id: string) {
    setSelectedId(id);
    await fetch('/api/remix-engine/remix/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, type: 'thumbnail', id }),
    });
    onSelectionChange(id);
  }

  async function regenThumbnail(id: string) {
    const thumb = thumbnails.find((t) => t.id === id);
    if (!thumb) return;
    setRegenLoading(id);
    setShowPromptFor(null);
    try {
      // Extract style from file_path (e.g. "thumbnails/bold_text_overlay.jpg" -> "bold-text-overlay")
      const styleMatch = thumb.file_path.match(/thumbnails\/([\w]+)\.jpg/);
      const styleSlug = styleMatch?.[1]?.replace(/_/g, '-') ?? undefined;

      await fetch('/api/remix-engine/remix/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          projectId,
          style: styleSlug,
          stylePromptOverride: stylePrompts[id] || undefined,
        }),
      });
    } finally {
      setRegenLoading(null);
    }
  }

  if (thumbnails.length === 0) {
    return (
      <div>
        <h2
          className="font-semibold mb-3"
          style={{
            fontSize: 'var(--re-text-lg)',
            color: 'var(--re-text-primary)',
          }}
        >
          Thumbnail Variations
        </h2>
        <p className="text-sm" style={{ color: 'var(--re-text-muted)' }}>
          Thumbnails are generating...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2
        className="font-semibold mb-3"
        style={{
          fontSize: 'var(--re-text-lg)',
          color: 'var(--re-text-primary)',
        }}
      >
        Thumbnail Variations
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {thumbnails.map((thumb, idx) => {
          const isSelected = selectedId === thumb.id;
          return (
            <div
              key={thumb.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden"
              style={{
                border: `2px solid ${isSelected ? 'var(--re-accent-primary)' : 'var(--re-border)'}`,
              }}
              onClick={() => selectThumbnail(thumb.id)}
            >
              {/* Thumbnail image */}
              <div
                className="relative aspect-video"
                style={{ background: 'var(--re-bg-hover)' }}
              >
                {thumb.signedUrl ? (
                  <Image
                    src={thumb.signedUrl}
                    alt={`Thumbnail variation ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-xs"
                      style={{ color: 'var(--re-text-muted)' }}
                    >
                      Loading...
                    </span>
                  </div>
                )}

                {/* Selected overlay */}
                {isSelected && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--re-accent-primary)' }}
                    >
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Label + regen controls */}
              <div
                className="px-3 py-2"
                style={{ background: 'var(--re-bg-secondary)' }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: 'var(--re-text-muted)' }}
                  >
                    Variation {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPromptFor(
                          showPromptFor === thumb.id ? null : thumb.id
                        );
                      }}
                      className="px-1.5 py-0.5 rounded text-xs transition-colors"
                      style={{
                        color: 'var(--re-text-muted)',
                        background: 'transparent',
                      }}
                      title="Style options"
                    >
                      Style
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        regenThumbnail(thumb.id);
                      }}
                      disabled={regenLoading === thumb.id}
                      className="p-1 rounded transition-colors"
                      style={{
                        color: 'var(--re-text-muted)',
                        background: 'transparent',
                      }}
                      title="Regenerate this thumbnail"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${regenLoading === thumb.id ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Optional style prompt input */}
                {showPromptFor === thumb.id && (
                  <div
                    className="mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      placeholder="e.g. darker, more dramatic..."
                      value={stylePrompts[thumb.id] ?? ''}
                      onChange={(e) =>
                        setStylePrompts((prev) => ({
                          ...prev,
                          [thumb.id]: e.target.value,
                        }))
                      }
                      className="w-full text-xs rounded px-2 py-1"
                      style={{
                        background: 'var(--re-bg-input)',
                        color: 'var(--re-text-primary)',
                        border: '1px solid var(--re-border)',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') regenThumbnail(thumb.id);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
