
-- Create automations table
CREATE TABLE public.automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly')),
  max_leads_per_run INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  total_leads_found INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own automations
CREATE POLICY "Users can view their own automations"
  ON public.automations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automations"
  ON public.automations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations"
  ON public.automations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations"
  ON public.automations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_automations_user_id ON public.automations(user_id);

-- Timestamp trigger
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
