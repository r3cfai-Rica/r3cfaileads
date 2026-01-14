-- Trigger to auto-assign admin role to ricaferrari@mac.com
CREATE OR REPLACE FUNCTION public.assign_admin_to_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'ricaferrari@mac.com' THEN
    -- Insert admin role (on conflict do nothing if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to assign admin on signup
-- Note: We need to use the profiles table instead since we can't attach triggers to auth.users
-- The trigger on profiles will fire after handle_new_user creates the profile

DROP TRIGGER IF EXISTS assign_admin_role_trigger ON public.profiles;

CREATE TRIGGER assign_admin_role_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_to_email();