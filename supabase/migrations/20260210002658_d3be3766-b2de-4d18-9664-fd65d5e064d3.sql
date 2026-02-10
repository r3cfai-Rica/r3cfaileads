
-- Create a secure config table for encryption key (no RLS, only accessible via service role / security definer functions)
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and deny all access (only security definer functions can read)
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
-- No policies = no access for any role via RLS

-- Revoke all direct access
REVOKE ALL ON public.app_secrets FROM anon, authenticated;

-- Insert encryption key
INSERT INTO public.app_secrets (key, value) 
VALUES ('encryption_key', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- Update encrypt function to read key from app_secrets
CREATE OR REPLACE FUNCTION public.encrypt_credential(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update decrypt function to read key from app_secrets
CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
