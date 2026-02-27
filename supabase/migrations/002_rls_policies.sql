-- ============================================
-- Migration 002: Row Level Security Policies
-- RemixEngine — all policies on re_ prefixed tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.re_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_remixed_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_remixed_thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_remixed_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_rendered_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================

CREATE OR REPLACE FUNCTION is_active_user() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.re_users WHERE id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_editor_or_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.re_users
    WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.re_users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- USERS: Read own profile or admin reads all
-- ============================================
CREATE POLICY "users_select" ON public.re_users FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.re_users WHERE id = auth.uid() AND role = 'admin')
);

-- Admin can insert (e.g., inviting users)
CREATE POLICY "users_insert" ON public.re_users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.re_users WHERE id = auth.uid() AND role = 'admin')
);

-- Users can update own profile; admin can update all
CREATE POLICY "users_update" ON public.re_users FOR UPDATE USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.re_users WHERE id = auth.uid() AND role = 'admin')
);

-- Only admin can delete users
CREATE POLICY "users_delete" ON public.re_users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.re_users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- CONTENT TABLES: Authenticated read, editor+ write
-- Apply standard policies to content tables via dynamic SQL
-- ============================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    're_projects', 're_batch_jobs', 're_videos', 're_remixed_titles', 're_remixed_thumbnails',
    're_remixed_scripts', 're_scenes', 're_rendered_videos'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (is_active_user())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (is_editor_or_admin())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (is_editor_or_admin())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (is_admin())',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================
-- JOBS: Authenticated read (Realtime dashboard), editor+ write
-- ============================================
CREATE POLICY "jobs_select" ON public.re_jobs FOR SELECT USING (is_active_user());
CREATE POLICY "jobs_insert" ON public.re_jobs FOR INSERT WITH CHECK (is_editor_or_admin());
CREATE POLICY "jobs_update" ON public.re_jobs FOR UPDATE USING (is_editor_or_admin());
CREATE POLICY "jobs_delete" ON public.re_jobs FOR DELETE USING (is_admin());

-- ============================================
-- API USAGE: Admin only read, editor+ insert
-- ============================================
CREATE POLICY "api_usage_select" ON public.re_api_usage FOR SELECT USING (is_admin());
CREATE POLICY "api_usage_insert" ON public.re_api_usage FOR INSERT WITH CHECK (is_editor_or_admin());

-- ============================================
-- SYSTEM SETTINGS: Admin only
-- ============================================
CREATE POLICY "settings_select" ON public.re_system_settings FOR SELECT USING (is_admin());
CREATE POLICY "settings_all" ON public.re_system_settings FOR ALL USING (is_admin());
