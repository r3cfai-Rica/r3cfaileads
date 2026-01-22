import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp, SearchHistory, NicheInsights } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export const useSearchHistory = () => {
  const { user, searchHistory, setSearchHistory, language } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const loadSearchHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedHistory: SearchHistory[] = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        niche: s.niche,
        date: new Date(s.created_at),
        leadsFound: s.leads_found || 0,
        leadsSaved: s.leads_saved || 0,
        insights: s.insights as unknown as NicheInsights,
        folderId: s.folder_id,
      }));

      setSearchHistory(mappedHistory);
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setSearchHistory]);

  const createSearchHistory = useCallback(async (params: {
    name: string;
    niche: string;
    category: string;
    leadsFound: number;
    leadsSaved: number;
    insights: NicheInsights;
    folderId: string;
  }): Promise<SearchHistory | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('search_history')
        .insert([{
          user_id: user.id,
          name: params.name,
          niche: params.niche,
          category: params.category,
          leads_found: params.leadsFound,
          leads_saved: params.leadsSaved,
          insights: JSON.parse(JSON.stringify(params.insights)),
          folder_id: params.folderId,
        }])
        .select()
        .single();

      if (error) throw error;

      const newHistory: SearchHistory = {
        id: data.id,
        name: data.name,
        category: data.category,
        niche: data.niche,
        date: new Date(data.created_at),
        leadsFound: data.leads_found || 0,
        leadsSaved: data.leads_saved || 0,
        insights: data.insights as unknown as NicheInsights,
        folderId: data.folder_id,
      };

      setSearchHistory(prev => [newHistory, ...prev]);

      return newHistory;
    } catch (error) {
      console.error('Error creating search history:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao salvar histórico' : 'Error saving history',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, setSearchHistory, toast, language]);

  const updateSearchHistory = useCallback(async (historyId: string, updates: Partial<{
    leadsSaved: number;
  }>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.leadsSaved !== undefined) updateData.leads_saved = updates.leadsSaved;

      const { error } = await supabase
        .from('search_history')
        .update(updateData)
        .eq('id', historyId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSearchHistory(prev => prev.map(s => 
        s.id === historyId ? { ...s, ...updates } : s
      ));

      return true;
    } catch (error) {
      console.error('Error updating search history:', error);
      return false;
    }
  }, [user, setSearchHistory]);

  useEffect(() => {
    if (user) {
      loadSearchHistory();
    }
  }, [user, loadSearchHistory]);

  return {
    searchHistory,
    isLoading,
    loadSearchHistory,
    createSearchHistory,
    updateSearchHistory,
  };
};
