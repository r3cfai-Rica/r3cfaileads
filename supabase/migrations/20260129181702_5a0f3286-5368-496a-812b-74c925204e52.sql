-- Add telegram field to leads table for storing Telegram chat ID
ALTER TABLE public.leads ADD COLUMN telegram TEXT;

-- Add comment to document the field
COMMENT ON COLUMN public.leads.telegram IS 'Telegram chat ID for the lead, obtained when they interact with the bot';