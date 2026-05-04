import React, { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, Plus, Settings2, Trash2, Clock, Target, Users, Loader2, Play, History, AlertTriangle, Check, XCircle, Calendar, Sparkles, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CreateBotDialog, BotFormData } from '@/components/automations/CreateBotDialog';
import { RobotRunsDialog } from '@/components/automations/RobotRunsDialog';

const Automations: React.FC = () => {
  const { folders, language } = useApp();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [historyRobotId, setHistoryRobotId] = useState<string | null>(null);
  const [historyRobotName, setHistoryRobotName] = useState('');

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
    mutationFn: async (form: BotFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate first next_run_at
      const startDate = new Date(form.startDate + 'T' + form.runTime + ':00');
      const now = new Date();
      let nextRun = startDate > now ? startDate : new Date();
      if (startDate <= now) {
        // Set to next occurrence
        if (form.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1);
        else if (form.frequency === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
        else if (form.frequency === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);
      }

      const { error } = await supabase.from('automations').insert({
        user_id: user.id,
        name: form.name,
        niche: form.niche,
        lead_type: form.leadType,
        country: form.country,
        city: form.city,
        folder_id: form.folderId || null,
        frequency: form.frequency,
        max_leads_per_run: form.maxLeads,
        start_date: form.startDate,
        end_date: form.endDate || null,
        run_time: form.runTime,
        timezone: form.timezone,
        deduplicate: form.deduplicate,
        next_run_at: nextRun.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setShowCreateDialog(false);
      toast.success(language === 'pt-BR' ? 'Robô criado com sucesso!' : 'Robot created successfully!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const update: any = { is_active: !isActive };
      // If reactivating, set a next_run
      if (!isActive) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        update.next_run_at = now.toISOString();
        update.last_status = null;
        update.last_error = null;
      } else {
        update.next_run_at = null;
      }
      const { error } = await supabase.from('automations').update(update).eq('id', id);
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
      toast.success(language === 'pt-BR' ? 'Robô removido.' : 'Robot removed.');
    },
  });

  const runNowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('run-automation', {
        body: { automationId: id, triggeredBy: 'user' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success(
        language === 'pt-BR'
          ? `Execução concluída: ${data.leadsSaved} leads salvos`
          : `Run completed: ${data.leadsSaved} leads saved`
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const tt = language === 'pt-BR' ? {
    title: 'Automações AI',
    subtitle: 'Robôs de prospecção automática com IA.',
    robotsTitle: 'Robôs de Prospecção',
    robotsDesc: 'Deixe a IA buscar leads para você enquanto você dorme.',
    createBot: 'Criar Novo Robô',
    emptyTitle: 'Seu exército de IA está aguardando',
    emptyDesc: 'Crie automações para que nossa inteligência busque novos leads periodicamente e os organize no seu CRM.',
    startNow: 'COMEÇAR AGORA',
    active: 'Ativo',
    paused: 'Pausado',
    error: 'Erro',
    nextRun: 'Próxima execução',
    lastRun: 'Última execução',
    never: 'Nunca executou',
    runNow: 'Executar agora',
    history: 'Histórico',
    leadsLastRun: 'última exec.',
  } : {
    title: 'AI Automations',
    subtitle: 'Automatic prospecting robots with AI.',
    robotsTitle: 'Prospecting Robots',
    robotsDesc: 'Let AI search leads for you while you sleep.',
    createBot: 'Create New Robot',
    emptyTitle: 'Your AI army is waiting',
    emptyDesc: 'Create automations so our intelligence periodically searches for new leads and organizes them in your CRM.',
    startNow: 'START NOW',
    active: 'Active',
    paused: 'Paused',
    error: 'Error',
    nextRun: 'Next run',
    lastRun: 'Last run',
    never: 'Never ran',
    runNow: 'Run now',
    history: 'History',
    leadsLastRun: 'last run',
  };

  const frequencyLabels: Record<string, string> = language === 'pt-BR'
    ? { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', hourly: 'Hora' }
    : { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', hourly: 'Hourly' };

  const getStatusBadge = (bot: any) => {
    if (bot.last_status === 'error') return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />{tt.error}</Badge>;
    if (bot.is_active) return <Badge variant="default" className="gap-1"><Check className="w-3 h-3" />{tt.active}</Badge>;
    return <Badge variant="secondary">{tt.paused}</Badge>;
  };

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
          {bots.map((bot: any) => (
            <Card key={bot.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bot.is_active && bot.last_status !== 'error' ? 'bg-success/20' : bot.last_status === 'error' ? 'bg-destructive/20' : 'bg-muted'}`}>
                        <Bot className={`w-6 h-6 ${bot.is_active && bot.last_status !== 'error' ? 'text-success' : bot.last_status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{bot.name}</h3>
                          {getStatusBadge(bot)}
                          <Badge variant="outline" className="text-xs uppercase">{bot.lead_type || 'b2b'}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Target className="w-4 h-4" />{bot.niche}</span>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{frequencyLabels[bot.frequency] || bot.frequency}</span>
                          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{bot.total_leads_found} leads</span>
                          {bot.last_leads_saved > 0 && (
                            <span className="text-xs">({bot.last_leads_saved} {tt.leadsLastRun})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={bot.is_active} onCheckedChange={() => toggleMutation.mutate({ id: bot.id, isActive: bot.is_active })} />
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(bot.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Run details row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {tt.lastRun}: {bot.last_run ? format(new Date(bot.last_run), 'dd/MM/yyyy HH:mm') : tt.never}
                    </span>
                    {bot.next_run_at && bot.is_active && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tt.nextRun}: {format(new Date(bot.next_run_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    )}
                    {bot.last_error && (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        {bot.last_error.length > 60 ? bot.last_error.substring(0, 60) + '...' : bot.last_error}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runNowMutation.mutate(bot.id)}
                      disabled={runNowMutation.isPending}
                      className="gap-1"
                    >
                      {runNowMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {tt.runNow}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setHistoryRobotId(bot.id); setHistoryRobotName(bot.name); }}
                      className="gap-1"
                    >
                      <History className="w-3 h-3" />
                      {tt.history}
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

      <CreateBotDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        folders={folders}
        onSubmit={createMutation.mutateAsync}
        isPending={createMutation.isPending}
        language={language}
      />

      {historyRobotId && (
        <RobotRunsDialog
          open={!!historyRobotId}
          onOpenChange={(o) => { if (!o) setHistoryRobotId(null); }}
          robotId={historyRobotId}
          robotName={historyRobotName}
          language={language}
        />
      )}
    </div>
  );
};

export default Automations;
