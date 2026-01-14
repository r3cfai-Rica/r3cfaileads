-- Create notifications table for admin alerts
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'new_user', 'upgrade', 'cancellation', 'milestone'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view all notifications"
  ON public.admin_notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
  ON public.admin_notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;

-- Create function to notify admin on new user signup
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, user_id, user_name, user_email, metadata)
  VALUES (
    'new_user',
    'Novo usuário cadastrado',
    'Um novo usuário se cadastrou na plataforma.',
    NEW.user_id,
    NEW.name,
    NEW.email,
    jsonb_build_object('plan', NEW.plan)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user notifications
CREATE TRIGGER on_new_user_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();

-- Create function to notify admin on plan upgrade
CREATE OR REPLACE FUNCTION public.notify_admin_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.plan = 'free' AND NEW.plan = 'paid' THEN
    INSERT INTO public.admin_notifications (type, title, message, user_id, user_name, user_email, metadata)
    VALUES (
      'upgrade',
      'Upgrade para PRO',
      'Um usuário fez upgrade para o plano PRO.',
      NEW.user_id,
      NEW.name,
      NEW.email,
      jsonb_build_object('old_plan', OLD.plan, 'new_plan', NEW.plan)
    );
  ELSIF OLD.plan = 'paid' AND NEW.plan = 'free' THEN
    INSERT INTO public.admin_notifications (type, title, message, user_id, user_name, user_email, metadata)
    VALUES (
      'cancellation',
      'Cancelamento de plano',
      'Um usuário cancelou o plano PRO.',
      NEW.user_id,
      NEW.name,
      NEW.email,
      jsonb_build_object('old_plan', OLD.plan, 'new_plan', NEW.plan)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for plan change notifications
CREATE TRIGGER on_plan_change_notify_admin
  AFTER UPDATE OF plan ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_plan_change();