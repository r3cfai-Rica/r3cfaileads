import React, { useState, useEffect, useCallback } from 'react';
import { useApp, MessageLog, CTA } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Send,
  MessageCircle,
  Mail,
  Smartphone,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Users,
  Clock,
  Sparkles,
  Wand2,
  Copy,
  RefreshCw,
  Image as ImageIcon,
  BotMessageSquare,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateEmailWithAI, GeneratedEmail } from '@/lib/ai-api';
import { supabase } from '@/integrations/supabase/client';
import { useCTAs } from '@/hooks/useCTAs';
import { CTAEditDialog } from '@/components/messaging/CTAEditDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MESSAGING_STORAGE_KEY = 'messaging_compose_state';

interface MessagingState {
  selectedFolderId: string;
  selectedLeadIds: string[];
  channel: 'whatsapp' | 'sms' | 'email' | 'telegram';
  message: string;
  senderName: string;
  senderCompany: string;
  emailTone: 'formal' | 'casual' | 'persuasive' | 'friendly';
  selectedCTAId: string;
}

export const Messaging: React.FC = () => {
  const { t, leads, folders, messageLogs, setMessageLogs, language } = useApp();
  const { ctas, updateCTA, deleteCTA } = useCTAs();
  const { toast } = useToast();
  
  // Load persisted state
  const loadPersistedState = useCallback((): MessagingState | null => {
    try {
      const saved = sessionStorage.getItem(MESSAGING_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading messaging state:', e);
    }
    return null;
  }, []);

  const persistedState = loadPersistedState();

  const [selectedFolderId, setSelectedFolderId] = useState<string>(persistedState?.selectedFolderId || '');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set(persistedState?.selectedLeadIds || []));
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email' | 'telegram'>(persistedState?.channel || 'email');
  const [message, setMessage] = useState(persistedState?.message || '');
  const [isSending, setIsSending] = useState(false);
  
  // AI Email Generation States
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [senderName, setSenderName] = useState(persistedState?.senderName || '');
  const [senderCompany, setSenderCompany] = useState(persistedState?.senderCompany || '');
  const [emailTone, setEmailTone] = useState<'formal' | 'casual' | 'persuasive' | 'friendly'>(persistedState?.emailTone || 'persuasive');
  const [selectedCTAId, setSelectedCTAId] = useState<string>(persistedState?.selectedCTAId || '');
  
  // CTA Edit/Delete States
  const [editingCTA, setEditingCTA] = useState<CTA | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingCTAId, setDeletingCTAId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Email Preview Edit States
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedGreeting, setEditedGreeting] = useState('');
  const [editedSignature, setEditedSignature] = useState('');
  
  // WhatsApp provider detection
  const [whatsappProvider, setWhatsappProvider] = useState<'meta' | 'evolution'>('meta');

  // Persist state to sessionStorage
  useEffect(() => {
    const stateToSave: MessagingState = {
      selectedFolderId,
      selectedLeadIds: Array.from(selectedLeadIds),
      channel,
      message,
      senderName,
      senderCompany,
      emailTone,
      selectedCTAId,
    };
    sessionStorage.setItem(MESSAGING_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [selectedFolderId, selectedLeadIds, channel, message, senderName, senderCompany, emailTone, selectedCTAId]);

  // Clear compose state
  const handleClearCompose = useCallback(() => {
    setMessage('');
    setSelectedLeadIds(new Set());
    setGeneratedEmail(null);
    setSelectedCTAId('');
    sessionStorage.removeItem(MESSAGING_STORAGE_KEY);
  }, []);

  // Load user's WhatsApp provider preference
  useEffect(() => {
    const loadWhatsAppProvider = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('user_messaging_credentials')
          .select('metadata')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.metadata && typeof data.metadata === 'object') {
          const metadata = data.metadata as Record<string, unknown>;
          if (metadata.whatsapp_provider === 'evolution') {
            setWhatsappProvider('evolution');
          }
        }
      } catch (error) {
        console.error('Error loading WhatsApp provider:', error);
      }
    };

    loadWhatsAppProvider();
  }, []);

  const folderLeads = leads.filter(l => l.folderId === selectedFolderId);
  const eligibleLeads = folderLeads.filter(l => {
    if (channel === 'whatsapp') return !!l.whatsapp;
    if (channel === 'sms') return !!l.phone;
    if (channel === 'email') return !!l.email;
    if (channel === 'telegram') return !!(l as any).telegram;
    return false;
  });

  const folderCTAs = ctas.filter(c => c.folderId === selectedFolderId);
  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const selectedCTA = folderCTAs.find(c => c.id === selectedCTAId);

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeadIds);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeadIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.size === eligibleLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(eligibleLeads.map(l => l.id)));
    }
  };

  const handleUseCTA = (text: string) => {
    setMessage(text);
  };

  const handleEditCTA = (cta: CTA, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCTA(cta);
    setIsEditDialogOpen(true);
  };

  const handleSaveCTAEdit = async (ctaId: string, updates: { title: string; text: string }) => {
    return await updateCTA(ctaId, updates);
  };

  const handleDeleteCTAClick = (ctaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCTAId(ctaId);
  };

  const handleConfirmDeleteCTA = async () => {
    if (!deletingCTAId) return;
    
    setIsDeleting(true);
    await deleteCTA(deletingCTAId);
    setIsDeleting(false);
    setDeletingCTAId(null);
  };

  const handleGenerateEmail = async () => {
    const pt = language === 'pt-BR';
    if (!selectedFolderId || selectedLeadIds.size === 0) {
      toast({
        title: pt ? "Selecione um lead" : "Select a lead",
        description: pt ? "Escolha pelo menos um lead para gerar o email personalizado" : "Choose at least one lead to generate a personalized email",
        variant: "destructive",
      });
      return;
    }

    if (!senderName || !senderCompany) {
      toast({
        title: pt ? "Dados do remetente" : "Sender info",
        description: pt ? "Preencha seu nome e empresa para gerar o email" : "Fill in your name and company to generate the email",
        variant: "destructive",
      });
      return;
    }

    const firstLeadId = Array.from(selectedLeadIds)[0];
    const lead = leads.find(l => l.id === firstLeadId);
    
    if (!lead) return;

    setIsGeneratingEmail(true);

    try {
      // IMPORTANT: Use lead.location or position-derived company, never lead's first name
      // If no company info available, leave undefined to let AI handle it appropriately
      const derivedCompany = lead.location && lead.location.length > 2 
        ? undefined // Don't guess - let AI create generic phrasing
        : undefined;
      
      const email = await generateEmailWithAI({
        niche: selectedFolder?.name || 'Produtos/Serviços',
        leadName: lead.name,
        leadPosition: lead.position,
        leadCompany: derivedCompany, // Never use lead name as company
        cta: selectedCTA ? { title: selectedCTA.title, text: selectedCTA.text } : undefined,
        senderName,
        senderCompany,
        tone: emailTone,
        language,
      });

      setGeneratedEmail(email);
      
      // Set the message with the full email content
      const fullEmail = `${email.greeting}\n\n${email.body.replace(/<[^>]*>/g, '')}\n\n${email.signature.replace(/<[^>]*>/g, '')}`;
      setMessage(fullEmail);

      toast({
        title: pt ? "Email gerado com sucesso! ✨" : "Email generated! ✨",
        description: pt ? "O email está pronto para envio. Revise e clique em Enviar." : "The email is ready. Review and click Send.",
      });
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: pt ? "Erro ao gerar email" : "Error generating email",
        description: error instanceof Error ? error.message : (pt ? "Tente novamente mais tarde" : "Try again later"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    if (generatedEmail) {
      const fullEmail = `${language === 'pt-BR' ? 'Assunto' : 'Subject'}: ${generatedEmail.subject}\n\n${generatedEmail.greeting}\n\n${generatedEmail.body.replace(/<[^>]*>/g, '')}\n\n${generatedEmail.signature.replace(/<[^>]*>/g, '')}`;
      navigator.clipboard.writeText(fullEmail);
      toast({
        title: language === 'pt-BR' ? "Email copiado!" : "Email copied!",
        description: language === 'pt-BR' ? "O email foi copiado para a área de transferência" : "Email copied to clipboard",
      });
    }
  };

  // Build HTML email with optional CTA image
  const buildEmailHtml = (leadName: string) => {
    if (!generatedEmail) return '';
    
    const personalizedGreeting = generatedEmail.greeting.replace(
      /Olá,? ?[A-Za-zÀ-ÖØ-öø-ÿ]+/gi,
      `Olá, ${leadName.split(' ')[0]}`
    ).replace(
      /Hi,? ?[A-Za-zÀ-ÖØ-öø-ÿ]+/gi,
      `Hi, ${leadName.split(' ')[0]}`
    );
    
    let imageHtml = '';
    if (selectedCTA?.imageUrl) {
      imageHtml = `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${selectedCTA.imageUrl}" alt="${selectedCTA.title}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
        </div>
      `;
    }
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 16px; line-height: 1.6;">${personalizedGreeting}</p>
        <div style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
          ${generatedEmail.body}
        </div>
        ${imageHtml}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          ${generatedEmail.signature}
        </div>
      </div>
    `;
  };

  const handleSend = async () => {
    if (selectedLeadIds.size === 0) return;
    
    if (channel === 'email' && !generatedEmail && !message.trim()) {
      toast({
        title: language === 'pt-BR' ? 'Erro' : 'Error',
        description: language === 'pt-BR' ? 'Gere um email ou escreva uma mensagem' : 'Generate an email or write a message',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSending(true);
    
    const newLogs: MessageLog[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const leadId of Array.from(selectedLeadIds)) {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) continue;

      try {
        if (channel === 'email' && lead.email) {
          const htmlContent = generatedEmail ? buildEmailHtml(lead.name) : `<p>${message}</p>`;
          const subject = generatedEmail?.subject || (language === 'pt-BR' ? 'Proposta Comercial' : 'Business Proposal');
          
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
              to: lead.email,
              subject,
              html: htmlContent,
              leadId: lead.id,
              leadName: lead.name,
            },
          });

          if (error || !data?.success) {
            throw new Error(error?.message || data?.error || 'Failed to send email');
          }

          newLogs.push({
            id: `log-${Date.now()}-${leadId}`,
            leadId,
            leadName: lead.name,
            channel: 'email',
            message: `Assunto: ${subject}`,
            status: 'sent',
            sentAt: new Date(),
          });
          successCount++;
        } else if (channel === 'whatsapp' && lead.whatsapp) {
          // Include CTA image URL in WhatsApp message if available
          let whatsappMessage = message.trim();
          if (selectedCTA?.imageUrl) {
            whatsappMessage = `${whatsappMessage}\n\n📷 ${selectedCTA.imageUrl}`;
          }
          
          // Route to correct WhatsApp provider
          const functionName = whatsappProvider === 'evolution' 
            ? 'send-whatsapp-evolution' 
            : 'send-whatsapp';
          
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: {
              to: lead.whatsapp,
              message: whatsappMessage,
              leadId: lead.id,
              leadName: lead.name,
              imageUrl: selectedCTA?.imageUrl,
            },
          });

          if (error || !data?.success) {
            throw new Error(error?.message || data?.error || 'Failed to send WhatsApp');
          }

          newLogs.push({
            id: `log-${Date.now()}-${leadId}`,
            leadId,
            leadName: lead.name,
            channel: 'whatsapp',
            message: whatsappMessage,
            status: 'sent',
            sentAt: new Date(),
          });
          successCount++;
        } else if (channel === 'sms' && lead.phone) {
          // Include CTA image URL in SMS message if available
          let smsMessage = message.trim();
          if (selectedCTA?.imageUrl) {
            smsMessage = `${smsMessage}\n\n${selectedCTA.imageUrl}`;
          }
          
          const { data, error } = await supabase.functions.invoke('send-sms', {
            body: {
              to: lead.phone,
              message: smsMessage,
              leadId: lead.id,
              leadName: lead.name,
            },
          });

          if (error || !data?.success) {
            throw new Error(error?.message || data?.error || 'Failed to send SMS');
          }

          newLogs.push({
            id: `log-${Date.now()}-${leadId}`,
            leadId,
            leadName: lead.name,
            channel: 'sms',
            message: smsMessage,
            status: 'sent',
            sentAt: new Date(),
          });
          successCount++;
        } else if (channel === 'telegram' && (lead as any).telegram) {
          // Send Telegram message
          let telegramMessage = message.trim();
          if (selectedCTA?.imageUrl) {
            telegramMessage = `${telegramMessage}\n\n📷 ${selectedCTA.imageUrl}`;
          }
          
          const { data, error } = await supabase.functions.invoke('send-telegram', {
            body: {
              chatId: (lead as any).telegram,
              message: telegramMessage,
              leadId: lead.id,
              leadName: lead.name,
              imageUrl: selectedCTA?.imageUrl,
            },
          });

          if (error || !data?.success) {
            throw new Error(error?.message || data?.error || 'Failed to send Telegram');
          }

          newLogs.push({
            id: `log-${Date.now()}-${leadId}`,
            leadId,
            leadName: lead.name,
            channel: 'telegram',
            message: telegramMessage,
            status: 'sent',
            sentAt: new Date(),
          });
          successCount++;
        }
      } catch (error) {
        console.error(`Error sending to ${lead.name}:`, error);
        newLogs.push({
          id: `log-${Date.now()}-${leadId}`,
          leadId,
          leadName: lead.name,
          channel,
          message: generatedEmail?.subject || message,
          status: 'failed',
          sentAt: new Date(),
        });
        failCount++;
      }
    }
    
    setMessageLogs([...messageLogs, ...newLogs]);
    setIsSending(false);
    setSelectedLeadIds(new Set());
    setMessage('');
    setGeneratedEmail(null);

    if (successCount > 0) {
      toast({
        title: language === 'pt-BR' ? 'Mensagens enviadas!' : 'Messages sent!',
        description: language === 'pt-BR' 
          ? `${successCount} mensagem(ns) enviada(s) com sucesso${failCount > 0 ? `, ${failCount} falha(s)` : ''}`
          : `${successCount} message(s) sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
    } else {
      toast({
        title: language === 'pt-BR' ? 'Erro ao enviar' : 'Send failed',
        description: language === 'pt-BR' ? 'Nenhuma mensagem foi enviada' : 'No messages were sent',
        variant: 'destructive',
      });
    }
  };

  const channelIcon = {
    whatsapp: MessageCircle,
    sms: Smartphone,
    email: Mail,
    telegram: BotMessageSquare,
  };

  const statusIcon = {
    sent: CheckCircle2,
    failed: XCircle,
    replied: MessageSquare,
  };

  const statusVariant = {
    sent: 'success' as const,
    failed: 'destructive' as const,
    replied: 'info' as const,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Send className="w-5 h-5 text-primary-foreground" />
            </div>
            {t.messaging.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.messaging.subtitle}</p>
        </div>
        {(message || selectedLeadIds.size > 0 || generatedEmail) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCompose}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            {language === 'pt-BR' ? 'Limpar' : 'Clear'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Sparkles className="w-4 h-4" />
            {language === 'pt-BR' ? 'Email com IA' : 'AI Email'}
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Send className="w-4 h-4" />
            {language === 'pt-BR' ? 'Compor Manual' : 'Manual Compose'}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" />
            {t.messaging.history}
          </TabsTrigger>
        </TabsList>

        {/* AI Email Generation Tab */}
        <TabsContent value="compose" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* AI Email Generator Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Step 1: Select Niche and Lead */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                     <div>
                       <CardTitle className="text-lg">{language === 'pt-BR' ? 'Selecione o Nicho e Lead' : 'Select Niche and Lead'}</CardTitle>
                       <CardDescription>{language === 'pt-BR' ? 'Escolha para quem você quer enviar' : 'Choose who you want to send to'}</CardDescription>
                     </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{language === 'pt-BR' ? 'Nicho' : 'Niche'}</label>
                      <Select value={selectedFolderId} onValueChange={(v) => {
                        setSelectedFolderId(v);
                        setSelectedLeadIds(new Set());
                        setSelectedCTAId('');
                        setGeneratedEmail(null);
                      }}>
                        <SelectTrigger>
                           <SelectValue placeholder={language === 'pt-BR' ? 'Escolha um nicho' : 'Choose a niche'} />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map(folder => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{language === 'pt-BR' ? 'CTA Base (opcional)' : 'Base CTA (optional)'}</label>
                      <Select value={selectedCTAId} onValueChange={(v) => setSelectedCTAId(v === 'auto' ? '' : v)}>
                        <SelectTrigger>
                           <SelectValue placeholder={language === 'pt-BR' ? 'Usar CTA existente' : 'Use existing CTA'} />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="auto">{language === 'pt-BR' ? 'Gerar CTA automático' : 'Auto-generate CTA'}</SelectItem>
                          {folderCTAs.map(cta => (
                            <SelectItem key={cta.id} value={cta.id}>
                              {cta.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedFolderId && eligibleLeads.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <label className="text-sm font-medium">{language === 'pt-BR' ? `Leads com email (${eligibleLeads.length})` : `Leads with email (${eligibleLeads.length})`}</label>
                         <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                           {selectedLeadIds.size === eligibleLeads.length ? (language === 'pt-BR' ? 'Desmarcar todos' : 'Deselect all') : (language === 'pt-BR' ? 'Selecionar todos' : 'Select all')}
                         </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {eligibleLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                              selectedLeadIds.has(lead.id) ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleSelectLead(lead.id)}
                          >
                            <Checkbox
                              checked={selectedLeadIds.has(lead.id)}
                              onCheckedChange={() => handleSelectLead(lead.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{lead.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Sender Info and Tone */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                       <CardTitle className="text-lg">{language === 'pt-BR' ? 'Seus Dados e Tom' : 'Your Info & Tone'}</CardTitle>
                       <CardDescription>{language === 'pt-BR' ? 'Configure como você quer se apresentar' : 'Set up how you want to present yourself'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{language === 'pt-BR' ? 'Seu Nome' : 'Your Name'}</label>
                      <Input 
                        value={senderName} 
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="João Silva"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{language === 'pt-BR' ? 'Sua Empresa' : 'Your Company'}</label>
                      <Input 
                        value={senderCompany} 
                        onChange={(e) => setSenderCompany(e.target.value)}
                        placeholder="LeadFlow Solutions"
                      />
                    </div>
                  </div>
                  <div>
                     <label className="text-sm font-medium mb-2 block">{language === 'pt-BR' ? 'Tom da Mensagem' : 'Message Tone'}</label>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                       {(language === 'pt-BR' ? [
                         { value: 'formal', label: '🎩 Formal', desc: 'Corporativo' },
                         { value: 'casual', label: '😊 Casual', desc: 'Descontraído' },
                         { value: 'persuasive', label: '🎯 Persuasivo', desc: 'Gatilhos mentais' },
                         { value: 'friendly', label: '🤝 Amigável', desc: 'Empático' },
                       ] : [
                         { value: 'formal', label: '🎩 Formal', desc: 'Corporate' },
                         { value: 'casual', label: '😊 Casual', desc: 'Relaxed' },
                         { value: 'persuasive', label: '🎯 Persuasive', desc: 'Mental triggers' },
                         { value: 'friendly', label: '🤝 Friendly', desc: 'Empathetic' },
                       ]).map((tone) => (
                        <Button
                          key={tone.value}
                          variant={emailTone === tone.value ? 'default' : 'outline'}
                          className="h-auto flex-col py-3"
                          onClick={() => setEmailTone(tone.value as any)}
                        >
                          <span className="text-lg">{tone.label.split(' ')[0]}</span>
                          <span className="text-xs">{tone.label.split(' ')[1]}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Generate and Preview */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                         <CardTitle className="text-lg">{language === 'pt-BR' ? 'Gerar Email com IA' : 'Generate Email with AI'}</CardTitle>
                         <CardDescription>{language === 'pt-BR' ? 'A IA criará um email personalizado e persuasivo' : 'AI will create a personalized and persuasive email'}</CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="gradient" 
                      onClick={handleGenerateEmail}
                      disabled={isGeneratingEmail || selectedLeadIds.size === 0 || !senderName || !senderCompany}
                    >
                       {isGeneratingEmail ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin" />
                           {language === 'pt-BR' ? 'Gerando...' : 'Generating...'}
                         </>
                       ) : (
                         <>
                           <Wand2 className="w-4 h-4" />
                           {language === 'pt-BR' ? 'Gerar Email' : 'Generate Email'}
                         </>
                       )}
                     </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedEmail ? (
                    <div className="space-y-4">
                      {/* Selected Leads Preview - Shows personalization for each lead */}
                      {selectedLeadIds.size > 1 && (
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-5 h-5 text-primary" />
                            <p className="font-medium text-primary">
                              {language === 'pt-BR' ? 'Emails personalizados para cada lead:' : 'Personalized emails for each lead:'}
                            </p>
                          </div>
                          <div className="grid gap-2 max-h-40 overflow-y-auto">
                            {Array.from(selectedLeadIds).map((leadId) => {
                              const lead = leads.find(l => l.id === leadId);
                              if (!lead) return null;
                              
                              // Personalize subject and greeting for each lead
                              const personalizedSubject = generatedEmail.subject.replace(
                                /para a? ?[A-Za-zÀ-ÖØ-öø-ÿ]+/gi,
                                `para ${lead.name.split(' ')[0]}`
                              ).replace(
                                /for [A-Za-zÀ-ÖØ-öø-ÿ]+/gi,
                                `for ${lead.name.split(' ')[0]}`
                              );
                              
                              return (
                                <div 
                                  key={leadId} 
                                  className="flex items-center gap-3 bg-background rounded-lg p-3 border"
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                                    {lead.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{lead.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {language === 'pt-BR' ? 'Assunto:' : 'Subject:'} {personalizedSubject}
                                    </p>
                                    <p className="text-xs text-primary truncate">
                                      {language === 'pt-BR' ? 'Olá,' : 'Hi,'} {lead.name.split(' ')[0]}...
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                                    {language === 'pt-BR' ? 'Personalizado' : 'Personalized'}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground mt-3 text-center">
                            {language === 'pt-BR' 
                              ? '✨ Cada email será enviado com o nome do respectivo lead'
                              : '✨ Each email will be sent with the respective lead\'s name'}
                          </p>
                        </div>
                      )}

                      {/* Email Preview */}
                      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedLeadIds.size > 1 
                              ? (language === 'pt-BR' ? 'Modelo Base do Email' : 'Base Email Template')
                              : (language === 'pt-BR' ? 'Preview do Email' : 'Email Preview')}
                          </Badge>
                          <div className="flex gap-2">
                            {!isEditingEmail ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setIsEditingEmail(true);
                                  setEditedSubject(generatedEmail.subject);
                                  setEditedGreeting(generatedEmail.greeting);
                                  setEditedBody(generatedEmail.body.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?strong>/gi, '**'));
                                  setEditedSignature(generatedEmail.signature.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?strong>/gi, '**'));
                                }}
                                title={language === 'pt-BR' ? 'Editar email' : 'Edit email'}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    // Save the edited email
                                    setGeneratedEmail({
                                      ...generatedEmail,
                                      subject: editedSubject,
                                      greeting: editedGreeting,
                                      body: editedBody.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                                      signature: editedSignature.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                                    });
                                    setIsEditingEmail(false);
                                    toast({
                                      title: language === 'pt-BR' ? 'Email atualizado!' : 'Email updated!',
                                      description: language === 'pt-BR' ? 'Suas alterações foram salvas.' : 'Your changes have been saved.',
                                    });
                                  }}
                                  className="text-primary hover:text-primary"
                                  title={language === 'pt-BR' ? 'Salvar alterações' : 'Save changes'}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setIsEditingEmail(false)}
                                  className="text-destructive hover:text-destructive"
                                  title={language === 'pt-BR' ? 'Cancelar edição' : 'Cancel editing'}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" onClick={handleCopyEmail}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleGenerateEmail}>
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-background rounded-lg p-4 border space-y-3">
                          {isEditingEmail ? (
                            <>
                              {/* Editable Subject */}
                              <div className="border-b pb-2">
                                <p className="text-xs text-muted-foreground mb-1">{language === 'pt-BR' ? 'Assunto:' : 'Subject:'}</p>
                                <Input
                                  value={editedSubject}
                                  onChange={(e) => setEditedSubject(e.target.value)}
                                  className="font-semibold"
                                  placeholder={language === 'pt-BR' ? 'Digite o assunto do email' : 'Enter email subject'}
                                />
                              </div>
                              {/* Editable Greeting */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">{language === 'pt-BR' ? 'Saudação:' : 'Greeting:'}</p>
                                <Input
                                  value={editedGreeting}
                                  onChange={(e) => setEditedGreeting(e.target.value)}
                                  className="font-medium"
                                  placeholder={language === 'pt-BR' ? 'Ex: Olá, João!' : 'Ex: Hello, John!'}
                                />
                              </div>
                              {/* Editable Body */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">{language === 'pt-BR' ? 'Corpo do email:' : 'Email body:'}</p>
                                <Textarea
                                  value={editedBody}
                                  onChange={(e) => setEditedBody(e.target.value)}
                                  className="min-h-[200px] text-sm"
                                  placeholder={language === 'pt-BR' ? 'Digite o corpo do email...' : 'Enter email body...'}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {language === 'pt-BR' ? 'Use **texto** para negrito' : 'Use **text** for bold'}
                                </p>
                              </div>
                              {/* Editable Signature */}
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">{language === 'pt-BR' ? 'Assinatura:' : 'Signature:'}</p>
                                <Textarea
                                  value={editedSignature}
                                  onChange={(e) => setEditedSignature(e.target.value)}
                                  className="min-h-[60px] text-sm"
                                  placeholder={language === 'pt-BR' ? 'Ex: Atenciosamente, João' : 'Ex: Best regards, John'}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="border-b pb-2">
                                <p className="text-xs text-muted-foreground">{language === 'pt-BR' ? 'Assunto:' : 'Subject:'}</p>
                                <p className="font-semibold">{generatedEmail.subject}</p>
                              </div>
                              <div>
                                <p className="font-medium">{generatedEmail.greeting}</p>
                              </div>
                              <div 
                                className="prose prose-sm max-w-none text-foreground"
                                dangerouslySetInnerHTML={{ __html: generatedEmail.body }}
                              />
                              
                              {/* CTA Image Preview */}
                              {selectedCTA?.imageUrl && (
                                <div className="py-4">
                                  <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>{language === 'pt-BR' ? 'Imagem do CTA incluída no email:' : 'CTA image included in email:'}</span>
                                  </div>
                                  <img 
                                    src={selectedCTA.imageUrl} 
                                    alt={selectedCTA.title}
                                    className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                                    style={{ maxHeight: '200px' }}
                                  />
                                </div>
                              )}
                              
                              <div 
                                className="pt-2 border-t text-sm"
                                dangerouslySetInnerHTML={{ __html: generatedEmail.signature }}
                              />
                            </>
                          )}
                        </div>
                        
                        {selectedLeadIds.size > 1 && (
                          <p className="text-xs text-center text-muted-foreground">
                            {language === 'pt-BR' 
                              ? 'Os nomes destacados acima serão substituídos pelo nome de cada lead'
                              : 'The highlighted names above will be replaced with each lead\'s name'}
                          </p>
                        )}
                      </div>

                      {/* Send Button */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          <Users className="w-4 h-4 inline mr-1" />
                          {selectedLeadIds.size} {language === 'pt-BR' ? 'destinatário(s) selecionado(s)' : 'recipient(s) selected'}
                        </p>
                        <Button
                          variant="gradient"
                          size="lg"
                          onClick={handleSend}
                          disabled={isSending || selectedLeadIds.size === 0}
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {language === 'pt-BR' ? 'Enviando...' : 'Sending...'}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              {language === 'pt-BR' ? `Enviar para ${selectedLeadIds.size} Lead(s)` : `Send to ${selectedLeadIds.size} Lead(s)`}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{language === 'pt-BR' ? 'Preencha os campos acima e clique em "Gerar Email"' : 'Fill in the fields above and click "Generate Email"'}</p>
                      <p className="text-sm mt-1">{language === 'pt-BR' ? 'A IA criará um email completo e persuasivo para você' : 'AI will create a complete and persuasive email for you'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tips Panel */}
            <div className="space-y-4">
               <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                 <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-primary" />
                     {language === 'pt-BR' ? 'Dicas de IA' : 'AI Tips'}
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3 text-sm">
                   <div className="flex gap-2">
                     <span className="text-primary">✓</span>
                     <p>{language === 'pt-BR' ? 'Selecione um CTA existente para emails ainda mais direcionados' : 'Select an existing CTA for more targeted emails'}</p>
                   </div>
                   <div className="flex gap-2">
                     <span className="text-primary">✓</span>
                     <p>{language === 'pt-BR' ? 'O tom "Persuasivo" usa gatilhos mentais como escassez e urgência' : 'The "Persuasive" tone uses mental triggers like scarcity and urgency'}</p>
                   </div>
                   <div className="flex gap-2">
                     <span className="text-primary">✓</span>
                     <p>{language === 'pt-BR' ? 'Cada email é personalizado com o nome e cargo do lead' : 'Each email is personalized with the lead\'s name and position'}</p>
                   </div>
                   <div className="flex gap-2">
                     <span className="text-primary">✓</span>
                     <p>{language === 'pt-BR' ? 'Clique em ↻ para gerar uma nova versão do email' : 'Click ↻ to generate a new version of the email'}</p>
                   </div>
                 </CardContent>
               </Card>

              {/* Quick Stats */}
              {selectedFolderId && (
                <Card>
                   <CardHeader className="pb-2">
                     <CardTitle className="text-sm">{language === 'pt-BR' ? 'Estatísticas do Nicho' : 'Niche Stats'}</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">{language === 'pt-BR' ? 'Leads com email' : 'Leads with email'}</span>
                       <span className="font-medium">{eligibleLeads.length}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">{language === 'pt-BR' ? 'CTAs salvos' : 'Saved CTAs'}</span>
                       <span className="font-medium">{folderCTAs.length}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">{language === 'pt-BR' ? 'Selecionados' : 'Selected'}</span>
                       <span className="font-medium text-primary">{selectedLeadIds.size}</span>
                     </div>
                   </CardContent>
                 </Card>
               )}

              {/* Saved CTAs Panel for AI Email Tab */}
              {selectedFolderId && folderCTAs.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {language === 'pt-BR' ? 'Gerenciar CTAs' : 'Manage CTAs'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {language === 'pt-BR' 
                        ? 'Edite ou exclua CTAs salvos' 
                        : 'Edit or delete saved CTAs'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                    {folderCTAs.map((cta) => (
                      <div
                        key={cta.id}
                        className={`group p-2 rounded-lg border transition-colors ${
                          selectedCTAId === cta.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setSelectedCTAId(cta.id)}
                          >
                            <h4 className="font-medium text-xs mb-0.5 truncate">{cta.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">{cta.text}</p>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handleEditCTA(cta, e)}
                              title={language === 'pt-BR' ? 'Editar CTA' : 'Edit CTA'}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteCTAClick(cta.id, e)}
                              title={language === 'pt-BR' ? 'Excluir CTA' : 'Delete CTA'}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Manual Compose Tab */}
        <TabsContent value="manual" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Compose Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Folder & Channel Selection */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{language === 'pt-BR' ? 'Selecionar Nicho' : 'Select Niche'}</label>
                      <Select value={selectedFolderId} onValueChange={(v) => {
                        setSelectedFolderId(v);
                        setSelectedLeadIds(new Set());
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'pt-BR' ? 'Escolha um nicho' : 'Choose a niche'} />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map(folder => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t.messaging.selectChannel}</label>
                      <Select value={channel} onValueChange={(v: any) => {
                        setChannel(v);
                        setSelectedLeadIds(new Set());
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-success" />
                              {t.messaging.whatsapp}
                            </div>
                          </SelectItem>
                          <SelectItem value="sms">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-info" />
                              {t.messaging.sms}
                            </div>
                          </SelectItem>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-warning" />
                              {t.messaging.email}
                            </div>
                          </SelectItem>
                          <SelectItem value="telegram">
                            <div className="flex items-center gap-2">
                              <BotMessageSquare className="w-4 h-4 text-[#0088cc]" />
                              {t.messaging.telegram}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Selection */}
              {selectedFolderId && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{t.messaging.selectLeads}</CardTitle>
                        <CardDescription>
                          {eligibleLeads.length} {language === 'pt-BR' ? `leads com ${channel} disponível` : `leads with ${channel} available`}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        {selectedLeadIds.size === eligibleLeads.length ? t.common.deselectAll : t.common.selectAll}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {eligibleLeads.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {eligibleLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              selectedLeadIds.has(lead.id) ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={selectedLeadIds.has(lead.id)}
                              onCheckedChange={() => handleSelectLead(lead.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{lead.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{lead.position}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {channel === 'whatsapp' && lead.whatsapp}
                              {channel === 'sms' && lead.phone}
                              {channel === 'email' && lead.email}
                              {channel === 'telegram' && (lead as any).telegram}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>{language === 'pt-BR' ? `Nenhum lead com ${channel} disponível neste nicho` : `No leads with ${channel} available in this niche`}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Message Composer */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.messaging.message}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={language === 'pt-BR' ? 'Digite sua mensagem...' : 'Type your message...'}
                    className="min-h-[150px]"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {message.length} {language === 'pt-BR' ? 'caracteres' : 'chars'} • {selectedLeadIds.size} {language === 'pt-BR' ? 'destinatário(s)' : 'recipient(s)'}
                    </p>
                    <Button
                      variant="gradient"
                      onClick={handleSend}
                      disabled={isSending || selectedLeadIds.size === 0 || !message.trim()}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t.messaging.sending}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t.messaging.send}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTAs Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'pt-BR' ? 'CTAs Salvos' : 'Saved CTAs'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'pt-BR' 
                      ? 'Clique para usar como mensagem. Use os ícones para editar ou excluir.' 
                      : 'Click to use as message. Use icons to edit or delete.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {folderCTAs.length > 0 ? (
                    <div className="space-y-3">
                      {folderCTAs.map((cta) => (
                        <div
                          key={cta.id}
                          className="group p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors relative"
                          onClick={() => handleUseCTA(cta.text)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1">{cta.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">{cta.text}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => handleEditCTA(cta, e)}
                                title={language === 'pt-BR' ? 'Editar CTA' : 'Edit CTA'}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={(e) => handleDeleteCTAClick(cta.id, e)}
                                title={language === 'pt-BR' ? 'Excluir CTA' : 'Delete CTA'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {cta.imageUrl && (
                            <div className="mt-2">
                              <img 
                                src={cta.imageUrl} 
                                alt={cta.title}
                                className="w-full h-16 object-cover rounded border opacity-70"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {language === 'pt-BR' ? 'Nenhum CTA salvo' : 'No saved CTAs'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t.messaging.history}</CardTitle>
              <CardDescription>{language === 'pt-BR' ? 'Últimas mensagens enviadas' : 'Latest messages sent'}</CardDescription>
            </CardHeader>
            <CardContent>
              {messageLogs.length > 0 ? (
                <div className="space-y-3">
                  {messageLogs.slice().reverse().map((log) => {
                    const ChannelIcon = channelIcon[log.channel];
                    const StatusIcon = statusIcon[log.status];
                    return (
                      <div key={log.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <ChannelIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{log.leadName}</p>
                            <Badge variant={statusVariant[log.status]} className="gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {t.messaging[log.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{log.message}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.sentAt).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{language === 'pt-BR' ? 'Nenhuma mensagem enviada ainda' : 'No messages sent yet'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA Edit Dialog */}
      <CTAEditDialog
        cta={editingCTA}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveCTAEdit}
        language={language}
      />

      {/* CTA Delete Confirmation */}
      <AlertDialog open={!!deletingCTAId} onOpenChange={(open) => !open && setDeletingCTAId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'pt-BR' ? 'Excluir CTA?' : 'Delete CTA?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'pt-BR' 
                ? 'Esta ação não pode ser desfeita. O CTA será permanentemente removido.' 
                : 'This action cannot be undone. The CTA will be permanently removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteCTA}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'pt-BR' ? 'Excluindo...' : 'Deleting...'}
                </>
              ) : (
                language === 'pt-BR' ? 'Excluir' : 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Messaging;
