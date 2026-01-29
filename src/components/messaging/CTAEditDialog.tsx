import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { CTA } from '@/contexts/AppContext';

interface CTAEditDialogProps {
  cta: CTA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ctaId: string, updates: { title: string; text: string }) => Promise<boolean>;
  language: string;
}

export const CTAEditDialog: React.FC<CTAEditDialogProps> = ({
  cta,
  open,
  onOpenChange,
  onSave,
  language,
}) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cta) {
      setTitle(cta.title);
      setText(cta.text);
    }
  }, [cta]);

  const handleSave = async () => {
    if (!cta || !title.trim() || !text.trim()) return;

    setIsSaving(true);
    const success = await onSave(cta.id, { title: title.trim(), text: text.trim() });
    setIsSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const t = {
    title: language === 'pt-BR' ? 'Editar CTA' : 'Edit CTA',
    description: language === 'pt-BR' 
      ? 'Modifique o título e o texto do seu CTA' 
      : 'Modify the title and text of your CTA',
    titleLabel: language === 'pt-BR' ? 'Título' : 'Title',
    textLabel: language === 'pt-BR' ? 'Texto do CTA' : 'CTA Text',
    cancel: language === 'pt-BR' ? 'Cancelar' : 'Cancel',
    save: language === 'pt-BR' ? 'Salvar Alterações' : 'Save Changes',
    saving: language === 'pt-BR' ? 'Salvando...' : 'Saving...',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cta-title">{t.titleLabel}</Label>
            <Input
              id="cta-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'pt-BR' ? 'Ex: Oferta Especial' : 'Ex: Special Offer'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cta-text">{t.textLabel}</Label>
            <Textarea
              id="cta-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={language === 'pt-BR' ? 'Digite o texto do seu CTA...' : 'Enter your CTA text...'}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              {text.length} {language === 'pt-BR' ? 'caracteres' : 'characters'}
            </p>
          </div>

          {cta?.imageUrl && (
            <div className="space-y-2">
              <Label>{language === 'pt-BR' ? 'Imagem do CTA' : 'CTA Image'}</Label>
              <img 
                src={cta.imageUrl} 
                alt={title}
                className="w-full max-h-32 object-cover rounded-lg border"
              />
              <p className="text-xs text-muted-foreground">
                {language === 'pt-BR' 
                  ? 'A imagem não pode ser alterada por aqui' 
                  : 'The image cannot be changed here'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t.cancel}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !title.trim() || !text.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t.save}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CTAEditDialog;
