-- Add metadata column to user_messaging_credentials for storing Evolution API credentials
ALTER TABLE public.user_messaging_credentials 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;