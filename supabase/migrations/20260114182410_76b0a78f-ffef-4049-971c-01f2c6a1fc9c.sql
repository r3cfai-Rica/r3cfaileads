-- Fix: Use the correct column reference (NEW.user_id instead of NEW.id since trigger fires on profiles table)
CREATE OR REPLACE FUNCTION public.assign_admin_to_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'ricaferrari@mac.com' THEN
    -- Update role to admin
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;