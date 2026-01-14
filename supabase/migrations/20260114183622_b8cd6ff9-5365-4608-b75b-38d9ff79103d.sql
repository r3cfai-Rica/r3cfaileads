-- Create trigger to assign admin role when profile is created with admin email
CREATE TRIGGER on_profile_created_assign_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_to_email();