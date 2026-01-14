-- Fix admin_notifications INSERT policy to only allow system-level operations
-- The triggers (notify_admin_new_user, notify_admin_plan_change) run as SECURITY DEFINER
-- which means they execute with elevated privileges, bypassing RLS
-- So we can safely restrict client-side INSERT completely

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;

-- Create a restrictive INSERT policy that denies all client-side inserts
-- Notifications should ONLY be created by database triggers (which bypass RLS as SECURITY DEFINER)
CREATE POLICY "Only system triggers can insert notifications"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Note: The existing triggers notify_admin_new_user and notify_admin_plan_change
-- are SECURITY DEFINER functions, which means they bypass RLS policies
-- This ensures only system-level operations can create notifications