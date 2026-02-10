
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption/decryption functions using a server-side secret
CREATE OR REPLACE FUNCTION public.encrypt_credential(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN plain_text;
  END IF;
  RETURN encode(pgp_sym_encrypt(plain_text, current_setting('app.encryption_key', true)), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted_text IS NULL OR encrypted_text = '' THEN
    RETURN encrypted_text;
  END IF;
  RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), current_setting('app.encryption_key', true));
EXCEPTION WHEN OTHERS THEN
  -- If decryption fails (e.g. plain text data), return as-is
  RETURN encrypted_text;
END;
$$;

-- Create a safe view that masks sensitive fields for frontend use
CREATE OR REPLACE VIEW public.user_messaging_credentials_safe AS
SELECT
  id,
  user_id,
  CASE WHEN resend_api_key IS NOT NULL AND length(resend_api_key) > 4
    THEN '****' || right(resend_api_key, 4)
    ELSE resend_api_key
  END AS resend_api_key_masked,
  email_from_address,
  email_from_name,
  email_configured,
  CASE WHEN whatsapp_access_token IS NOT NULL AND length(whatsapp_access_token) > 4
    THEN '****' || right(whatsapp_access_token, 4)
    ELSE whatsapp_access_token
  END AS whatsapp_access_token_masked,
  whatsapp_phone_number_id,
  whatsapp_configured,
  CASE WHEN twilio_account_sid IS NOT NULL AND length(twilio_account_sid) > 4
    THEN '****' || right(twilio_account_sid, 4)
    ELSE twilio_account_sid
  END AS twilio_account_sid_masked,
  CASE WHEN twilio_auth_token IS NOT NULL AND length(twilio_auth_token) > 4
    THEN '****' || right(twilio_auth_token, 4)
    ELSE twilio_auth_token
  END AS twilio_auth_token_masked,
  twilio_phone_number,
  sms_configured,
  metadata,
  created_at,
  updated_at
FROM public.user_messaging_credentials;

-- Create a function to securely save credentials with encryption
CREATE OR REPLACE FUNCTION public.save_encrypted_credentials(
  _user_id UUID,
  _resend_api_key TEXT DEFAULT NULL,
  _email_from_address TEXT DEFAULT NULL,
  _email_from_name TEXT DEFAULT NULL,
  _email_configured BOOLEAN DEFAULT NULL,
  _whatsapp_access_token TEXT DEFAULT NULL,
  _whatsapp_phone_number_id TEXT DEFAULT NULL,
  _whatsapp_configured BOOLEAN DEFAULT NULL,
  _twilio_account_sid TEXT DEFAULT NULL,
  _twilio_auth_token TEXT DEFAULT NULL,
  _twilio_phone_number TEXT DEFAULT NULL,
  _sms_configured BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the owner
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.user_messaging_credentials (
    user_id, resend_api_key, email_from_address, email_from_name, email_configured,
    whatsapp_access_token, whatsapp_phone_number_id, whatsapp_configured,
    twilio_account_sid, twilio_auth_token, twilio_phone_number, sms_configured,
    updated_at
  ) VALUES (
    _user_id,
    public.encrypt_credential(_resend_api_key),
    _email_from_address,
    _email_from_name,
    COALESCE(_email_configured, false),
    public.encrypt_credential(_whatsapp_access_token),
    _whatsapp_phone_number_id,
    COALESCE(_whatsapp_configured, false),
    public.encrypt_credential(_twilio_account_sid),
    public.encrypt_credential(_twilio_auth_token),
    _twilio_phone_number,
    COALESCE(_sms_configured, false),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    resend_api_key = CASE WHEN _resend_api_key IS NOT NULL THEN public.encrypt_credential(_resend_api_key) ELSE user_messaging_credentials.resend_api_key END,
    email_from_address = COALESCE(_email_from_address, user_messaging_credentials.email_from_address),
    email_from_name = COALESCE(_email_from_name, user_messaging_credentials.email_from_name),
    email_configured = COALESCE(_email_configured, user_messaging_credentials.email_configured),
    whatsapp_access_token = CASE WHEN _whatsapp_access_token IS NOT NULL THEN public.encrypt_credential(_whatsapp_access_token) ELSE user_messaging_credentials.whatsapp_access_token END,
    whatsapp_phone_number_id = COALESCE(_whatsapp_phone_number_id, user_messaging_credentials.whatsapp_phone_number_id),
    whatsapp_configured = COALESCE(_whatsapp_configured, user_messaging_credentials.whatsapp_configured),
    twilio_account_sid = CASE WHEN _twilio_account_sid IS NOT NULL THEN public.encrypt_credential(_twilio_account_sid) ELSE user_messaging_credentials.twilio_account_sid END,
    twilio_auth_token = CASE WHEN _twilio_auth_token IS NOT NULL THEN public.encrypt_credential(_twilio_auth_token) ELSE user_messaging_credentials.twilio_auth_token END,
    twilio_phone_number = COALESCE(_twilio_phone_number, user_messaging_credentials.twilio_phone_number),
    sms_configured = COALESCE(_sms_configured, user_messaging_credentials.sms_configured),
    updated_at = now();
END;
$$;

-- Create a function to retrieve decrypted credentials (only for edge functions via service role)
CREATE OR REPLACE FUNCTION public.get_decrypted_credentials(_user_id UUID)
RETURNS TABLE(
  resend_api_key TEXT,
  email_from_address TEXT,
  email_from_name TEXT,
  email_configured BOOLEAN,
  whatsapp_access_token TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_configured BOOLEAN,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  sms_configured BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    public.decrypt_credential(c.resend_api_key),
    c.email_from_address,
    c.email_from_name,
    c.email_configured,
    public.decrypt_credential(c.whatsapp_access_token),
    c.whatsapp_phone_number_id,
    c.whatsapp_configured,
    public.decrypt_credential(c.twilio_account_sid),
    public.decrypt_credential(c.twilio_auth_token),
    c.twilio_phone_number,
    c.sms_configured
  FROM public.user_messaging_credentials c
  WHERE c.user_id = _user_id;
END;
$$;
