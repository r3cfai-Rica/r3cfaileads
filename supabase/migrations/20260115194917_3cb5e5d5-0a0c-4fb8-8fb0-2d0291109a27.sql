-- Add UPDATE and DELETE policies for message_logs table
-- Allow users to manage their own message history

CREATE POLICY "Users can update their own message logs"
ON public.message_logs
FOR UPDATE
TO authenticated
USING (public.owns_resource(user_id))
WITH CHECK (public.owns_resource(user_id));

CREATE POLICY "Users can delete their own message logs"
ON public.message_logs
FOR DELETE
TO authenticated
USING (public.owns_resource(user_id));