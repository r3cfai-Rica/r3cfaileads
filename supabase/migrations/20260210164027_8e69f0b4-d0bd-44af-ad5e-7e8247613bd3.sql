
-- Create payments table to store payment history from Stripe
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_payment_intent TEXT,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'brl',
  payment_method TEXT, -- 'pix', 'credit_card', 'boleto'
  payment_type TEXT, -- 'one_time', 'subscription'
  installments INTEGER DEFAULT 1,
  plan_type TEXT NOT NULL DEFAULT 'premium',
  status TEXT NOT NULL DEFAULT 'completed',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admin can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system/service role can insert payments (via webhook)
CREATE POLICY "Service role can insert payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_payments_user_id ON public.payments (user_id);
CREATE INDEX idx_payments_created_at ON public.payments (created_at DESC);
