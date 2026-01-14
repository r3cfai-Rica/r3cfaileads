-- Fix security: Add PERMISSIVE policies and restrict admin access

-- PROFILES TABLE: Admin can only see basic user management data, not CRM details
-- First, drop the existing admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Add PERMISSIVE policy for users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Add PERMISSIVE policy for admins to view all profiles (for user management only)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- LEADS TABLE: Remove any admin access - leads are private to each user
-- Ensure only users can see their own leads (no admin access)
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

-- CRM-related tables should also be private to users only
-- Folders
DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
CREATE POLICY "Users can view their own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

-- CTAs
DROP POLICY IF EXISTS "Users can view their own ctas" ON public.ctas;
CREATE POLICY "Users can view their own ctas"
  ON public.ctas FOR SELECT
  USING (auth.uid() = user_id);

-- Search history
DROP POLICY IF EXISTS "Users can view their own search history" ON public.search_history;
CREATE POLICY "Users can view their own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

-- Message logs
DROP POLICY IF EXISTS "Users can view their own message logs" ON public.message_logs;
CREATE POLICY "Users can view their own message logs"
  ON public.message_logs FOR SELECT
  USING (auth.uid() = user_id);