-- ============================================
-- Migration 001: Initial Schema
-- RemixEngine — all tables use re_ prefix
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.re_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE public.re_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.re_users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'scraping', 'remixing', 'generating', 'assembling', 'complete', 'error'
  )),
  settings JSONB NOT NULL DEFAULT '{
    "aspect_ratio": "16:9",
    "voice_id": null,
    "avatar_id": null,
    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.5},
    "max_video_duration_minutes": 20,
    "target_resolution": "1080p"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- BATCH JOBS
-- ============================================
CREATE TABLE public.re_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.re_projects(id) ON DELETE CASCADE,
  channel_url TEXT,
  channel_id TEXT,
  channel_name TEXT,
  total_videos INTEGER NOT NULL DEFAULT 0,
  completed_videos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'scraping', 'scraped', 'processing', 'complete', 'error'
  )),
  created_by UUID NOT NULL REFERENCES public.re_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- VIDEOS (scraped YouTube videos)
-- ============================================
CREATE TABLE public.re_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.re_projects(id) ON DELETE CASCADE,
  batch_job_id UUID REFERENCES public.re_batch_jobs(id) ON DELETE SET NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  original_title TEXT,
  original_description TEXT,
  original_thumbnail_url TEXT,
  original_transcript TEXT,
  channel_name TEXT,
  channel_id TEXT,
  duration_seconds INTEGER,
  view_count BIGINT,
  published_at TIMESTAMPTZ,
  -- File references (Supabase Storage paths, under remix-engine/ prefix)
  video_file_path TEXT,
  thumbnail_file_path TEXT,
  transcript_file_path TEXT,
  -- Pipeline status per video
  scrape_status TEXT DEFAULT 'pending' CHECK (scrape_status IN ('pending', 'processing', 'complete', 'error')),
  remix_status TEXT DEFAULT 'pending' CHECK (remix_status IN ('pending', 'processing', 'complete', 'error')),
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'complete', 'error')),
  assembly_status TEXT DEFAULT 'pending' CHECK (assembly_status IN ('pending', 'processing', 'complete', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent duplicate YouTube videos in same project
  UNIQUE(project_id, youtube_id)
);

-- ============================================
-- REMIXED TITLES
-- ============================================
CREATE TABLE public.re_remixed_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.re_videos(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  title TEXT NOT NULL,
  reasoning TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- REMIXED THUMBNAILS
-- ============================================
CREATE TABLE public.re_remixed_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.re_videos(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  analysis TEXT,
  file_path TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- REMIXED SCRIPTS
-- ============================================
CREATE TABLE public.re_remixed_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.re_videos(id) ON DELETE CASCADE,
  full_script TEXT NOT NULL,
  tone TEXT,
  target_audience TEXT,
  total_duration_seconds INTEGER,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SCENES (part of a remixed script)
-- ============================================
CREATE TABLE public.re_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.re_remixed_scripts(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  dialogue_line TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  broll_description TEXT NOT NULL,
  on_screen_text TEXT,
  -- Generated asset paths (all under remix-engine/ storage prefix)
  audio_file_path TEXT,
  avatar_video_path TEXT,
  broll_video_path TEXT,
  -- Status tracking per scene
  audio_status TEXT DEFAULT 'pending' CHECK (audio_status IN ('pending', 'processing', 'complete', 'error')),
  avatar_status TEXT DEFAULT 'pending' CHECK (avatar_status IN ('pending', 'processing', 'complete', 'error')),
  broll_status TEXT DEFAULT 'pending' CHECK (broll_status IN ('pending', 'processing', 'complete', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Enforce unique scene numbers per script
  UNIQUE(script_id, scene_number)
);

-- ============================================
-- RENDERED VIDEOS (final output)
-- ============================================
CREATE TABLE public.re_rendered_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.re_videos(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES public.re_remixed_scripts(id),
  file_path TEXT NOT NULL,
  duration_seconds INTEGER,
  resolution TEXT DEFAULT '1080p',
  file_size_bytes BIGINT,
  render_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- JOBS (async job tracking — used for Realtime progress)
-- ============================================
CREATE TABLE public.re_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'scrape', 'scrape_batch',
    'remix_title', 'remix_thumbnail', 'remix_script',
    'generate_audio', 'generate_avatar', 'generate_broll',
    'render'
  )),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'complete', 'error', 'cancelled')),
  video_id UUID REFERENCES public.re_videos(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.re_projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.re_scenes(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_by UUID REFERENCES public.re_users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- API USAGE TRACKING
-- ============================================
CREATE TABLE public.re_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL CHECK (service IN ('gemini', 'fal_ai', 'elevenlabs', 'heygen', 'runway', 'kling', 'youtube')),
  endpoint TEXT NOT NULL,
  tokens_used INTEGER,
  characters_used INTEGER,
  minutes_used DECIMAL(10,2),
  cost_estimate DECIMAL(10,4) NOT NULL DEFAULT 0,
  video_id UUID REFERENCES public.re_videos(id),
  project_id UUID REFERENCES public.re_projects(id),
  user_id UUID REFERENCES public.re_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SYSTEM SETTINGS (admin-configurable)
-- ============================================
CREATE TABLE public.re_system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.re_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_re_videos_project ON public.re_videos(project_id);
CREATE INDEX idx_re_videos_batch ON public.re_videos(batch_job_id);
CREATE INDEX idx_re_videos_youtube ON public.re_videos(youtube_id);
CREATE INDEX idx_re_titles_video ON public.re_remixed_titles(video_id);
CREATE INDEX idx_re_titles_selected ON public.re_remixed_titles(video_id) WHERE is_selected = true;
CREATE INDEX idx_re_thumbnails_video ON public.re_remixed_thumbnails(video_id);
CREATE INDEX idx_re_scripts_video ON public.re_remixed_scripts(video_id);
CREATE INDEX idx_re_scenes_script ON public.re_scenes(script_id);
CREATE INDEX idx_re_scenes_order ON public.re_scenes(script_id, scene_number);
CREATE INDEX idx_re_jobs_video ON public.re_jobs(video_id);
CREATE INDEX idx_re_jobs_project ON public.re_jobs(project_id);
CREATE INDEX idx_re_jobs_status ON public.re_jobs(status) WHERE status IN ('queued', 'processing');
CREATE INDEX idx_re_jobs_type_status ON public.re_jobs(type, status);
CREATE INDEX idx_re_api_usage_service ON public.re_api_usage(service);
CREATE INDEX idx_re_api_usage_project ON public.re_api_usage(project_id);
CREATE INDEX idx_re_api_usage_date ON public.re_api_usage(created_at);

-- ============================================
-- TRIGGERS — updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_re_users_updated BEFORE UPDATE ON public.re_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_re_projects_updated BEFORE UPDATE ON public.re_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_re_videos_updated BEFORE UPDATE ON public.re_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_re_batch_jobs_updated BEFORE UPDATE ON public.re_batch_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_re_system_settings_updated BEFORE UPDATE ON public.re_system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGER — auto-create user profile on auth signup
-- NOTE: Standalone mode only. In module mode, parent manages auth.users.
-- When migrating to module mode: DROP TRIGGER on_auth_user_created ON auth.users;
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.re_users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRIGGER — update batch job progress when video status changes
-- ============================================
CREATE OR REPLACE FUNCTION update_batch_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_job_id IS NOT NULL THEN
    UPDATE public.re_batch_jobs
    SET completed_videos = (
      SELECT COUNT(*) FROM public.re_videos
      WHERE batch_job_id = NEW.batch_job_id AND scrape_status = 'complete'
    )
    WHERE id = NEW.batch_job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_video_batch_progress
  AFTER UPDATE OF scrape_status ON public.re_videos
  FOR EACH ROW EXECUTE FUNCTION update_batch_progress();
