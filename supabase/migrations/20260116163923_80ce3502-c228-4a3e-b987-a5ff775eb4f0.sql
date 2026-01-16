-- Remove public/anonymous access to leads table completely
-- Revoke all permissions from anon role
REVOKE ALL ON public.leads FROM anon;

-- Ensure RLS is enabled (should already be, but confirming)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (extra security)
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Grant access only to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Also secure other sensitive tables the same way
REVOKE ALL ON public.message_logs FROM anon;
ALTER TABLE public.message_logs FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_logs TO authenticated;

REVOKE ALL ON public.profiles FROM anon;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

REVOKE ALL ON public.folders FROM anon;
ALTER TABLE public.folders FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;

REVOKE ALL ON public.ctas FROM anon;
ALTER TABLE public.ctas FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ctas TO authenticated;

REVOKE ALL ON public.search_history FROM anon;
ALTER TABLE public.search_history FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.search_history TO authenticated;