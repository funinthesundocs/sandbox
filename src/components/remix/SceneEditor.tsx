'use client';

import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface Scene {
  id: string;
  scene_number: number;
  dialogue_line: string;
  duration_seconds: number;
  broll_description: string;
}

interface SceneEditorProps {
  scenes: Scene[];
  videoId: string;
  projectId: string;
  onRegenerate: () => void;
}

export function SceneEditor({
  scenes,
  videoId,
  projectId,
  onRegenerate,
}: SceneEditorProps) {
  const [editValues, setEditValues] = useState<Record<string, string>>(
    Object.fromEntries(scenes.map((s) => [s.id, s.dialogue_line]))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  async function saveScene(sceneId: string) {
    const text = editValues[sceneId];
    if (!text?.trim()) return;
    await fetch('/api/remix-engine/remix/select', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneId, dialogueLine: text }),
    });
    setEditingId(null);
  }

  async function regenScript() {
    setRegenLoading(true);
    try {
      await fetch('/api/remix-engine/remix/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, projectId }),
      });
      onRegenerate();
    } finally {
      setRegenLoading(false);
    }
  }

  if (scenes.length === 0) {
    return (
      <div>
        <h2
          className="font-semibold mb-3"
          style={{
            fontSize: 'var(--re-text-lg)',
            color: 'var(--re-text-primary)',
          }}
        >
          Script Scenes
        </h2>
        <p className="text-sm" style={{ color: 'var(--re-text-muted)' }}>
          Script is generating...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2
          className="font-semibold"
          style={{
            fontSize: 'var(--re-text-lg)',
            color: 'var(--re-text-primary)',
          }}
        >
          Script Scenes
        </h2>
        <button
          onClick={regenScript}
          disabled={regenLoading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
          style={{
            background: 'var(--re-bg-secondary)',
            border: '1px solid var(--re-border)',
            color: 'var(--re-text-secondary)',
          }}
        >
          <RefreshCw className={`w-3 h-3 ${regenLoading ? 'animate-spin' : ''}`} />
          Regenerate full script
        </button>
      </div>

      <div className="space-y-3">
        {scenes.map((scene) => {
          const isEditing = editingId === scene.id;
          return (
            <div
              key={scene.id}
              className="rounded-lg p-4"
              style={{
                background: 'var(--re-bg-secondary)',
                border: '1px solid var(--re-border)',
              }}
            >
              {/* Scene header: number + duration + per-scene regen */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono font-medium px-2 py-0.5 rounded"
                    style={{
                      background: 'var(--re-bg-hover)',
                      color: 'var(--re-text-secondary)',
                    }}
                  >
                    Scene {scene.scene_number}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: 'var(--re-bg-hover)',
                      color: 'var(--re-text-muted)',
                    }}
                    title="Estimated duration. Adjust manually if needed."
                  >
                    ~{scene.duration_seconds}s
                  </span>
                </div>
                <button
                  onClick={regenScript}
                  disabled={regenLoading}
                  className="p-1 rounded transition-colors"
                  style={{
                    color: 'var(--re-text-muted)',
                    background: 'transparent',
                  }}
                  title="Regenerate full script"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${regenLoading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              {/* Dialogue — click to edit, blur to save */}
              {isEditing ? (
                <textarea
                  ref={(el) => {
                    textareaRefs.current[scene.id] = el;
                  }}
                  value={editValues[scene.id]}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      [scene.id]: e.target.value,
                    }))
                  }
                  onBlur={() => saveScene(scene.id)}
                  rows={3}
                  className="w-full resize-none rounded p-2 text-sm leading-relaxed focus:outline-none"
                  style={{
                    background: 'var(--re-bg-input)',
                    color: 'var(--re-text-primary)',
                    border: '1px solid var(--re-accent-primary)',
                  }}
                  autoFocus
                />
              ) : (
                <p
                  className="text-sm leading-relaxed cursor-text"
                  style={{ color: 'var(--re-text-primary)' }}
                  onClick={() => setEditingId(scene.id)}
                  title="Click to edit"
                >
                  {editValues[scene.id] || scene.dialogue_line}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
