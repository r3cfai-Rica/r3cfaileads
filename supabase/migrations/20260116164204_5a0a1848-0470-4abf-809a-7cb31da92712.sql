-- Ensure RLS is fully enabled on message_logs
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs FORCE ROW LEVEL SECURITY;

-- Revoke all access from anon role
REVOKE ALL ON public.message_logs FROM anon;
REVOKE ALL ON public.message_logs FROM public;

-- Grant only to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_logs TO authenticated;

-- Ensure leads table is also fully protected
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.leads FROM public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Drop and recreate RLS policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own message logs" ON public.message_logs;
DROP POLICY IF EXISTS "Users can create their own message logs" ON public.message_logs;
DROP POLICY IF EXISTS "Users can update their own message logs" ON public.message_logs;
DROP POLICY IF EXISTS "Users can delete their own message logs" ON public.message_logs;

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
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message logs" 
ON public.message_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);