import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Check, AlertTriangle } from 'lucide-react';
import { Lead } from '@/contexts/AppContext';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: Lead[]) => void;
  language: 'pt-BR' | 'en-US';
}

const LEAD_FIELDS = ['name', 'email', 'phone', 'whatsapp', 'location', 'position'] as const;

type FieldMapping = Record<string, typeof LEAD_FIELDS[number] | 'ignore'>;

export const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ open, onOpenChange, onImport, language }) => {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');

  const tt = language === 'pt-BR' ? {
    title: 'Importar CSV',
    desc: 'Importe leads a partir de um arquivo CSV.',
    uploadFile: 'Selecionar Arquivo CSV',
    mapColumns: 'Mapear Colunas',
    csvColumn: 'Coluna CSV',
    mapTo: 'Mapear para',
    ignore: 'Ignorar',
    preview: 'Pré-visualização',
    import: 'Importar Leads',
    cancel: 'Cancelar',
    back: 'Voltar',
    next: 'Próximo',
    rows: 'linhas encontradas',
    noName: 'A coluna "Nome" é obrigatória.',
  } : {
    title: 'Import CSV',
    desc: 'Import leads from a CSV file.',
    uploadFile: 'Select CSV File',
    mapColumns: 'Map Columns',
    csvColumn: 'CSV Column',
    mapTo: 'Map to',
    ignore: 'Ignore',
    preview: 'Preview',
    import: 'Import Leads',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    rows: 'rows found',
    noName: 'The "Name" column mapping is required.',
  };

  const fieldLabels: Record<string, string> = language === 'pt-BR'
    ? { name: 'Nome', email: 'E-mail', phone: 'Telefone', whatsapp: 'WhatsApp', location: 'Cidade/Local', position: 'Interesse/Tag', ignore: 'Ignorar' }
    : { name: 'Name', email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', location: 'City/Location', position: 'Interest/Tag', ignore: 'Ignore' };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      // Detect delimiter
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.replace(/"/g, '').trim());
      const rows = lines.slice(1).map(l => l.split(delimiter).map(c => c.replace(/"/g, '').trim()));

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map columns
      const autoMap: FieldMapping = {};
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('nome') || lower === 'name' || lower === 'full_name') autoMap[h] = 'name';
        else if (lower.includes('email') || lower.includes('e-mail')) autoMap[h] = 'email';
        else if (lower.includes('whatsapp') || lower.includes('wpp')) autoMap[h] = 'whatsapp';
        else if (lower.includes('telefone') || lower.includes('phone') || lower.includes('tel')) autoMap[h] = 'phone';
        else if (lower.includes('cidade') || lower.includes('city') || lower.includes('location') || lower.includes('local')) autoMap[h] = 'location';
        else if (lower.includes('interesse') || lower.includes('interest') || lower.includes('tag') || lower.includes('cargo') || lower.includes('position')) autoMap[h] = 'position';
        else autoMap[h] = 'ignore';
      });
      setMapping(autoMap);
      setStep('map');
    };
    reader.readAsText(file);
  }, []);

  const hasNameMapping = Object.values(mapping).includes('name');

  const handleImport = () => {
    const leads: Lead[] = csvRows.map((row, i) => {
      const lead: any = {
        id: `csv-${Date.now()}-${i}`,
        name: '',
        intentSignal: 'CSV Import',
        urgency: 'medium' as const,
        sources: ['CSV Import'],
        isCompetitor: false,
        status: 'new' as const,
        createdAt: new Date(),
      };

      csvHeaders.forEach((header, colIdx) => {
        const field = mapping[header];
        if (field && field !== 'ignore' && row[colIdx]) {
          lead[field] = row[colIdx];
        }
      });

      return lead as Lead;
    }).filter(l => l.name?.trim());

    onImport(leads);
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />{tt.title}</DialogTitle>
          <DialogDescription>{tt.desc}</DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <label className="cursor-pointer">
              <Button variant="outline" size="lg" className="gap-2" asChild>
                <span>
                  <Upload className="w-4 h-4" />
                  {tt.uploadFile}
                </span>
              </Button>
              <Input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="success">{csvRows.length} {tt.rows}</Badge>
            </div>
            <div className="space-y-3">
              {csvHeaders.map(header => (
                <div key={header} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-1/3 truncate" title={header}>{header}</span>
                  <Select value={mapping[header] || 'ignore'} onValueChange={(v) => setMapping(prev => ({ ...prev, [header]: v as any }))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...LEAD_FIELDS, 'ignore' as const].map(f => (
                        <SelectItem key={f} value={f}>{fieldLabels[f]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {!hasNameMapping && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" />
                {tt.noName}
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-2 py-2 max-h-60 overflow-y-auto">
            {csvRows.slice(0, 5).map((row, i) => {
              const nameCol = csvHeaders.findIndex(h => mapping[h] === 'name');
              const emailCol = csvHeaders.findIndex(h => mapping[h] === 'email');
              const phoneCol = csvHeaders.findIndex(h => mapping[h] === 'phone');
              return (
                <div key={i} className="p-2 rounded border text-sm">
                  <span className="font-medium">{nameCol >= 0 ? row[nameCol] : '—'}</span>
                  {emailCol >= 0 && row[emailCol] && <span className="ml-2 text-muted-foreground">{row[emailCol]}</span>}
                  {phoneCol >= 0 && row[phoneCol] && <span className="ml-2 text-muted-foreground">{row[phoneCol]}</span>}
                </div>
              );
            })}
            {csvRows.length > 5 && <p className="text-xs text-muted-foreground text-center">+{csvRows.length - 5} more...</p>}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== 'upload' && (
            <Button variant="outline" onClick={() => setStep(step === 'preview' ? 'map' : 'upload')}>
              {tt.back}
            </Button>
          )}
          {step === 'map' && (
            <Button onClick={() => setStep('preview')} disabled={!hasNameMapping}>
              {tt.next}
            </Button>
          )}
          {step === 'preview' && (
            <Button variant="gradient" onClick={handleImport} className="gap-2">
              <Check className="w-4 h-4" />
              {tt.import} ({csvRows.filter((row) => {
                const nameCol = csvHeaders.findIndex(h => mapping[h] === 'name');
                return nameCol >= 0 && row[nameCol]?.trim();
              }).length})
            </Button>
          )}
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>{tt.cancel}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
