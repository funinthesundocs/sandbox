-- ============================================
-- Migration 007: Set initial users to admin role
-- Internal invite-only tool — all existing users are admins.
-- New users come in via invite so this is safe.
-- ============================================
UPDATE public.re_users
SET role = 'admin'
WHERE is_active = true;
