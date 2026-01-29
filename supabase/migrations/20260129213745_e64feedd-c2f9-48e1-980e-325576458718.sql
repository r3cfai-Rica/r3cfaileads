-- Create trial_slots table for 5 VIP trial positions
CREATE TABLE public.trial_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number integer NOT NULL CHECK (slot_number >= 1 AND slot_number <= 5),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  granted_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (slot_number)
);

-- Enable RLS
ALTER TABLE public.trial_slots ENABLE ROW LEVEL SECURITY;

-- Only admins can view trial slots
CREATE POLICY "Admins can view all trial slots"
ON public.trial_slots
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert trial slots
CREATE POLICY "Admins can insert trial slots"
ON public.trial_slots
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update trial slots
CREATE POLICY "Admins can update trial slots"
ON public.trial_slots
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete trial slots
CREATE POLICY "Admins can delete trial slots"
ON public.trial_slots
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_trial_slots_updated_at
BEFORE UPDATE ON public.trial_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 5 empty slots
INSERT INTO public.trial_slots (slot_number) VALUES (1), (2), (3), (4), (5);

-- Allow authenticated users to check if they have an active trial (for their own access check)
CREATE POLICY "Users can check their own trial status"
ON public.trial_slots
FOR SELECT
USING (auth.uid() = user_id);