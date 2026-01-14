import React, { useState } from 'react';
import { useApp, MessageLog } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';

export const Messaging: React.FC = () => {
  const { t, leads, folders, messageLogs, setMessageLogs, ctas } = useApp();
  
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const folderLeads = leads.filter(l => l.folderId === selectedFolderId);
  const eligibleLeads = folderLeads.filter(l => {
    if (channel === 'whatsapp') return !!l.whatsapp;
    if (channel === 'sms') return !!l.phone;
    if (channel === 'email') return !!l.email;
    return false;
  });

  const folderCTAs = ctas.filter(c => c.folderId === selectedFolderId);

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

  const handleSend = async () => {
    if (selectedLeadIds.size === 0 || !message.trim()) return;
    
    setIsSending(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newLogs: MessageLog[] = Array.from(selectedLeadIds).map(leadId => {
      const lead = leads.find(l => l.id === leadId);
      return {
        id: `log-${Date.now()}-${leadId}`,
        leadId,
        leadName: lead?.name || 'Unknown',
        channel,
        message,
        status: Math.random() > 0.1 ? 'sent' : 'failed', // 90% success rate
        sentAt: new Date(),
      };
    });
    
    setMessageLogs([...messageLogs, ...newLogs]);
    setIsSending(false);
    setSelectedLeadIds(new Set());
    setMessage('');
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
            <Send className="w-4 h-4" />
            Compor
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" />
            {t.messaging.history}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
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
