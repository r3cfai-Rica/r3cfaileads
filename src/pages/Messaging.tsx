import React, { useState } from 'react';
import { useApp, MessageLog } from '@/contexts/AppContext';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateEmailWithAI, GeneratedEmail } from '@/lib/ai-api';
import { supabase } from '@/integrations/supabase/client';
import { useCTAs } from '@/hooks/useCTAs';

export const Messaging: React.FC = () => {
  const { t, leads, folders, messageLogs, setMessageLogs, language } = useApp();
  const { ctas } = useCTAs();
  const { toast } = useToast();
  
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('email');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // AI Email Generation States
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderCompany, setSenderCompany] = useState('');
  const [emailTone, setEmailTone] = useState<'formal' | 'casual' | 'persuasive' | 'friendly'>('persuasive');
  const [selectedCTAId, setSelectedCTAId] = useState<string>('');

  const folderLeads = leads.filter(l => l.folderId === selectedFolderId);
  const eligibleLeads = folderLeads.filter(l => {
    if (channel === 'whatsapp') return !!l.whatsapp;
    if (channel === 'sms') return !!l.phone;
    if (channel === 'email') return !!l.email;
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

  const handleGenerateEmail = async () => {
    if (!selectedFolderId || selectedLeadIds.size === 0) {
      toast({
        title: "Selecione um lead",
        description: "Escolha pelo menos um lead para gerar o email personalizado",
        variant: "destructive",
      });
      return;
    }

    if (!senderName || !senderCompany) {
      toast({
        title: "Dados do remetente",
        description: "Preencha seu nome e empresa para gerar o email",
        variant: "destructive",
      });
      return;
    }

    const firstLeadId = Array.from(selectedLeadIds)[0];
    const lead = leads.find(l => l.id === firstLeadId);
    
    if (!lead) return;

    setIsGeneratingEmail(true);

    try {
      const email = await generateEmailWithAI({
        niche: selectedFolder?.name || 'Produtos/Serviços',
        leadName: lead.name,
        leadPosition: lead.position,
        leadCompany: lead.name.split(' ')[0],
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
        title: "Email gerado com sucesso! ✨",
        description: "O email está pronto para envio. Revise e clique em Enviar.",
      });
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Erro ao gerar email",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    if (generatedEmail) {
      const fullEmail = `Assunto: ${generatedEmail.subject}\n\n${generatedEmail.greeting}\n\n${generatedEmail.body.replace(/<[^>]*>/g, '')}\n\n${generatedEmail.signature.replace(/<[^>]*>/g, '')}`;
      navigator.clipboard.writeText(fullEmail);
      toast({
        title: "Email copiado!",
        description: "O email foi copiado para a área de transferência",
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
            throw new Error(error?.message || data?.error || 'Failed to send');
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
        } else {
          // For WhatsApp/SMS, use simulation for now
          await new Promise(resolve => setTimeout(resolve, 500));
          newLogs.push({
            id: `log-${Date.now()}-${leadId}`,
            leadId,
            leadName: lead.name,
            channel,
            message,
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Send className="w-5 h-5 text-primary-foreground" />
          </div>
          {t.messaging.title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.messaging.subtitle}</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Email com IA
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Send className="w-4 h-4" />
            Compor Manual
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
                      <CardTitle className="text-lg">Selecione o Nicho e Lead</CardTitle>
                      <CardDescription>Escolha para quem você quer enviar</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nicho</label>
                      <Select value={selectedFolderId} onValueChange={(v) => {
                        setSelectedFolderId(v);
                        setSelectedLeadIds(new Set());
                        setSelectedCTAId('');
                        setGeneratedEmail(null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um nicho" />
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
                      <label className="text-sm font-medium mb-2 block">CTA Base (opcional)</label>
                      <Select value={selectedCTAId} onValueChange={(v) => setSelectedCTAId(v === 'auto' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Usar CTA existente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Gerar CTA automático</SelectItem>
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
                        <label className="text-sm font-medium">Leads com email ({eligibleLeads.length})</label>
                        <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                          {selectedLeadIds.size === eligibleLeads.length ? 'Desmarcar todos' : 'Selecionar todos'}
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
                      <CardTitle className="text-lg">Seus Dados e Tom</CardTitle>
                      <CardDescription>Configure como você quer se apresentar</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Seu Nome</label>
                      <Input 
                        value={senderName} 
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="João Silva"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sua Empresa</label>
                      <Input 
                        value={senderCompany} 
                        onChange={(e) => setSenderCompany(e.target.value)}
                        placeholder="LeadFlow Solutions"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tom da Mensagem</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: 'formal', label: '🎩 Formal', desc: 'Corporativo' },
                        { value: 'casual', label: '😊 Casual', desc: 'Descontraído' },
                        { value: 'persuasive', label: '🎯 Persuasivo', desc: 'Gatilhos mentais' },
                        { value: 'friendly', label: '🤝 Amigável', desc: 'Empático' },
                      ].map((tone) => (
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
                        <CardTitle className="text-lg">Gerar Email com IA</CardTitle>
                        <CardDescription>A IA criará um email personalizado e persuasivo</CardDescription>
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
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Gerar Email
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
                            <Button variant="ghost" size="sm" onClick={handleCopyEmail}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleGenerateEmail}>
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-background rounded-lg p-4 border space-y-3">
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
                    Dicas de IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <p>Selecione um CTA existente para emails ainda mais direcionados</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <p>O tom "Persuasivo" usa gatilhos mentais como escassez e urgência</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <p>Cada email é personalizado com o nome e cargo do lead</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <p>Clique em ↻ para gerar uma nova versão do email</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              {selectedFolderId && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Estatísticas do Nicho</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Leads com email</span>
                      <span className="font-medium">{eligibleLeads.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CTAs salvos</span>
                      <span className="font-medium">{folderCTAs.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Selecionados</span>
                      <span className="font-medium text-primary">{selectedLeadIds.size}</span>
                    </div>
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
                      <label className="text-sm font-medium mb-2 block">Selecionar Nicho</label>
                      <Select value={selectedFolderId} onValueChange={(v) => {
                        setSelectedFolderId(v);
                        setSelectedLeadIds(new Set());
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um nicho" />
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
                          {eligibleLeads.length} leads com {channel} disponível
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
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum lead com {channel} disponível neste nicho</p>
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
                    placeholder="Digite sua mensagem..."
                    className="min-h-[150px]"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {message.length} caracteres • {selectedLeadIds.size} destinatário(s)
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
                  <CardTitle className="text-lg">CTAs Salvos</CardTitle>
                  <CardDescription>Clique para usar como mensagem</CardDescription>
                </CardHeader>
                <CardContent>
                  {folderCTAs.length > 0 ? (
                    <div className="space-y-3">
                      {folderCTAs.map((cta) => (
                        <div
                          key={cta.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleUseCTA(cta.text)}
                        >
                          <h4 className="font-medium text-sm mb-1">{cta.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{cta.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum CTA salvo</p>
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
              <CardDescription>Últimas mensagens enviadas</CardDescription>
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
                  <p>Nenhuma mensagem enviada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Messaging;
