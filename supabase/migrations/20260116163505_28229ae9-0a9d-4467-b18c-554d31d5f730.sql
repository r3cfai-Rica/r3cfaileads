-- Fix leads table RLS policies: Change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Users can view their own leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (owns_resource(user_id));

CREATE POLICY "Users can create their own leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (owns_resource(user_id));

CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (owns_resource(user_id))
WITH CHECK (owns_resource(user_id));

CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (owns_resource(user_id));

CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix message_logs table RLS policies
DROP POLICY IF EXISTS "Users can view their own message logs" ON public.message_logs;
DROP POLICY IF EXISTS "Users can create their own message logs" ON public.message_logs;
DROP POLICY IF EXISTS "Users can update their own message logs" ON public.message_logs;
DROP POLICY IF EXISTS "Users can delete their own message logs" ON public.message_logs;

-- Recreate as PERMISSIVE policies with TO authenticated
CREATE POLICY "Users can view their own message logs" 
ON public.message_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own message logs" 
ON public.message_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message logs" 
ON public.message_logs 
FOR UPDATE 
TO authenticated
USING (owns_resource(user_id))
WITH CHECK (owns_resource(user_id));

CREATE POLICY "Users can delete their own message logs" 
ON public.message_logs 
FOR DELETE 
TO authenticated
USING (owns_resource(user_id));