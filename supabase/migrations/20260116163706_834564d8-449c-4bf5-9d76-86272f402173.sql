-- Fix leads table: Replace owns_resource() with direct auth.uid() comparison
-- This is more transparent and easier to audit

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;

-- Recreate with direct auth.uid() comparison (more secure and auditable)
CREATE POLICY "Users can view their own leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also fix message_logs table for consistency
DROP POLICY IF EXISTS "Users can update their own message logs" ON public.message_logs;
DROP POLICY IF EXISTS "Users can delete their own message logs" ON public.message_logs;

CREATE POLICY "Users can update their own message logs" 
ON public.message_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message logs" 
ON public.message_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);