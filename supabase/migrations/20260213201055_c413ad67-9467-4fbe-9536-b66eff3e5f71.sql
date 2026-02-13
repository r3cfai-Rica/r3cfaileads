
-- Add explicit deny-all RLS policies to app_secrets table
-- This ensures no user (anon or authenticated) can directly read/write secrets
-- Only SECURITY DEFINER functions (encrypt_credential, decrypt_credential) can access this table

CREATE POLICY "Deny all select on app_secrets"
ON public.app_secrets
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Deny all insert on app_secrets"
ON public.app_secrets
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny all update on app_secrets"
ON public.app_secrets
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Deny all delete on app_secrets"
ON public.app_secrets
FOR DELETE
TO anon, authenticated
USING (false);
