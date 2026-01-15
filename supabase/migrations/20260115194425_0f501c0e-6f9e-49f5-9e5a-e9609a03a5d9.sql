-- Create a security definer function to check if a user owns a lead
-- This adds an extra layer of security and prevents any potential bypass
CREATE OR REPLACE FUNCTION public.is_lead_owner(_user_id uuid, _lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leads
    WHERE id = _lead_id
      AND user_id = _user_id
  )
$$;

-- Create a function to verify the authenticated user owns the resource
CREATE OR REPLACE FUNCTION public.owns_resource(_resource_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = _resource_user_id
$$;

-- Drop existing policies on leads table
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Recreate policies using the security definer function
-- This ensures the check happens in a secure context
CREATE POLICY "Users can view their own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.owns_resource(user_id));

CREATE POLICY "Users can create their own leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (public.owns_resource(user_id));

CREATE POLICY "Users can update their own leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.owns_resource(user_id))
WITH CHECK (public.owns_resource(user_id));

CREATE POLICY "Users can delete their own leads"
ON public.leads
FOR DELETE
TO authenticated
USING (public.owns_resource(user_id));

-- Also add admin access to leads for support purposes
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));