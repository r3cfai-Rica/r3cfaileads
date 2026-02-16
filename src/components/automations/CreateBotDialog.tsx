import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Zap, Loader2 } from 'lucide-react';
import { Folder } from '@/contexts/AppContext';

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
  leadType: 'b2b' | 'b2c' | 'both';
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
    leadType: 'Tipo de Lead',
    b2b: 'B2B (Empresas)',
    b2c: 'B2C (Consumidor)',
    both: 'Ambos',
    niche: 'Nicho/Interesse',
    country: 'País',
    city: 'Cidade/Região',
    folder: 'Salvar na Pasta',
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
  } : {
    title: 'Create New Robot',
    desc: 'Configure a robot to search for leads automatically.',
    name: 'Robot Name',
    leadType: 'Lead Type',
    b2b: 'B2B (Business)',
    b2c: 'B2C (Consumer)',
    both: 'Both',
    niche: 'Niche/Interest',
    country: 'Country',
    city: 'City/Region',
    folder: 'Save to Folder',
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
  };

  const isValid = form.name.trim() && form.niche.trim() && form.folderId;

  const handleSubmit = async () => {
    if (!isValid) return;
    await onSubmit(form);
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
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{tt.leadType}</label>
            <Select value={form.leadType} onValueChange={(v: any) => setForm(f => ({ ...f, leadType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="b2b">{tt.b2b}</SelectItem>
                <SelectItem value="b2c">{tt.b2c}</SelectItem>
                <SelectItem value="both">{tt.both}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{tt.niche} *</label>
            <Input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="Ex: Marketing Digital" />
          </div>
          {(form.leadType === 'b2b' || form.leadType === 'both') && (
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
            <Select value={form.folderId} onValueChange={v => setForm(f => ({ ...f, folderId: v }))}>
              <SelectTrigger><SelectValue placeholder={tt.folder} /></SelectTrigger>
              <SelectContent>
                {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
          <Button variant="gradient" onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {tt.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
