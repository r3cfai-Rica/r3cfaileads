import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp, CTA } from '@/contexts/AppContext';
import { useToast } from './use-toast';

export const useCTAs = () => {
  const { user, ctas, setCTAs, language } = useApp();
  const { toast } = useToast();

  // Load CTAs from database
  const loadCTAs = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ctas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading CTAs:', error);
        return;
      }

      const mappedCTAs: CTA[] = (data || []).map((cta) => ({
        id: cta.id,
        title: cta.title,
        text: cta.text,
        imageUrl: cta.image_url || undefined,
        folderId: cta.folder_id || '',
        createdAt: new Date(cta.created_at),
      }));

      setCTAs(mappedCTAs);
    } catch (error) {
      console.error('Error loading CTAs:', error);
    }
  }, [user, setCTAs]);

  // Save a CTA to database
  const saveCTA = useCallback(async (cta: Omit<CTA, 'id' | 'createdAt'>) => {
    if (!user) {
      toast({
        title: language === 'pt-BR' ? 'Erro' : 'Error',
        description: language === 'pt-BR' ? 'Usuário não autenticado' : 'User not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('ctas')
        .insert({
          user_id: user.id,
          title: cta.title,
          text: cta.text,
          image_url: cta.imageUrl || null,
          folder_id: cta.folderId || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving CTA:', error);
        toast({
          title: language === 'pt-BR' ? 'Erro ao salvar CTA' : 'Error saving CTA',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      const newCTA: CTA = {
        id: data.id,
        title: data.title,
        text: data.text,
        imageUrl: data.image_url || undefined,
        folderId: data.folder_id || '',
        createdAt: new Date(data.created_at),
      };

      setCTAs((prev) => [newCTA, ...prev]);

      toast({
        title: language === 'pt-BR' ? 'CTA salvo!' : 'CTA saved!',
        description: language === 'pt-BR' ? 'O CTA foi salvo com sucesso.' : 'The CTA was saved successfully.',
      });

      return newCTA;
    } catch (error) {
      console.error('Error saving CTA:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao salvar CTA' : 'Error saving CTA',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, setCTAs, toast, language]);

  // Delete a CTA from database
  const deleteCTA = useCallback(async (ctaId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('ctas')
        .delete()
        .eq('id', ctaId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting CTA:', error);
        toast({
          title: language === 'pt-BR' ? 'Erro ao excluir CTA' : 'Error deleting CTA',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      setCTAs((prev) => prev.filter((c) => c.id !== ctaId));

      toast({
        title: language === 'pt-BR' ? 'CTA excluído!' : 'CTA deleted!',
      });

      return true;
    } catch (error) {
      console.error('Error deleting CTA:', error);
      return false;
    }
  }, [user, setCTAs, toast, language]);

  // Load CTAs when user changes
  useEffect(() => {
    if (user) {
      loadCTAs();
    }
  }, [user, loadCTAs]);

  return {
    ctas,
    loadCTAs,
    saveCTA,
    deleteCTA,
  };
};
