
-- Add new columns to automations table
ALTER TABLE public.automations
  ADD COLUMN IF NOT EXISTS lead_type text NOT NULL DEFAULT 'b2b',
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS run_time time DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS deduplicate boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_error text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_leads_saved integer NOT NULL DEFAULT 0;

-- Add place_id and tags to leads for deduplication and categorization
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS place_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS website text DEFAULT NULL;

-- Create index for deduplication
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON public.leads(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_user_email ON public.leads(user_id, email) WHERE email IS NOT NULL;

-- Create robot_runs table for execution history
CREATE TABLE IF NOT EXISTS public.robot_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  robot_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz DEFAULT NULL,
  status text NOT NULL DEFAULT 'running',
  leads_found integer NOT NULL DEFAULT 0,
  leads_saved integer NOT NULL DEFAULT 0,
  error_message text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on robot_runs
ALTER TABLE public.robot_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for robot_runs
CREATE POLICY "Users can view their own robot runs"
  ON public.robot_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own robot runs"
  ON public.robot_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own robot runs"
  ON public.robot_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own robot runs"
  ON public.robot_runs FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage robot runs (for cron worker)
CREATE POLICY "Service role can manage robot runs"
  ON public.robot_runs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_robot_runs_robot_id ON public.robot_runs(robot_id);
CREATE INDEX IF NOT EXISTS idx_automations_next_run ON public.automations(next_run_at) WHERE is_active = true;
