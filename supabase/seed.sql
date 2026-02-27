-- ============================================
-- RemixEngine Seed Data
-- ============================================
-- Run after: npx supabase db push
-- The handle_new_user trigger creates re_users profiles automatically on signup.
-- To make the first user admin, run:
--   UPDATE public.re_users SET role = 'admin' WHERE email = 'your-email@domain.com';
--
-- For local development only (supabase start):
-- Auth users must be created via Supabase dashboard or CLI first.
-- The seed below inserts default system settings.

-- Default system settings
INSERT INTO public.re_system_settings (key, value, description) VALUES
  ('default_voice_id', '"21m00Tcm4TlvDq8ikWAM"', 'Default ElevenLabs voice ID (Rachel)'),
  ('default_avatar_id', 'null', 'Default HeyGen avatar ID'),
  ('default_aspect_ratio', '"16:9"', 'Default video aspect ratio'),
  ('max_batch_size', '10', 'Maximum videos per batch'),
  ('max_video_duration_minutes', '20', 'Maximum video duration in minutes'),
  ('broll_provider', '"runway"', 'Primary B-roll provider: runway or kling'),
  ('cost_warning_threshold', '10.00', 'Warn user when estimated cost exceeds this amount (USD)')
ON CONFLICT (key) DO NOTHING;
