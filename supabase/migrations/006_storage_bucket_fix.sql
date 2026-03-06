-- ============================================
-- Migration 006: Fix storage bucket MIME types
-- Add application/json and text/vtt to allowed types.
-- Also ensure bucket exists (upsert-safe).
-- ============================================

-- Update allowed MIME types to include application/json (transcript upload)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'video/mp4',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'text/plain',
  'text/vtt',
  'application/json'
]
WHERE id = 'remix-engine';

-- Insert bucket if it somehow doesn't exist yet
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'remix-engine',
  'remix-engine',
  false,
  524288000,
  ARRAY[
    'video/mp4',
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'text/plain',
    'text/vtt',
    'application/json'
  ]
)
ON CONFLICT (id) DO NOTHING;
