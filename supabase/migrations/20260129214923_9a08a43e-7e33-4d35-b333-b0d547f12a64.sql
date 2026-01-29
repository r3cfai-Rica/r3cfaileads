-- Create audit log table for VIP trial slots
CREATE TABLE public.trial_slots_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid REFERENCES public.trial_slots(id) ON DELETE SET NULL,
  slot_number integer NOT NULL,
  action text NOT NULL, -- 'grant', 'extend', 'remove'
  admin_id uuid NOT NULL,
  admin_email text NOT NULL,
  target_user_id uuid,
  target_user_email text,
  target_user_name text,
  days_granted integer,
  previous_expires_at timestamp with time zone,
  new_expires_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trial_slots_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view the audit log
CREATE POLICY "Admins can view audit log"
ON public.trial_slots_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit entries
CREATE POLICY "Admins can insert audit entries"
ON public.trial_slots_audit
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_trial_slots_audit_created_at ON public.trial_slots_audit(created_at DESC);
CREATE INDEX idx_trial_slots_audit_target_user ON public.trial_slots_audit(target_user_id);