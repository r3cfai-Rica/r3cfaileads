-- Strengthen leads table security by explicitly requiring authenticated role
-- and ensuring policies are properly PERMISSIVE

-- Drop and recreate all leads policies with explicit authenticated role check
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- SELECT: Only authenticated users can view their own leads
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Only authenticated users can create leads for themselves
CREATE POLICY "Users can create their own leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only authenticated users can update their own leads
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only authenticated users can delete their own leads
CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);