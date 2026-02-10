import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Inbox as InboxIcon, 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  Search,
  MoreVertical,
  Archive,
  Trash2,
  CheckCheck,
  Clock,
  User,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

type ChannelType = 'email' | 'whatsapp' | 'sms';
type DirectionType = 'inbound' | 'outbound';
type ConversationStatus = 'active' | 'archived' | 'closed';
type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface Conversation {
  id: string;
  user_id: string;
  lead_id: string | null;
  lead_name: string;
  lead_contact: string;
  channel: ChannelType;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  status: ConversationStatus;
  created_at: string;
}

interface InboxMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  direction: DirectionType;
  channel: ChannelType;
  content: string;
  subject: string | null;
  metadata: Record<string, unknown>;
  status: MessageStatus;
  created_at: string;
}

const channelIcons = {
  email: Mail,
  whatsapp: MessageSquare,
  sms: Phone,
};

const channelLabels = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
};

const channelColors = {
  email: 'bg-blue-500',
  whatsapp: 'bg-green-500',
  sms: 'bg-purple-500',
};

export default function Inbox() {
  const { t, user, language } = useApp();
  const pt = language === 'pt-BR';
  const dateLocale = pt ? ptBR : enUS;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp' | 'sms'>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('status', 'active')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: pt ? 'Erro' : 'Error',
          description: pt ? 'Não foi possível carregar as conversas' : 'Could not load conversations',
          variant: 'destructive',
        });
      } else {
        setConversations((data || []) as Conversation[]);
      }
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations((prev) => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Conversation) : c))
            );
          } else if (payload.eventType === 'DELETE') {
            setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pt]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages((data || []) as InboxMessage[]);
      }

      // Mark as read
      if (selectedConversation.unread_count > 0) {
        await supabase
          .from('conversations')
          .update({ unread_count: 0 })
          .eq('id', selectedConversation.id);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inbox_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as InboxMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !user) return;

    setSending(true);
    try {
      const functionName = `send-${selectedConversation.channel}`;
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          to: selectedConversation.lead_contact,
          message: newMessage.trim(),
          leadId: selectedConversation.lead_id,
          leadName: selectedConversation.lead_name,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to send message');
      }

      const { error: insertError } = await supabase.from('inbox_messages').insert({
        conversation_id: selectedConversation.id,
        user_id: user.id,
        direction: 'outbound',
        channel: selectedConversation.channel,
        content: newMessage.trim(),
        status: 'sent',
      });

      if (insertError) {
        console.error('Error saving message:', insertError);
      }

      setNewMessage('');
      toast({
        title: pt ? 'Mensagem enviada' : 'Message sent',
        description: pt ? 'Sua mensagem foi enviada com sucesso' : 'Your message was sent successfully',
      });
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      toast({
        title: pt ? 'Erro ao enviar' : 'Send failed',
        description: error instanceof Error ? error.message : (pt ? 'Não foi possível enviar a mensagem' : 'Could not send message'),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'archived' })
      .eq('id', conversationId);

    if (error) {
      toast({
        title: pt ? 'Erro' : 'Error',
        description: pt ? 'Não foi possível arquivar a conversa' : 'Could not archive conversation',
        variant: 'destructive',
      });
    } else {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      toast({ title: pt ? 'Conversa arquivada' : 'Conversation archived' });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const { error } = await supabase.from('conversations').delete().eq('id', conversationId);

    if (error) {
      toast({
        title: pt ? 'Erro' : 'Error',
        description: pt ? 'Não foi possível excluir a conversa' : 'Could not delete conversation',
        variant: 'destructive',
      });
    } else {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      toast({ title: pt ? 'Conversa excluída' : 'Conversation deleted' });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: dateLocale });
    } else if (isYesterday(date)) {
      return (pt ? 'Ontem ' : 'Yesterday ') + format(date, 'HH:mm', { locale: dateLocale });
    } else {
      return format(date, 'dd/MM HH:mm', { locale: dateLocale });
    }
  };

  const formatConversationTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: dateLocale });
    } else if (isYesterday(date)) {
      return pt ? 'Ontem' : 'Yesterday';
    } else {
      return format(date, 'dd/MM', { locale: dateLocale });
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.lead_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lead_contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'all' || conv.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <InboxIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {pt ? 'Caixa de Entrada' : 'Inbox'}
          </h1>
          {totalUnread > 0 && (
            <Badge variant="destructive">{totalUnread} {pt ? 'não lidas' : 'unread'}</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {pt ? 'Atualizar' : 'Refresh'}
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Conversations List */}
        <Card className={`lg:col-span-1 flex flex-col ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={pt ? 'Buscar conversas...' : 'Search conversations...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            <Tabs
              value={channelFilter}
              onValueChange={(v) => setChannelFilter(v as typeof channelFilter)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  {pt ? 'Todos' : 'All'}
                </TabsTrigger>
                <TabsTrigger value="email" className="flex-1">
                  <Mail className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex-1">
                  <MessageSquare className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex-1">
                  <Phone className="h-3 w-3" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  {pt ? 'Carregando conversas...' : 'Loading conversations...'}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <InboxIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{pt ? 'Nenhuma conversa encontrada' : 'No conversations found'}</p>
                  <p className="text-sm mt-2">
                    {pt ? 'As conversas aparecerão aqui quando leads responderem' : 'Conversations will appear here when leads reply'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => {
                    const ChannelIcon = channelIcons[conv.channel];
                    return (
                      <div
                        key={conv.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${channelColors[conv.channel]} text-white`}
                          >
                            <ChannelIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">
                                {conv.lead_name}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatConversationTime(conv.last_message_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message || (pt ? 'Nova conversa' : 'New conversation')}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {channelLabels[conv.channel]}
                              </Badge>
                              {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className={`lg:col-span-2 flex flex-col ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div
                      className={`p-2 rounded-full ${channelColors[selectedConversation.channel]} text-white`}
                    >
                      {React.createElement(channelIcons[selectedConversation.channel], {
                        className: 'h-5 w-5',
                      })}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedConversation.lead_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.lead_contact}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleArchiveConversation(selectedConversation.id)
                        }
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        {pt ? 'Arquivar' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() =>
                          handleDeleteConversation(selectedConversation.id)
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {pt ? 'Excluir' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 min-h-0">
                <ScrollArea className="h-full pr-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{pt ? 'Nenhuma mensagem ainda' : 'No messages yet'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.direction === 'outbound'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg p-3 ${
                              msg.direction === 'outbound'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {msg.subject && (
                              <p className="font-medium text-sm mb-1">
                                {msg.subject}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div
                              className={`flex items-center gap-1 mt-1 text-xs ${
                                msg.direction === 'outbound'
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              <span>{formatMessageTime(msg.created_at)}</span>
                              {msg.direction === 'outbound' && (
                                <CheckCheck className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={pt ? 'Digite sua mensagem...' : 'Type your message...'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <InboxIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {pt ? 'Selecione uma conversa' : 'Select a conversation'}
                </h3>
                <p className="text-sm">
                  {pt ? 'Escolha uma conversa da lista para ver as mensagens' : 'Choose a conversation from the list to see messages'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
