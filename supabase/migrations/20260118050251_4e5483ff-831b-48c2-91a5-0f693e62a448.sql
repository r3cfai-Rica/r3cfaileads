-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for user messaging credentials
CREATE TABLE public.user_messaging_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- WhatsApp Business API
  whatsapp_access_token TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_configured BOOLEAN NOT NULL DEFAULT false,
  -- For future: SMS (Twilio)
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  sms_configured BOOLEAN NOT NULL DEFAULT false,
  -- For future: Email (Resend)
  resend_api_key TEXT,
  email_from_address TEXT,
  email_from_name TEXT,
  email_configured BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_messaging_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only view their own credentials
CREATE POLICY "Users can view their own credentials"
ON public.user_messaging_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can insert their own credentials"
ON public.user_messaging_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own credentials
CREATE POLICY "Users can update their own credentials"
ON public.user_messaging_credentials
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete their own credentials"
ON public.user_messaging_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_messaging_credentials_updated_at
BEFORE UPDATE ON public.user_messaging_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();