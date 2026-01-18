-- Create table for user messaging usage and limits
CREATE TABLE public.user_messaging_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Monthly limits (0 = unlimited for basic plan with own credentials)
  whatsapp_limit INTEGER NOT NULL DEFAULT 0,
  sms_limit INTEGER NOT NULL DEFAULT 0,
  email_limit INTEGER NOT NULL DEFAULT 0,
  -- Current month usage
  whatsapp_used INTEGER NOT NULL DEFAULT 0,
  sms_used INTEGER NOT NULL DEFAULT 0,
  email_used INTEGER NOT NULL DEFAULT 0,
  -- Billing cycle
  billing_cycle_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()),
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_messaging_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage"
ON public.user_messaging_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage record
CREATE POLICY "Users can insert their own usage"
ON public.user_messaging_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can update usage (for edge functions)
CREATE POLICY "Service role can update usage"
ON public.user_messaging_usage
FOR UPDATE
USING (true);

-- Admins can view all usage
CREATE POLICY "Admins can view all usage"
ON public.user_messaging_usage
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all usage (to set limits)
CREATE POLICY "Admins can update all usage"
ON public.user_messaging_usage
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_user_messaging_usage_updated_at
BEFORE UPDATE ON public.user_messaging_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add plan type to profiles (basic or premium)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'basic';

-- Function to reset monthly usage (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_messaging_usage
  SET 
    whatsapp_used = 0,
    sms_used = 0,
    email_used = 0,
    billing_cycle_start = date_trunc('month', now()),
    updated_at = now()
  WHERE billing_cycle_start < date_trunc('month', now());
END;
$$;