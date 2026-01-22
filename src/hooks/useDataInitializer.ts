import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp, Folder, Lead, SearchHistory, CTA, NicheInsights } from '@/contexts/AppContext';

/**
 * Global data initializer hook
 * Loads all user data (folders, leads, CTAs, search history) when the user authenticates
 * This ensures data is available across all pages without requiring each page to call hooks individually
 */
export const useDataInitializer = () => {
  const { 
    user, 
    setFolders, 
    setLeads, 
    setCTAs, 
    setSearchHistory 
  } = useApp();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initializeData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Load all data in parallel for performance
      const [foldersRes, leadsRes, ctasRes, historyRes] = await Promise.all([
        supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('ctas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('search_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      // Map folders
      if (!foldersRes.error && foldersRes.data) {
        const mappedFolders: Folder[] = foldersRes.data.map(f => ({
          id: f.id,
          name: f.name,
          leadCount: f.lead_count || 0,
          createdAt: new Date(f.created_at),
        }));
        setFolders(mappedFolders);
      }

      // Map leads
      if (!leadsRes.error && leadsRes.data) {
        const mappedLeads: Lead[] = leadsRes.data.map(l => ({
          id: l.id,
          name: l.name,
          position: l.position || undefined,
          location: l.location || undefined,
          intentSignal: l.intent_signal,
          urgency: l.urgency as 'low' | 'medium' | 'high',
          email: l.email || undefined,
          phone: l.phone || undefined,
          whatsapp: l.whatsapp || undefined,
          sources: l.sources || [],
          isCompetitor: l.is_competitor || false,
          status: l.status as 'new' | 'contacted' | 'qualified' | 'converted',
          createdAt: new Date(l.created_at),
          folderId: l.folder_id || undefined,
        }));
        setLeads(mappedLeads);
      }

      // Map CTAs
      if (!ctasRes.error && ctasRes.data) {
        const mappedCTAs: CTA[] = ctasRes.data.map(c => ({
          id: c.id,
          title: c.title,
          text: c.text,
          imageUrl: c.image_url || undefined,
          folderId: c.folder_id || '',
          createdAt: new Date(c.created_at),
        }));
        setCTAs(mappedCTAs);
      }

      // Map search history
      if (!historyRes.error && historyRes.data) {
        const mappedHistory: SearchHistory[] = historyRes.data.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          niche: s.niche,
          date: new Date(s.created_at),
          leadsFound: s.leads_found || 0,
          leadsSaved: s.leads_saved || 0,
          insights: s.insights as unknown as NicheInsights,
          folderId: s.folder_id || '',
        }));
        setSearchHistory(mappedHistory);
      }

      setIsInitialized(true);
      console.log('✅ Data initialized successfully');
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setFolders, setLeads, setCTAs, setSearchHistory]);

  useEffect(() => {
    if (user && !isInitialized) {
      initializeData();
    }
  }, [user, isInitialized, initializeData]);

  // Reset initialization state when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      setIsInitialized(false);
    }
  }, [user]);

  return {
    isInitialized,
    isLoading,
    reinitialize: initializeData,
  };
};
