import React, { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot, Plus, Settings2, Trash2, Clock, Target, Users, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Automations: React.FC = () => {
  const { folders, language } = useApp();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotNiche, setNewBotNiche] = useState('');
  const [newBotFolderId, setNewBotFolderId] = useState('');
  const [newBotFrequency, setNewBotFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [newBotMaxLeads, setNewBotMaxLeads] = useState(50);

  const { data: bots = [], isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('automations').insert({
        user_id: user.id,
        name: newBotName,
        niche: newBotNiche,
        folder_id: newBotFolderId || null,
        frequency: newBotFrequency,
        max_leads_per_run: newBotMaxLeads,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setNewBotName('');
      setNewBotNiche('');
      setNewBotFolderId('');
      setNewBotFrequency('daily');
      setNewBotMaxLeads(50);
      setShowCreateDialog(false);
      toast.success('Robô criado com sucesso!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('automations').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Robô removido.');
    },
  });

  const tt = language === 'pt-BR' ? {
    title: 'Automações AI',
    subtitle: 'Controle de clientes e faturamento LeadFlow.',
    robotsTitle: 'Robôs de Prospecção',
    robotsDesc: 'Deixe a IA buscar leads para você enquanto você dorme.',
    createBot: 'Criar Novo Robô',
    emptyTitle: 'Seu exército de IA está aguardando',
    emptyDesc: 'Crie automações para que nossa inteligência busque novos leads periodicamente e os organize no seu CRM.',
    startNow: 'COMEÇAR AGORA',
    botName: 'Nome do Robô',
    selectNiche: 'Nicho para Prospectar',
    selectFolder: 'Salvar na Pasta',
    frequency: 'Frequência',
    hourly: 'A cada hora',
    daily: 'Diário',
    weekly: 'Semanal',
    maxLeads: 'Máx. Leads por Execução',
    cancel: 'Cancelar',
    create: 'Criar Robô',
    active: 'Ativo',
    paused: 'Pausado',
    lastRun: 'Última execução',
    never: 'Nunca executou',
  } : {
    title: 'AI Automations',
    subtitle: 'LeadFlow customer and billing control.',
    robotsTitle: 'Prospecting Robots',
    robotsDesc: 'Let AI search leads for you while you sleep.',
    createBot: 'Create New Robot',
    emptyTitle: 'Your AI army is waiting',
    emptyDesc: 'Create automations so our intelligence periodically searches for new leads and organizes them in your CRM.',
    startNow: 'START NOW',
    botName: 'Robot Name',
    selectNiche: 'Niche to Prospect',
    selectFolder: 'Save to Folder',
    frequency: 'Frequency',
    hourly: 'Hourly',
    daily: 'Daily',
    weekly: 'Weekly',
    maxLeads: 'Max Leads per Run',
    cancel: 'Cancel',
    create: 'Create Robot',
    active: 'Active',
    paused: 'Paused',
    lastRun: 'Last run',
    never: 'Never ran',
  };

  const frequencyLabels: Record<string, string> = { hourly: tt.hourly, daily: tt.daily, weekly: tt.weekly };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">{tt.title}</h1>
        <p className="text-muted-foreground mt-1">{tt.subtitle}</p>
      </div>

      <Card className="border-2 border-dashed border-muted">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{tt.robotsTitle}</h2>
                <p className="text-muted-foreground">{tt.robotsDesc}</p>
              </div>
            </div>
            <Button variant="outline" size="lg" onClick={() => setShowCreateDialog(true)} className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Plus className="w-5 h-5" />
              {tt.createBot}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : bots.length > 0 ? (
        <div className="grid gap-4">
          {bots.map((bot) => (
            <Card key={bot.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bot.is_active ? 'bg-success/20' : 'bg-muted'}`}>
                      <Bot className={`w-6 h-6 ${bot.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{bot.name}</h3>
                        <Badge variant={bot.is_active ? 'default' : 'secondary'}>{bot.is_active ? tt.active : tt.paused}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Target className="w-4 h-4" />{bot.niche}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{frequencyLabels[bot.frequency] || bot.frequency}</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{bot.total_leads_found} leads</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={bot.is_active} onCheckedChange={() => toggleMutation.mutate({ id: bot.id, isActive: bot.is_active })} />
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(bot.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-muted">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                <Settings2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">{tt.emptyTitle}</h3>
              <p className="text-muted-foreground mb-6">{tt.emptyDesc}</p>
              <Button variant="gradient" size="lg" onClick={() => setShowCreateDialog(true)} className="uppercase tracking-wider">{tt.startNow}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" />{tt.createBot}</DialogTitle>
            <DialogDescription>{tt.robotsDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{tt.botName}</label>
              <Input value={newBotName} onChange={(e) => setNewBotName(e.target.value)} placeholder="Ex: Bot Pisos Industriais" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{tt.selectNiche}</label>
              <Input value={newBotNiche} onChange={(e) => setNewBotNiche(e.target.value)} placeholder="Ex: Pisos Uretanos" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{tt.selectFolder}</label>
              <Select value={newBotFolderId} onValueChange={setNewBotFolderId}>
                <SelectTrigger><SelectValue placeholder={tt.selectFolder} /></SelectTrigger>
                <SelectContent>
                  {folders.map(folder => (<SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{tt.frequency}</label>
              <Select value={newBotFrequency} onValueChange={(v: 'hourly' | 'daily' | 'weekly') => setNewBotFrequency(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">{tt.hourly}</SelectItem>
                  <SelectItem value="daily">{tt.daily}</SelectItem>
                  <SelectItem value="weekly">{tt.weekly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{tt.maxLeads}</label>
              <Input type="number" value={newBotMaxLeads} onChange={(e) => setNewBotMaxLeads(Number(e.target.value))} min={10} max={200} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{tt.cancel}</Button>
            <Button variant="gradient" onClick={() => createMutation.mutate()} disabled={!newBotName || !newBotNiche || !newBotFolderId || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              {tt.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Automations;