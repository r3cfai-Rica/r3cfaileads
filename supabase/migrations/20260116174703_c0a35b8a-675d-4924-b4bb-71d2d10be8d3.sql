-- =====================================================
-- COMPLETE SECURITY FIX FOR ALL SENSITIVE TABLES
-- =====================================================

-- 1. LEADS TABLE - Complete protection
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Revoke ALL access from anonymous and public roles
REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.leads FROM public;

-- Grant ONLY to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- 2. PROFILES TABLE - Complete protection
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Revoke ALL access from anonymous and public roles
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Grant ONLY to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 3. SEARCH_HISTORY TABLE - Complete protection
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history FORCE ROW LEVEL SECURITY;

-- Revoke ALL access from anonymous and public roles
REVOKE ALL ON public.search_history FROM anon;
REVOKE ALL ON public.search_history FROM public;

-- Grant ONLY to authenticated users
GRANT SELECT, INSERT, DELETE ON public.search_history TO authenticated;

-- 4. USER_ROLES TABLE - Ensure protection
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- Revoke ALL access from anonymous and public roles
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM public;

-- Grant ONLY to authenticated users
GRANT SELECT ON public.user_roles TO authenticated;

-- 5. FOLDERS TABLE - Ensure protection
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.folders FROM anon;
REVOKE ALL ON public.folders FROM public;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;

-- 6. CTAS TABLE - Ensure protection
ALTER TABLE public.ctas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctas FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.ctas FROM anon;
REVOKE ALL ON public.ctas FROM public;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ctas TO authenticated;

-- 7. ADMIN_NOTIFICATIONS TABLE - Ensure protection
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_notifications FROM anon;
REVOKE ALL ON public.admin_notifications FROM public;

GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;