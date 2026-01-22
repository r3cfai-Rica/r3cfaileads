import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp, Lead } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export const useLeads = () => {
  const { user, leads, setLeads, language } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const loadLeads = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedLeads: Lead[] = (data || []).map(l => ({
        id: l.id,
        name: l.name,
        position: l.position || undefined,
        location: l.location || undefined,
        intentSignal: l.intent_signal || '',
        urgency: (l.urgency as 'low' | 'medium' | 'high') || 'low',
        email: l.email || undefined,
        phone: l.phone || undefined,
        whatsapp: l.whatsapp || undefined,
        sources: l.sources || [],
        isCompetitor: l.is_competitor || false,
        status: (l.status as 'new' | 'contacted' | 'qualified' | 'converted') || 'new',
        createdAt: new Date(l.created_at),
        folderId: l.folder_id || undefined,
      }));

      setLeads(mappedLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setLeads]);

  const saveLeads = useCallback(async (leadsToSave: Lead[], folderId: string): Promise<Lead[]> => {
    if (!user || leadsToSave.length === 0) return [];

    try {
      const insertData = leadsToSave.map(l => ({
        user_id: user.id,
        name: l.name,
        position: l.position || null,
        location: l.location || null,
        intent_signal: l.intentSignal,
        urgency: l.urgency,
        email: l.email || null,
        phone: l.phone || null,
        whatsapp: l.whatsapp || null,
        sources: l.sources || [],
        is_competitor: l.isCompetitor || false,
        status: l.status || 'new',
        folder_id: folderId,
      }));

      const { data, error } = await supabase
        .from('leads')
        .insert(insertData)
        .select();

      if (error) throw error;

      const savedLeads: Lead[] = (data || []).map(l => ({
        id: l.id,
        name: l.name,
        position: l.position || undefined,
        location: l.location || undefined,
        intentSignal: l.intent_signal || '',
        urgency: (l.urgency as 'low' | 'medium' | 'high') || 'low',
        email: l.email || undefined,
        phone: l.phone || undefined,
        whatsapp: l.whatsapp || undefined,
        sources: l.sources || [],
        isCompetitor: l.is_competitor || false,
        status: (l.status as 'new' | 'contacted' | 'qualified' | 'converted') || 'new',
        createdAt: new Date(l.created_at),
        folderId: l.folder_id || undefined,
      }));

      setLeads(prev => [...savedLeads, ...prev]);

      toast({
        title: language === 'pt-BR' ? 'Leads salvos!' : 'Leads saved!',
        description: language === 'pt-BR' 
          ? `${savedLeads.length} lead(s) salvo(s) com sucesso`
          : `${savedLeads.length} lead(s) saved successfully`,
      });

      return savedLeads;
    } catch (error) {
      console.error('Error saving leads:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao salvar leads' : 'Error saving leads',
        variant: 'destructive',
      });
      return [];
    }
  }, [user, setLeads, toast, language]);

  const updateLeadStatus = useCallback(async (leadId: string, status: Lead['status']): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, status } : l
      ));

      return true;
    } catch (error) {
      console.error('Error updating lead status:', error);
      return false;
    }
  }, [user, setLeads]);

  const deleteLead = useCallback(async (leadId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLeads(prev => prev.filter(l => l.id !== leadId));

      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }, [user, setLeads]);

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user, loadLeads]);

  return {
    leads,
    isLoading,
    loadLeads,
    saveLeads,
    updateLeadStatus,
    deleteLead,
  };
};
