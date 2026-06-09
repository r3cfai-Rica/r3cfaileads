
-- Tighten realtime.messages: only admins for admin-notifications; deny others
DROP POLICY IF EXISTS "Admins receive admin notification realtime" ON realtime.messages;
CREATE POLICY "Realtime restricted to admin notifications for admins"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'admin-notifications'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions from anon/authenticated/public
REVOKE EXECUTE ON FUNCTION public.notify_admin_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_admin_to_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_on_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_plan_change() FROM PUBLIC, anon, authenticated;

-- Restrict messaging usage helpers to authenticated users only (no anon)
REVOKE EXECUTE ON FUNCTION public.increment_messaging_usage(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_messaging_limit(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_encrypted_credentials(uuid, text, text, text, boolean, text, text, boolean, text, text, text, boolean) FROM PUBLIC, anon;

-- Restrict campaign-images bucket: remove public listing; allow direct object reads via public URL stay (objects are publicly accessible via signed/public URLs through the bucket's public flag at the storage edge); but block SELECT listing via API for anon.
DROP POLICY IF EXISTS "Public can read campaign images" ON storage.objects;
CREATE POLICY "Authenticated owners can list their campaign images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'campaign-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
