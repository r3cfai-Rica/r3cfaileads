
-- Drop and recreate the view with security_invoker=on
DROP VIEW IF EXISTS public.user_messaging_credentials_safe;

CREATE VIEW public.user_messaging_credentials_safe
WITH (security_invoker=on) AS
SELECT
  id,
  user_id,
  CASE
    WHEN resend_api_key IS NOT NULL AND length(resend_api_key) > 4
    THEN '****' || right(resend_api_key, 4)
    ELSE resend_api_key
  END AS resend_api_key_masked,
  email_from_address,
  email_from_name,
  email_configured,
  CASE
    WHEN whatsapp_access_token IS NOT NULL AND length(whatsapp_access_token) > 4
    THEN '****' || right(whatsapp_access_token, 4)
    ELSE whatsapp_access_token
  END AS whatsapp_access_token_masked,
  whatsapp_phone_number_id,
  whatsapp_configured,
  CASE
    WHEN twilio_account_sid IS NOT NULL AND length(twilio_account_sid) > 4
    THEN '****' || right(twilio_account_sid, 4)
    ELSE twilio_account_sid
  END AS twilio_account_sid_masked,
  CASE
    WHEN twilio_auth_token IS NOT NULL AND length(twilio_auth_token) > 4
    THEN '****' || right(twilio_auth_token, 4)
    ELSE twilio_auth_token
  END AS twilio_auth_token_masked,
  twilio_phone_number,
  sms_configured,
  metadata,
  created_at,
  updated_at
FROM public.user_messaging_credentials;
