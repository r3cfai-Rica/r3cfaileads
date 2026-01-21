import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
const getSessionId = (): string => {
  const key = 'cta_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export interface TrackCtaOptions {
  page: string;
  section: string;
  ctaText?: string;
}

export const useCtaTracking = () => {
  const sessionId = useRef(getSessionId());

  const trackClick = useCallback(async (options: TrackCtaOptions) => {
    const { page, section, ctaText } = options;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('cta_clicks').insert({
        page,
        section,
        cta_text: ctaText,
        user_id: user?.id || null,
        session_id: sessionId.current,
      });
    } catch (error) {
      console.error('Failed to track CTA click:', error);
    }
  }, []);

  return { trackClick };
};

export const usePageViewTracking = (page: string) => {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('page_views').insert({
          page,
          session_id: sessionId,
          user_id: user?.id || null,
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [page]);
};
