-- ============================================
-- Migration 003: Storage Setup
-- Bucket name: remix-engine (matches CLAUDE.md storage path prefix)
-- Public: false — all access via signed URLs generated server-side
-- ============================================

-- Create private storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'remix-engine',
  'remix-engine',
  false,
  524288000,  -- 500MB limit
  ARRAY[
    'video/mp4',
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'text/plain',
    'text/vtt'
  ]
);

-- ============================================
-- STORAGE POLICIES
-- All authenticated users can read via signed URLs
-- Editor+ can upload
-- Admin only can delete
-- ============================================

-- Authenticated users can read objects (server generates signed URLs)
CREATE POLICY "storage_read" ON storage.objects FOR SELECT USING (
  bucket_id = 'remix-engine' AND auth.role() = 'authenticated'
);

-- Editors and admins can insert (upload) objects
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'remix-engine' AND
  EXISTS (
    SELECT 1 FROM public.re_users
    WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
  )
);

-- Editors and admins can update (overwrite) objects
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'remix-engine' AND
  EXISTS (
    SELECT 1 FROM public.re_users
    WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
  )
);

-- Only admins can delete objects
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'remix-engine' AND
  EXISTS (
    SELECT 1 FROM public.re_users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);
