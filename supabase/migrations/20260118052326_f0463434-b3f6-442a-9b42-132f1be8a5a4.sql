-- Fix the overly permissive RLS policy
DROP POLICY IF EXISTS "Service role can update usage" ON public.user_messaging_usage;

-- Create a more secure function to increment usage (security definer)
CREATE OR REPLACE FUNCTION public.increment_messaging_usage(
  _user_id UUID,
  _channel TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update usage record
  INSERT INTO public.user_messaging_usage (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Increment the appropriate counter
  IF _channel = 'whatsapp' THEN
    UPDATE public.user_messaging_usage
    SET whatsapp_used = whatsapp_used + 1, updated_at = now()
    WHERE user_id = _user_id;
  ELSIF _channel = 'sms' THEN
    UPDATE public.user_messaging_usage
    SET sms_used = sms_used + 1, updated_at = now()
    WHERE user_id = _user_id;
  ELSIF _channel = 'email' THEN
    UPDATE public.user_messaging_usage
    SET email_used = email_used + 1, updated_at = now()
    WHERE user_id = _user_id;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to check if user has remaining credits
CREATE OR REPLACE FUNCTION public.check_messaging_limit(
  _user_id UUID,
  _channel TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limit INTEGER;
  _used INTEGER;
  _plan_type TEXT;
BEGIN
  -- Get user's plan type
  SELECT plan_type INTO _plan_type FROM public.profiles WHERE user_id = _user_id;
  
  -- Basic plan with own credentials = unlimited
  IF _plan_type = 'basic' THEN
    RETURN true;
  END IF;
  
  -- Get usage record
  SELECT 
    CASE _channel
      WHEN 'whatsapp' THEN whatsapp_limit
      WHEN 'sms' THEN sms_limit
      WHEN 'email' THEN email_limit
      ELSE 0
    END,
    CASE _channel
      WHEN 'whatsapp' THEN whatsapp_used
      WHEN 'sms' THEN sms_used
      WHEN 'email' THEN email_used
      ELSE 0
    END
  INTO _limit, _used
  FROM public.user_messaging_usage
  WHERE user_id = _user_id;
  
  -- No record = no usage yet, allow if limit > 0
  IF _limit IS NULL THEN
    RETURN true;
  END IF;
  
  -- 0 limit = unlimited
  IF _limit = 0 THEN
    RETURN true;
  END IF;
  
  RETURN _used < _limit;
END;
$$;