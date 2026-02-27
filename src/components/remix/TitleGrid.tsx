'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface Title {
  id: string;
  style: string;
  title: string;
  reasoning: string | null;
  is_selected: boolean;
}

interface TitleGridProps {
  titles: Title[];
  videoId: string;
  projectId: string;
  onSelectionChange: (selectedId: string) => void;
  onRegenerate: () => void;
}

export function TitleGrid({
  titles,
  videoId,
  projectId,
  onSelectionChange,
  onRegenerate,
}: TitleGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    titles.find((t) => t.is_selected)?.id ?? null
  );
  const [editValues, setEditValues] = useState<Record<string, string>>(
    Object.fromEntries(titles.map((t) => [t.id, t.title]))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState<string | null>(null);

  async function selectTitle(id: string) {
    if (loading) return;
    setLoading(id);
    setSelectedId(id);

    try {
      await fetch('/api/remix-engine/remix/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, type: 'title', id }),
      });
      onSelectionChange(id);
    } finally {
      setLoading(null);
    }
  }

  async function saveEditedTitle(id: string) {
    const text = editValues[id];
    if (!text?.trim()) return;
    await fetch('/api/remix-engine/remix/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, type: 'title', id, editedText: text }),
    });
  }

  async function regenTitle(id: string) {
    setRegenLoading(id);
    try {
      await fetch('/api/remix-engine/remix/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, projectId }),
      });
      onRegenerate();
    } finally {
      setRegenLoading(null);
    }
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
        Title Variations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {titles.map((title) => {
          const isSelected = selectedId === title.id;
          return (
            <div
              key={title.id}
              onClick={() => !isSelected && selectTitle(title.id)}
              className="relative rounded-lg p-4 cursor-pointer transition-all"
              style={{
                background: isSelected
                  ? 'var(--re-bg-active)'
                  : 'var(--re-bg-secondary)',
                border: `1.5px solid ${isSelected ? 'var(--re-accent-primary)' : 'var(--re-border)'}`,
                opacity: loading === title.id ? 0.7 : 1,
              }}
            >
              {/* Style label + regen */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{
                    background: 'var(--re-bg-hover)',
                    color: 'var(--re-text-muted)',
                  }}
                >
                  {title.style}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    regenTitle(title.id);
                  }}
                  disabled={regenLoading === title.id}
                  className="p-1 rounded transition-colors"
                  style={{
                    color: 'var(--re-text-muted)',
                    background: 'transparent',
                  }}
                  title="Regenerate all titles"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${regenLoading === title.id ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              {/* Title text — editable only if this card is selected */}
              {isSelected ? (
                <div>
                  <textarea
                    value={editValues[title.id]}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        [title.id]: e.target.value,
                      }))
                    }
                    onBlur={() => saveEditedTitle(title.id)}
                    onClick={(e) => e.stopPropagation()}
                    rows={2}
                    maxLength={100}
                    className="w-full resize-none rounded p-1 text-sm font-medium focus:outline-none"
                    style={{
                      background: 'var(--re-bg-input)',
                      color: 'var(--re-text-primary)',
                      border: '1px solid var(--re-accent-primary)',
                    }}
                  />
                  <div
                    className="text-right text-xs mt-0.5"
                    style={{ color: 'var(--re-text-muted)' }}
                  >
                    {editValues[title.id]?.length ?? 0}/100
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm font-medium leading-snug"
                  style={{ color: 'var(--re-text-primary)' }}
                >
                  {title.title}
                </p>
              )}

              {/* Selected checkmark indicator */}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--re-accent-primary)' }}
                >
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    stroke="white"
                    viewBox="0 0 12 12"
                  >
                    <path
                      d="M10 3L5 8.5 2 5.5"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
