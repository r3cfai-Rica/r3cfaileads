import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap, Loader2, FolderPlus } from 'lucide-react';
import { Folder } from '@/contexts/AppContext';
import { useFolders } from '@/hooks/useFolders';

interface CreateBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  onSubmit: (data: BotFormData) => Promise<void>;
  isPending: boolean;
  language: 'pt-BR' | 'en-US';
}

export interface BotFormData {
  name: string;
  leadType: 'b2b' | 'trends' | 'person' | 'b2c';
  niche: string;
  country: string;
  city: string;
  folderId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  runTime: string;
  timezone: string;
  maxLeads: number;
  deduplicate: boolean;
}

const countries = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'United States' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
];

export const CreateBotDialog: React.FC<CreateBotDialogProps> = ({ open, onOpenChange, folders, onSubmit, isPending, language }) => {
  const { createFolder } = useFolders();
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [touched, setTouched] = useState(false);

  const [form, setForm] = useState<BotFormData>({
    name: '',
    leadType: 'b2b',
    niche: '',
    country: 'BR',
    city: '',
    folderId: '',
    frequency: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    runTime: '08:00',
    timezone: 'America/Sao_Paulo',
    maxLeads: 50,
    deduplicate: true,
  });

  const tt = language === 'pt-BR' ? {
    title: 'Criar Novo Robô',
    desc: 'Configure um robô para buscar leads automaticamente.',
    name: 'Nome do Robô',
    leadType: 'Tipo de Busca',
    b2b: 'B2B – Pessoa Jurídica (Google Maps)',
    trends: 'Tendências (Google Trends + IA)',
    person: 'B2C – Pessoa Física (Perplexity)',
    b2c: 'B2C Opt-in / CSV (em breve)',
    niche: 'Nicho/Interesse',
    country: 'País',
    city: 'Cidade/Região',
    folder: 'Salvar na Pasta',
    noFolders: 'Você ainda não tem pastas. Crie uma para organizar os leads.',
    createFolder: 'Criar pasta "Robôs IA"',
    frequency: 'Frequência',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    startDate: 'Data de Início',
    endDate: 'Data de Término (opcional)',
    runTime: 'Horário de Execução',
    timezone: 'Fuso Horário',
    maxLeads: 'Máx. Leads por Execução',
    deduplicate: 'Deduplicar leads',
    cancel: 'Cancelar',
    create: 'Criar Robô',
    requiredName: 'Informe um nome para o robô.',
    requiredNiche: 'Informe o nicho ou interesse.',
    requiredFolder: 'Selecione (ou crie) uma pasta.',
    soonBadge: 'Em breve',
  } : {
    title: 'Create New Robot',
    desc: 'Configure a robot to search for leads automatically.',
    name: 'Robot Name',
    leadType: 'Search Type',
    b2b: 'B2B – Business (Google Maps)',
    trends: 'Trends (Google Trends + AI)',
    person: 'B2C – Individual (Perplexity)',
    b2c: 'B2C Opt-in / CSV (coming soon)',
    niche: 'Niche/Interest',
    country: 'Country',
    city: 'City/Region',
    folder: 'Save to Folder',
    noFolders: "You don't have any folders yet. Create one to organize the leads.",
    createFolder: 'Create folder "AI Robots"',
    frequency: 'Frequency',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    startDate: 'Start Date',
    endDate: 'End Date (optional)',
    runTime: 'Run Time',
    timezone: 'Timezone',
    maxLeads: 'Max Leads per Run',
    deduplicate: 'Deduplicate leads',
    cancel: 'Cancel',
    create: 'Create Robot',
    requiredName: 'Enter a name for the robot.',
    requiredNiche: 'Enter the niche or interest.',
    requiredFolder: 'Select (or create) a folder.',
    soonBadge: 'Soon',
  };

  const errors = {
    name: !form.name.trim() ? tt.requiredName : '',
    niche: !form.niche.trim() ? tt.requiredNiche : '',
    folder: !form.folderId ? tt.requiredFolder : '',
  };
  const isValid = !errors.name && !errors.niche && !errors.folder;

  const handleCreateDefaultFolder = async () => {
    setCreatingFolder(true);
    const folder = await createFolder(language === 'pt-BR' ? 'Robôs IA' : 'AI Robots');
    if (folder) setForm(f => ({ ...f, folderId: folder.id }));
    setCreatingFolder(false);
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!isValid) return;
    await onSubmit(form);
    setTouched(false);
    setForm({
      name: '', leadType: 'b2b', niche: '', country: 'BR', city: '',
      folderId: '', frequency: 'daily', startDate: new Date().toISOString().split('T')[0],
      endDate: '', runTime: '08:00', timezone: 'America/Sao_Paulo', maxLeads: 50, deduplicate: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" />{tt.title}</DialogTitle>
          <DialogDescription>{tt.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{tt.name} *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Bot Pisos Industriais" />
            {touched && errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{tt.leadType}</label>
            <Select value={form.leadType} onValueChange={(v: any) => setForm(f => ({ ...f, leadType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="b2b">{tt.b2b}</SelectItem>
                <SelectItem value="trends">{tt.trends}</SelectItem>
                <SelectItem value="person">{tt.person}</SelectItem>
                <SelectItem value="b2c" disabled>{tt.b2c}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{tt.niche} *</label>
            <Input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="Ex: Marketing Digital" />
            {touched && errors.niche && <p className="text-xs text-destructive mt-1">{errors.niche}</p>}
          </div>
          {(form.leadType === 'b2b' || form.leadType === 'trends' || form.leadType === 'person') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{tt.country}</label>
                <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{tt.city}</label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ex: São Paulo" />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{tt.folder} *</label>
            {folders.length === 0 ? (
              <div className="space-y-2 p-3 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">{tt.noFolders}</p>
                <Button type="button" variant="outline" size="sm" onClick={handleCreateDefaultFolder} disabled={creatingFolder} className="gap-2">
                  {creatingFolder ? <Loader2 className="w-3 h-3 animate-spin" /> : <FolderPlus className="w-3 h-3" />}
                  {tt.createFolder}
                </Button>
              </div>
            ) : (
              <Select value={form.folderId} onValueChange={v => setForm(f => ({ ...f, folderId: v }))}>
                <SelectTrigger><SelectValue placeholder={tt.folder} /></SelectTrigger>
                <SelectContent>
                  {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {touched && errors.folder && <p className="text-xs text-destructive mt-1">{errors.folder}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tt.frequency}</label>
              <Select value={form.frequency} onValueChange={(v: any) => setForm(f => ({ ...f, frequency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{tt.daily}</SelectItem>
                  <SelectItem value="weekly">{tt.weekly}</SelectItem>
                  <SelectItem value="monthly">{tt.monthly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tt.maxLeads}</label>
              <Input type="number" value={form.maxLeads} onChange={e => setForm(f => ({ ...f, maxLeads: Number(e.target.value) }))} min={10} max={200} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tt.startDate}</label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tt.endDate}</label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tt.runTime}</label>
              <Input type="time" value={form.runTime} onChange={e => setForm(f => ({ ...f, runTime: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{tt.timezone}</label>
              <Select value={form.timezone} onValueChange={v => setForm(f => ({ ...f, timezone: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/Lisbon">Lisboa (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <label className="text-sm font-medium">{tt.deduplicate}</label>
            <Switch checked={form.deduplicate} onCheckedChange={v => setForm(f => ({ ...f, deduplicate: v }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tt.cancel}</Button>
          <Button variant="gradient" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {tt.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
