-- Add UPDATE policy for search_history table
CREATE POLICY "Users can update their own search history"
ON public.search_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);