-- ============================================
-- Migration 004: Realtime Setup
-- Enable Realtime for tables that need live progress updates
-- ============================================

-- Enable Realtime for job progress tracking (primary use: pipeline dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.re_jobs;

-- Enable Realtime for video status updates (scraping/remix/generation progress)
ALTER PUBLICATION supabase_realtime ADD TABLE public.re_videos;

-- Enable Realtime for project status
ALTER PUBLICATION supabase_realtime ADD TABLE public.re_projects;

-- Enable Realtime for batch job progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.re_batch_jobs;

-- Enable Realtime for scene-level generation progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.re_scenes;
