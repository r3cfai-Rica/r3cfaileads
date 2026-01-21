-- Create table for CTA click tracking
CREATE TABLE public.cta_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page VARCHAR(100) NOT NULL,
  section VARCHAR(100) NOT NULL,
  cta_text VARCHAR(255),
  user_id UUID,
  session_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_cta_clicks_page_section ON public.cta_clicks(page, section);
CREATE INDEX idx_cta_clicks_created_at ON public.cta_clicks(created_at);

-- Enable RLS
ALTER TABLE public.cta_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for anonymous tracking)
CREATE POLICY "Anyone can insert cta clicks" 
ON public.cta_clicks 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view all clicks
CREATE POLICY "Admins can view all cta clicks" 
ON public.cta_clicks 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own clicks
CREATE POLICY "Users can view their own cta clicks" 
ON public.cta_clicks 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create table for page views (to calculate conversion rate)
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page VARCHAR(100) NOT NULL,
  session_id VARCHAR(100),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index
CREATE INDEX idx_page_views_page ON public.page_views(page);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert page views
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view all page views
CREATE POLICY "Admins can view all page views" 
ON public.page_views 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));