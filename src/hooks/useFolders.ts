import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp, Folder } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export const useFolders = () => {
  const { user, folders, setFolders, language } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const loadFolders = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedFolders: Folder[] = (data || []).map(f => ({
        id: f.id,
        name: f.name,
        leadCount: f.lead_count || 0,
        createdAt: new Date(f.created_at),
      }));

      setFolders(mappedFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setFolders]);

  const createFolder = useCallback(async (name: string): Promise<Folder | null> => {
    if (!user || !name.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: name.trim(),
          lead_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const newFolder: Folder = {
        id: data.id,
        name: data.name,
        leadCount: data.lead_count || 0,
        createdAt: new Date(data.created_at),
      };

      setFolders(prev => [newFolder, ...prev]);

      toast({
        title: language === 'pt-BR' ? 'Pasta criada!' : 'Folder created!',
        description: name,
      });

      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao criar pasta' : 'Error creating folder',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, setFolders, toast, language]);

  const updateFolder = useCallback(async (folderId: string, name: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: name.trim() })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, name: name.trim() } : f
      ));

      return true;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao atualizar pasta' : 'Error updating folder',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, setFolders, toast, language]);

  const deleteFolder = useCallback(async (folderId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFolders(prev => prev.filter(f => f.id !== folderId));

      toast({
        title: language === 'pt-BR' ? 'Pasta excluída' : 'Folder deleted',
      });

      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao excluir pasta' : 'Error deleting folder',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, setFolders, toast, language]);

  const updateFolderLeadCount = useCallback(async (folderId: string, increment: number): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current count
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return false;

      const newCount = Math.max(0, folder.leadCount + increment);

      const { error } = await supabase
        .from('folders')
        .update({ lead_count: newCount })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, leadCount: newCount } : f
      ));

      return true;
    } catch (error) {
      console.error('Error updating folder lead count:', error);
      return false;
    }
  }, [user, folders, setFolders]);

  // Note: Initial loading is now handled by useDataInitializer in AppLayout
  // This useEffect only triggers if folders are empty and user exists (edge case)
  useEffect(() => {
    if (user && folders.length === 0) {
      loadFolders();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    folders,
    isLoading,
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    updateFolderLeadCount,
  };
};
