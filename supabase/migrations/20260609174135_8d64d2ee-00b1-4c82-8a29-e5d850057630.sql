
-- 1) Encrypt meta_connections.page_access_token at rest
-- Encrypt any existing plaintext tokens (idempotent: decrypt_credential returns input on failure)
UPDATE public.meta_connections
SET page_access_token = public.encrypt_credential(page_access_token)
WHERE page_access_token IS NOT NULL
  AND page_access_token <> ''
  AND public.decrypt_credential(page_access_token) = page_access_token;

-- Revoke direct column access for clients; force use of RPC
REVOKE SELECT ON public.meta_connections FROM authenticated;
GRANT SELECT (id, user_id, page_id, page_name, is_active, created_at, updated_at) ON public.meta_connections TO authenticated;

-- RPC to fetch the decrypted access token only for the owner (or service role internally)
CREATE OR REPLACE FUNCTION public.get_meta_page_access_token(_connection_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _token text;
BEGIN
  SELECT user_id, page_access_token INTO _owner, _token
  FROM public.meta_connections
  WHERE id = _connection_id;

  IF _owner IS NULL THEN
    RETURN NULL;
  END IF;

  IF auth.uid() IS DISTINCT FROM _owner THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN public.decrypt_credential(_token);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_meta_page_access_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_meta_page_access_token(uuid) TO authenticated;

-- Trigger to ensure new/updated tokens are always stored encrypted
CREATE OR REPLACE FUNCTION public.encrypt_meta_token_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.page_access_token IS NOT NULL AND NEW.page_access_token <> '' THEN
    -- If decrypt returns same value, assume it's plaintext and encrypt
    IF public.decrypt_credential(NEW.page_access_token) = NEW.page_access_token THEN
      NEW.page_access_token := public.encrypt_credential(NEW.page_access_token);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encrypt_meta_token ON public.meta_connections;
CREATE TRIGGER encrypt_meta_token
BEFORE INSERT OR UPDATE OF page_access_token ON public.meta_connections
FOR EACH ROW EXECUTE FUNCTION public.encrypt_meta_token_trigger();

-- 2) Restrict Realtime subscriptions to per-user topics for conversations and inbox_messages
-- Policy pattern: topic must be one of "conversations:<auth.uid()>" or "inbox:<auth.uid()>"
DROP POLICY IF EXISTS "Users can subscribe to their own conversation channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own conversation channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'conversations:' || auth.uid()::text
  OR realtime.topic() = 'inbox:' || auth.uid()::text
);
