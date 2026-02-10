
-- Fix encrypt function - pgp_sym_encrypt takes (text, text)
CREATE OR REPLACE FUNCTION public.encrypt_credential(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _key TEXT;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN plain_text;
  END IF;
  SELECT value INTO _key FROM public.app_secrets WHERE key = 'encryption_key';
  IF _key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  RETURN encode(pgp_sym_encrypt(plain_text, _key), 'base64');
END;
$$;

-- Fix decrypt function
CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _key TEXT;
BEGIN
  IF encrypted_text IS NULL OR encrypted_text = '' THEN
    RETURN encrypted_text;
  END IF;
  SELECT value INTO _key FROM public.app_secrets WHERE key = 'encryption_key';
  IF _key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), _key);
EXCEPTION WHEN OTHERS THEN
  RETURN encrypted_text;
END;
$$;
