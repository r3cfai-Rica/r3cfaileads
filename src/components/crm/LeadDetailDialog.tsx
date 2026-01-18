import React from 'react';
import { Lead } from '@/contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Building,
  Briefcase,
  AlertTriangle,
  Zap,
  Globe,
  User,
  Calendar,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
}

export const LeadDetailDialog: React.FC<LeadDetailDialogProps> = ({
  lead,
  open,
  onOpenChange,
  language,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  if (!lead) return null;

  const statusVariant = {
    new: 'new' as const,
    contacted: 'contacted' as const,
    qualified: 'qualified' as const,
    converted: 'converted' as const,
  };

  const statusLabels = {
    new: language === 'pt-BR' ? 'Novo' : 'New',
    contacted: language === 'pt-BR' ? 'Contatado' : 'Contacted',
    qualified: language === 'pt-BR' ? 'Qualificado' : 'Qualified',
    converted: language === 'pt-BR' ? 'Convertido' : 'Converted',
  };

  const urgencyLabels = {
    high: { label: language === 'pt-BR' ? 'Alta' : 'High', color: 'text-red-500' },
    medium: { label: language === 'pt-BR' ? 'Média' : 'Medium', color: 'text-yellow-500' },
    low: { label: language === 'pt-BR' ? 'Baixa' : 'Low', color: 'text-green-500' },
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: language === 'pt-BR' ? 'Copiado!' : 'Copied!',
        description: language === 'pt-BR' ? 'Texto copiado para a área de transferência.' : 'Text copied to clipboard.',
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: language === 'pt-BR' ? 'Erro' : 'Error',
        description: language === 'pt-BR' ? 'Não foi possível copiar.' : 'Could not copy.',
        variant: 'destructive',
      });
    }
  };

  const ContactButton: React.FC<{ icon: React.ReactNode; label: string; value?: string; href?: string; field: string }> = ({
    icon,
    label,
    value,
    href,
    field,
  }) => {
    if (!value) return null;

    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-sm">{value}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => copyToClipboard(value, field)}
          >
            {copiedField === field ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          {href && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={href} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{lead.name}</DialogTitle>
                {lead.position && (
                  <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {lead.position}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Status & Urgency */}
        <div className="flex items-center gap-3 mb-4">
          <Badge variant={statusVariant[lead.status]} className="text-sm px-3 py-1">
            {statusLabels[lead.status]}
          </Badge>
          {lead.urgency && (
            <div className={`flex items-center gap-1.5 text-sm ${urgencyLabels[lead.urgency]?.color || 'text-muted-foreground'}`}>
              <AlertTriangle className="w-4 h-4" />
              <span>{language === 'pt-BR' ? 'Urgência:' : 'Urgency:'} {urgencyLabels[lead.urgency]?.label || lead.urgency}</span>
            </div>
          )}
        </div>

        {/* Intent Signal */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Zap className="w-4 h-4" />
            <span className="font-semibold text-sm">
              {language === 'pt-BR' ? 'Sinal de Intenção' : 'Intent Signal'}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{lead.intentSignal}</p>
        </div>

        {/* Location */}
        {lead.location && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <MapPin className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'pt-BR' ? 'Localização' : 'Location'}
              </p>
              <p className="font-medium text-sm">{lead.location}</p>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Contact Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            {language === 'pt-BR' ? 'Informações de Contato' : 'Contact Information'}
          </h4>
          
          <ContactButton
            icon={<Mail className="w-5 h-5" />}
            label="Email"
            value={lead.email}
            href={lead.email ? `mailto:${lead.email}` : undefined}
            field="email"
          />
          
          <ContactButton
            icon={<Phone className="w-5 h-5" />}
            label={language === 'pt-BR' ? 'Telefone' : 'Phone'}
            value={lead.phone}
            href={lead.phone ? `tel:${lead.phone}` : undefined}
            field="phone"
          />
          
          <ContactButton
            icon={<MessageCircle className="w-5 h-5" />}
            label="WhatsApp"
            value={lead.whatsapp}
            href={lead.whatsapp ? `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}` : undefined}
            field="whatsapp"
          />
        </div>

        {/* Sources */}
        {lead.sources && lead.sources.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
                {language === 'pt-BR' ? 'Fontes' : 'Sources'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {lead.sources.map((source, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3" />
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Competitor Badge */}
        {lead.isCompetitor && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <Building className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {language === 'pt-BR' ? 'Este lead é um concorrente' : 'This lead is a competitor'}
              </span>
            </div>
          </>
        )}

        {/* Created At */}
        {lead.createdAt && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {language === 'pt-BR' ? 'Adicionado em:' : 'Added on:'}{' '}
                {new Date(lead.createdAt).toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : 'en-US', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          {lead.email && (
            <Button variant="gradient" className="flex-1 gap-2" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="w-4 h-4" />
                {language === 'pt-BR' ? 'Enviar Email' : 'Send Email'}
              </a>
            </Button>
          )}
          {lead.whatsapp && (
            <Button variant="secondary" className="flex-1 gap-2" asChild>
              <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </Button>
          )}
          {lead.phone && !lead.email && !lead.whatsapp && (
            <Button variant="gradient" className="flex-1 gap-2" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="w-4 h-4" />
                {language === 'pt-BR' ? 'Ligar' : 'Call'}
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
