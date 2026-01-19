
-- Remove sensitive PII columns from admin_notifications
ALTER TABLE public.admin_notifications 
DROP COLUMN IF EXISTS user_email,
DROP COLUMN IF EXISTS user_name;

-- Update trigger function to not store PII
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, user_id, metadata)
  VALUES (
    'new_user',
    'Novo usuário cadastrado',
    'Um novo usuário se cadastrou na plataforma.',
    NEW.user_id,
    jsonb_build_object('plan', NEW.plan)
  );
  RETURN NEW;
END;
$function$;

-- Update plan change trigger to not store PII
CREATE OR REPLACE FUNCTION public.notify_admin_plan_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.plan = 'free' AND NEW.plan = 'paid' THEN
    INSERT INTO public.admin_notifications (type, title, message, user_id, metadata)
    VALUES (
      'upgrade',
      'Upgrade para PRO',
      'Um usuário fez upgrade para o plano PRO.',
      NEW.user_id,
      jsonb_build_object('old_plan', OLD.plan, 'new_plan', NEW.plan)
    );
  ELSIF OLD.plan = 'paid' AND NEW.plan = 'free' THEN
    INSERT INTO public.admin_notifications (type, title, message, user_id, metadata)
    VALUES (
      'cancellation',
      'Cancelamento de plano',
      'Um usuário cancelou o plano PRO.',
      NEW.user_id,
      jsonb_build_object('old_plan', OLD.plan, 'new_plan', NEW.plan)
    );
  END IF;
  RETURN NEW;
END;
$function$;
