import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
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
import { Bot, Plus, Settings2, Trash2, Clock, Target, Users, Zap, X } from 'lucide-react';

interface AutomationBot {
  id: string;
  name: string;
  niche: string;
  folderId: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  maxLeadsPerRun: number;
  isActive: boolean;
  lastRun?: Date;
  totalLeadsFound: number;
  createdAt: Date;
}

const AUTOMATIONS_STORAGE_KEY = 'automations_bots_state';

interface AutomationsState {
  bots: AutomationBot[];
}

export const Automations: React.FC = () => {
  const { folders, language } = useApp();
  
  // Load persisted state
  const loadPersistedState = useCallback((): AutomationsState | null => {
    try {
      const saved = sessionStorage.getItem(AUTOMATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore Date objects
        if (parsed.bots) {
          parsed.bots = parsed.bots.map((bot: AutomationBot) => ({
            ...bot,
            createdAt: new Date(bot.createdAt),
            lastRun: bot.lastRun ? new Date(bot.lastRun) : undefined,
          }));
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading automations state:', e);
    }
    return null;
  }, []);

  const persistedState = loadPersistedState();
  
  const [bots, setBots] = useState<AutomationBot[]>(persistedState?.bots || []);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotNiche, setNewBotNiche] = useState('');
  const [newBotFolderId, setNewBotFolderId] = useState('');
  const [newBotFrequency, setNewBotFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [newBotMaxLeads, setNewBotMaxLeads] = useState(50);

  // Persist bots to sessionStorage
  useEffect(() => {
    const stateToSave: AutomationsState = { bots };
    sessionStorage.setItem(AUTOMATIONS_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [bots]);

  // Clear all bots
  const handleClearBots = useCallback(() => {
    setBots([]);
    sessionStorage.removeItem(AUTOMATIONS_STORAGE_KEY);
  }, []);

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

  const handleCreateBot = () => {
    if (!newBotName || !newBotNiche || !newBotFolderId) return;
    const bot: AutomationBot = {
      id: `bot-${Date.now()}`,
      name: newBotName,
      niche: newBotNiche,
      folderId: newBotFolderId,
      frequency: newBotFrequency,
      maxLeadsPerRun: newBotMaxLeads,
      isActive: true,
      totalLeadsFound: 0,
      createdAt: new Date(),
    };
    setBots([...bots, bot]);
    setNewBotName('');
    setNewBotNiche('');
    setNewBotFolderId('');
    setNewBotFrequency('daily');
    setNewBotMaxLeads(50);
    setShowCreateDialog(false);
  };

  const toggleBot = (botId: string) => {
    setBots(bots.map(bot => bot.id === botId ? { ...bot, isActive: !bot.isActive } : bot));
  };

  const deleteBot = (botId: string) => {
    setBots(bots.filter(bot => bot.id !== botId));
  };

  const frequencyLabels = { hourly: tt.hourly, daily: tt.daily, weekly: tt.weekly };

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

      {bots.length > 0 ? (
        <div className="grid gap-4">
          {bots.map((bot) => (
            <Card key={bot.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bot.isActive ? 'bg-success/20' : 'bg-muted'}`}>
                      <Bot className={`w-6 h-6 ${bot.isActive ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{bot.name}</h3>
                        <Badge variant={bot.isActive ? 'success' : 'muted'}>{bot.isActive ? tt.active : tt.paused}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Target className="w-4 h-4" />{bot.niche}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{frequencyLabels[bot.frequency]}</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{bot.totalLeadsFound} leads</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={bot.isActive} onCheckedChange={() => toggleBot(bot.id)} />
                    <Button variant="ghost" size="icon" onClick={() => deleteBot(bot.id)} className="text-destructive hover:bg-destructive/10">
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
            <Button variant="gradient" onClick={handleCreateBot} disabled={!newBotName || !newBotNiche || !newBotFolderId}><Zap className="w-4 h-4 mr-2" />{tt.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Automations;
