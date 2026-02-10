
-- Encrypt existing plain-text credentials in user_messaging_credentials
UPDATE public.user_messaging_credentials
SET resend_api_key = public.encrypt_credential(resend_api_key)
WHERE resend_api_key IS NOT NULL AND resend_api_key != '' AND resend_api_key NOT LIKE '%==%' AND resend_api_key NOT LIKE 'ww0%';

UPDATE public.user_messaging_credentials
SET whatsapp_access_token = public.encrypt_credential(whatsapp_access_token)
WHERE whatsapp_access_token IS NOT NULL AND whatsapp_access_token != '' AND whatsapp_access_token NOT LIKE '%==%' AND whatsapp_access_token NOT LIKE 'ww0%';

UPDATE public.user_messaging_credentials
SET twilio_account_sid = public.encrypt_credential(twilio_account_sid)
WHERE twilio_account_sid IS NOT NULL AND twilio_account_sid != '' AND twilio_account_sid NOT LIKE '%==%' AND twilio_account_sid NOT LIKE 'ww0%';

UPDATE public.user_messaging_credentials
SET twilio_auth_token = public.encrypt_credential(twilio_auth_token)
WHERE twilio_auth_token IS NOT NULL AND twilio_auth_token != '' AND twilio_auth_token NOT LIKE '%==%' AND twilio_auth_token NOT LIKE 'ww0%';
