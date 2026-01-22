import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Key,
  Globe,
  Play,
  Video
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const WEBHOOK_BASE_URL = 'https://gylxzoogrqqeqihqknkm.supabase.co/functions/v1';

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ number, title, children }) => (
  <div className="flex gap-4 mb-6">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
      {number}
    </div>
    <div className="flex-1">
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="text-muted-foreground">{children}</div>
    </div>
  </div>
);

const CopyableUrl: React.FC<{ url: string; label?: string }> = ({ url, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: 'URL copiada!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-muted rounded-lg p-3 flex items-center gap-2 my-3">
      <code className="flex-1 text-sm break-all">{url}</code>
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 my-4 flex gap-3">
    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
    <div className="text-sm">{children}</div>
  </div>
);

const Warning: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 my-4 flex gap-3">
    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
    <div className="text-sm">{children}</div>
  </div>
);

interface VideoTutorialProps {
  title: string;
  description: string;
  youtubeId: string;
}

const VideoTutorial: React.FC<VideoTutorialProps> = ({ title, description, youtubeId }) => {
  const youtubeUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;

  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`
    : undefined;

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden border bg-muted/30">
        <AspectRatio ratio={16 / 9}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              Vídeo indisponível
            </div>
          )}
        </AspectRatio>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-medium leading-snug">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Button asChild variant="outline" size="sm" className="shrink-0">
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
            Assistir
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
};

export default function Help() {
  const { language } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">
          {language === 'pt-BR' ? 'Central de Ajuda' : 'Help Center'}
        </h1>
      </div>

      <p className="text-muted-foreground">
        Aprenda como configurar os webhooks para receber respostas de <span className="font-bold text-green-600">WhatsApp</span>, <span className="font-bold text-blue-600">SMS</span> e <span className="font-bold text-orange-500">Email</span> diretamente na sua Caixa de Entrada.
      </p>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            <span className="font-bold text-green-600">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-blue-600">SMS (Twilio)</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4 text-orange-500" />
            <span className="font-bold text-orange-500">Email</span>
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Configuration */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <CardTitle>Configurar Webhook do WhatsApp Business API</CardTitle>
              </div>
              <CardDescription>
                Siga os passos abaixo para receber mensagens de WhatsApp na sua Caixa de Entrada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">URL do Webhook</span>
                  </div>
                  <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-whatsapp`} />
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span className="font-medium">Token de Verificação</span>
                  </div>
                  <CopyableUrl url="lovable_inbox_verify" />
                </div>
              </div>

              <Step number={1} title="Acesse o Meta for Developers">
                <p>Vá para <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">developers.facebook.com <ExternalLink className="h-3 w-3" /></a> e faça login com sua conta do Facebook.</p>
              </Step>

              <Step number={2} title="Selecione seu App do WhatsApp Business">
                <p>No painel, clique no seu app que está configurado com a API do WhatsApp Business. Se ainda não tem um app, crie um novo selecionando "WhatsApp" como produto.</p>
              </Step>

              <Step number={3} title="Configure o Webhook">
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>No menu lateral, clique em <strong>WhatsApp</strong> → <strong>Configuration</strong></li>
                  <li>Na seção "Webhook", clique em <strong>Edit</strong></li>
                  <li>Cole a URL do webhook (acima) no campo "Callback URL"</li>
                  <li>Cole o token de verificação no campo "Verify Token"</li>
                  <li>Clique em <strong>Verify and Save</strong></li>
                </ol>
              </Step>

              <Step number={4} title="Inscreva-se nos Eventos">
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>Após verificar o webhook, clique em <strong>Manage</strong></li>
                  <li>Marque a opção <strong>messages</strong></li>
                  <li>Clique em <strong>Done</strong></li>
                </ol>
              </Step>

              <Tip>
                <strong>Pronto!</strong> Agora quando alguém responder uma mensagem enviada pelo app, a resposta aparecerá automaticamente na sua Caixa de Entrada.
              </Tip>

              <Warning>
                O número de telefone precisa estar verificado e aprovado pela Meta. Mensagens de teste podem ser enviadas apenas para números registrados como "Test Numbers" durante o desenvolvimento.
              </Warning>

              {/* Video Tutorial Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Vídeo Tutorial</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title="WhatsApp Cloud API - Configuração Completa"
                    description="Tutorial oficial da Meta sobre como configurar webhooks no WhatsApp Business API"
                    youtubeId="CEt_KMMv3V8"
                  />
                  <VideoTutorial
                    title="WhatsApp Webhooks - Passo a Passo"
                    description="Como configurar webhooks no Meta for Developers para receber mensagens"
                    youtubeId="DBNiWopmqcw"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Configuration */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-500" />
                <CardTitle>Configurar Webhook do Twilio (SMS)</CardTitle>
              </div>
              <CardDescription>
                Configure o Twilio para encaminhar respostas de SMS para sua Caixa de Entrada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">URL do Webhook</span>
                </div>
                <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-sms`} />
              </div>

              <Step number={1} title="Acesse o Console do Twilio">
                <p>Vá para <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">console.twilio.com <ExternalLink className="h-3 w-3" /></a> e faça login na sua conta.</p>
              </Step>

              <Step number={2} title="Navegue até seus Números de Telefone">
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>No menu lateral, clique em <strong>Phone Numbers</strong></li>
                  <li>Clique em <strong>Manage</strong> → <strong>Active Numbers</strong></li>
                  <li>Selecione o número que você usa para enviar SMS</li>
                </ol>
              </Step>

              <Step number={3} title="Configure o Webhook de Mensagens">
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>Role até a seção <strong>Messaging Configuration</strong></li>
                  <li>Em "A MESSAGE COMES IN", selecione <strong>Webhook</strong></li>
                  <li>Cole a URL do webhook (acima) no campo</li>
                  <li>Certifique-se de que o método está como <strong>HTTP POST</strong></li>
                  <li>Clique em <strong>Save Configuration</strong></li>
                </ol>
              </Step>

              <Tip>
                <strong>Teste a configuração:</strong> Envie uma mensagem SMS para o seu número Twilio a partir de qualquer celular. A mensagem deve aparecer na Caixa de Entrada em segundos.
              </Tip>

              <Warning>
                Certifique-se de que seu número Twilio está habilitado para receber SMS. Alguns números são apenas para chamadas de voz.
              </Warning>

              {/* Video Tutorial Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Vídeo Tutorial</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title="Twilio SMS Webhooks - Guia Completo"
                    description="Como configurar webhooks para receber SMS no Twilio"
                    youtubeId="4qZY7IZjvPo"
                  />
                  <VideoTutorial
                    title="Configurando Números de Telefone"
                    description="Tutorial sobre configuração de números e webhooks no console Twilio"
                    youtubeId="WTpciu4qgck"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Configuration */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-500" />
                <CardTitle>Guia COMPLETO: Configurar Email Profissional com Resend</CardTitle>
              </div>
              <CardDescription>
                Tutorial detalhado DO ZERO - Inclui configuração DNS (DKIM, SPF, DMARC) para emails não caírem no spam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Resumo Executivo */}
              <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-orange-500" />
                  Resumo: O que você vai configurar
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-orange-600 mb-1">📧 Resend (Gratuito)</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Plataforma de envio</li>
                      <li>• 100 emails/dia grátis</li>
                      <li>• 3.000 emails/mês grátis</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-orange-600 mb-1">🌐 DNS do Domínio</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• DKIM (autenticação)</li>
                      <li>• SPF (autorização)</li>
                      <li>• DMARC (proteção)</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-orange-600 mb-1">⚙️ No App</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• API Key</li>
                      <li>• Email de envio</li>
                      <li>• Nome do remetente</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm"><strong>⏱️ Tempo estimado:</strong> 15-30 minutos (incluindo propagação DNS)</p>
                </div>
              </div>

              {/* Por que configurar DNS? */}
              <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  ⚠️ POR QUE CONFIGURAR DNS É OBRIGATÓRIO?
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Sem DNS configurado, seus emails vão <strong className="text-red-500">direto para o SPAM</strong>. Os provedores (Gmail, Outlook, etc.) 
                  verificam se você tem autorização para enviar emails pelo seu domínio.
                </p>
                <div className="grid md:grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">DKIM</p>
                    <p className="text-xs text-muted-foreground">Assinatura digital que prova que o email é autêntico</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">SPF</p>
                    <p className="text-xs text-muted-foreground">Lista de servidores autorizados a enviar pelo seu domínio</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">DMARC</p>
                    <p className="text-xs text-muted-foreground">Política de segurança contra falsificação de email</p>
                  </div>
                </div>
              </div>

              {/* PARTE 1: Criar conta Resend */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">1</span>
                  PARTE 1: Criar Conta no Resend
                </h3>
                
                <Step number={1} title="Acesse o site do Resend">
                  <p>Vá para <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">resend.com/signup <ExternalLink className="h-3 w-3" /></a></p>
                  <p className="mt-2 text-sm">Você pode fazer login com Google ou criar conta com email.</p>
                </Step>

                <Step number={2} title="Confirme seu email">
                  <p>Se criou com email, verifique sua caixa de entrada e clique no link de confirmação.</p>
                </Step>

                <Tip>
                  <strong>Plano Gratuito:</strong> O Resend oferece 100 emails/dia e 3.000/mês sem pagar nada. Ideal para começar!
                </Tip>
              </div>

              {/* PARTE 2: Adicionar e Verificar Domínio */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">2</span>
                  PARTE 2: Adicionar Domínio no Resend
                </h3>

                <Step number={1} title="Vá para a página de Domínios">
                  <p>Acesse <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">resend.com/domains <ExternalLink className="h-3 w-3" /></a></p>
                </Step>

                <Step number={2} title="Adicione seu domínio">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Clique no botão <strong className="text-orange-500">+ Add Domain</strong></li>
                    <li>Digite o domínio da sua empresa</li>
                    <li>Clique em <strong>Add</strong></li>
                  </ol>
                  <div className="bg-muted/50 rounded-lg p-4 mt-3">
                    <p className="text-sm font-medium mb-2">💡 Qual domínio usar?</p>
                    <div className="space-y-2 text-sm">
                      <p><strong>Recomendado:</strong> Use um subdomínio como <code className="bg-muted px-1 rounded">send.suaempresa.com.br</code></p>
                      <p className="text-muted-foreground">Isso protege a reputação do seu domínio principal se algo der errado.</p>
                      <p><strong>Alternativa:</strong> Use o domínio principal <code className="bg-muted px-1 rounded">suaempresa.com.br</code></p>
                    </div>
                  </div>
                </Step>

                <Step number={3} title="Anote os registros DNS que o Resend mostra">
                  <p>Após adicionar, o Resend vai mostrar <strong>3 registros DNS</strong> que você precisa adicionar:</p>
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-sm border rounded-lg overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Tipo</th>
                          <th className="text-left p-3 font-medium">Nome/Host</th>
                          <th className="text-left p-3 font-medium">Valor (exemplo)</th>
                          <th className="text-left p-3 font-medium">O que faz</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3 font-mono text-orange-500">TXT</td>
                          <td className="p-3 font-mono text-xs">resend._domainkey</td>
                          <td className="p-3 text-xs text-muted-foreground">p=MIGfMA0GCS... (chave longa)</td>
                          <td className="p-3 text-xs">DKIM - Assinatura</td>
                        </tr>
                        <tr className="border-t bg-muted/30">
                          <td className="p-3 font-mono text-orange-500">TXT</td>
                          <td className="p-3 font-mono text-xs">@ ou domínio</td>
                          <td className="p-3 text-xs text-muted-foreground">v=spf1 include:resend.com ~all</td>
                          <td className="p-3 text-xs">SPF - Autorização</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-mono text-orange-500">TXT</td>
                          <td className="p-3 font-mono text-xs">_dmarc</td>
                          <td className="p-3 text-xs text-muted-foreground">v=DMARC1; p=none;</td>
                          <td className="p-3 text-xs">DMARC - Proteção</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Warning>
                    <strong>COPIE OS VALORES EXATOS</strong> que o Resend mostra para você. Os valores acima são apenas exemplos!
                  </Warning>
                </Step>
              </div>

              {/* PARTE 3: Configurar DNS no seu provedor */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">3</span>
                  PARTE 3: Adicionar Registros DNS (Passo Crítico!)
                </h3>

                <p className="text-muted-foreground mb-4">
                  Agora você precisa acessar o painel do seu provedor de domínio e adicionar os registros que o Resend mostrou.
                </p>

                {/* Provedores mais comuns */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <a href="https://registro.br" target="_blank" rel="noopener noreferrer" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Registro.br</p>
                      <p className="text-xs text-muted-foreground">Domínios .br</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </a>
                  <a href="https://hostgator.com.br" target="_blank" rel="noopener noreferrer" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <Globe className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">HostGator</p>
                      <p className="text-xs text-muted-foreground">cPanel DNS Zone</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </a>
                  <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <Globe className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Cloudflare</p>
                      <p className="text-xs text-muted-foreground">DNS Records</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </a>
                  <a href="https://dcc.godaddy.com" target="_blank" rel="noopener noreferrer" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <Globe className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">GoDaddy</p>
                      <p className="text-xs text-muted-foreground">DNS Management</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </a>
                  <a href="https://hpanel.hostinger.com" target="_blank" rel="noopener noreferrer" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <Globe className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Hostinger</p>
                      <p className="text-xs text-muted-foreground">hPanel DNS</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </a>
                  <a href="https://locaweb.com.br" target="_blank" rel="noopener noreferrer" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <Globe className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Locaweb</p>
                      <p className="text-xs text-muted-foreground">Painel de DNS</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </a>
                </div>

                <Step number={1} title="Faça login no painel do seu provedor">
                  <p>Acesse o site onde você comprou/gerencia seu domínio e faça login.</p>
                </Step>

                <Step number={2} title="Encontre a seção de DNS / Zona DNS">
                  <p>Procure por opções como:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li><strong>HostGator:</strong> cPanel → Zona DNS ou DNS Zone Editor</li>
                    <li><strong>Cloudflare:</strong> DNS → Records</li>
                    <li><strong>GoDaddy:</strong> DNS Management → DNS Records</li>
                    <li><strong>Hostinger:</strong> hPanel → Advanced → DNS Zone Editor</li>
                    <li><strong>Registro.br:</strong> Painel → Editar Zona DNS</li>
                  </ul>
                </Step>

                <Step number={3} title="Adicione cada registro TXT">
                  <p>Para <strong>CADA</strong> registro que o Resend mostrou:</p>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Clique em <strong>Adicionar Registro</strong> ou <strong>Add Record</strong></li>
                    <li>Selecione tipo <strong className="text-orange-500">TXT</strong></li>
                    <li>No campo <strong>Nome/Host</strong>: cole o que o Resend indicou</li>
                    <li>No campo <strong>Valor/Content</strong>: cole o valor completo</li>
                    <li>TTL: deixe o padrão (3600 ou Auto)</li>
                    <li>Clique em <strong>Salvar</strong></li>
                  </ol>
                </Step>

                <div className="bg-muted/50 rounded-lg p-5 mt-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Exemplo Visual: Adicionando no HostGator/cPanel
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="bg-background rounded-lg p-3 border">
                      <p className="font-medium text-orange-500">Registro 1: DKIM</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div><span className="text-muted-foreground">Tipo:</span> TXT</div>
                        <div><span className="text-muted-foreground">Nome:</span> resend._domainkey.send</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Valor:</span> p=MIGfMA0... (copie do Resend)</div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border">
                      <p className="font-medium text-orange-500">Registro 2: SPF</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div><span className="text-muted-foreground">Tipo:</span> TXT</div>
                        <div><span className="text-muted-foreground">Nome:</span> send (ou @ para domínio principal)</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Valor:</span> v=spf1 include:resend.com ~all</div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border">
                      <p className="font-medium text-orange-500">Registro 3: DMARC (opcional mas recomendado)</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div><span className="text-muted-foreground">Tipo:</span> TXT</div>
                        <div><span className="text-muted-foreground">Nome:</span> _dmarc.send</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Valor:</span> v=DMARC1; p=none; rua=mailto:seuemail@gmail.com</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Warning>
                  <strong>Propagação DNS:</strong> Após adicionar os registros, pode levar de 5 minutos até 48 horas para propagar. 
                  Geralmente leva menos de 1 hora. O Resend mostra um ícone ✅ quando verificar.
                </Warning>
              </div>

              {/* PARTE 4: Verificar no Resend */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">4</span>
                  PARTE 4: Verificar Domínio no Resend
                </h3>

                <Step number={1} title="Volte para o Resend">
                  <p>Acesse <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">resend.com/domains <ExternalLink className="h-3 w-3" /></a></p>
                </Step>

                <Step number={2} title="Clique em 'Verify DNS Records'">
                  <p>O Resend vai verificar se os registros foram adicionados corretamente.</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Verde = Configurado corretamente</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>Amarelo = Pendente (aguarde propagação)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Vermelho = Erro (verifique os valores)</span>
                    </div>
                  </div>
                </Step>

                <Tip>
                  Se demorar mais de 1 hora e ainda não verificou, use ferramentas como <a href="https://mxtoolbox.com/SuperTool.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">MXToolbox</a> para verificar se os registros estão propagados.
                </Tip>
              </div>

              {/* PARTE 5: Criar API Key */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-purple-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">5</span>
                  PARTE 5: Criar API Key
                </h3>

                <Step number={1} title="Acesse a página de API Keys">
                  <p>Vá para <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">resend.com/api-keys <ExternalLink className="h-3 w-3" /></a></p>
                </Step>

                <Step number={2} title="Crie uma nova API Key">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Clique em <strong className="text-purple-500">+ Create API Key</strong></li>
                    <li>Nome: <code className="bg-muted px-1 rounded">R3CF Leads Flow</code> (ou outro nome descritivo)</li>
                    <li>Permissão: Selecione <strong>Full Access</strong></li>
                    <li>Domínio: Selecione seu domínio verificado ou "All Domains"</li>
                    <li>Clique em <strong>Create</strong></li>
                  </ol>
                </Step>

                <Warning>
                  <strong className="text-red-500">🚨 COPIE A CHAVE AGORA!</strong> A API Key só aparece UMA VEZ. 
                  Se você não copiar, terá que criar uma nova. A chave começa com <code className="bg-muted px-1 rounded">re_</code>
                </Warning>

                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium mb-2">Exemplo de API Key:</p>
                  <code className="text-xs bg-background p-2 rounded block">re_ABC123xyz789defGHI456jkl...</code>
                  <p className="text-xs text-muted-foreground mt-2">Guarde em um lugar seguro (arquivo .txt, gerenciador de senhas, etc.)</p>
                </div>
              </div>

              {/* PARTE 6: Configurar no App */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm">6</span>
                  PARTE 6: Configurar no App R3CF Leads Flow
                </h3>

                <Step number={1} title="Vá para Configurações">
                  <p>No menu lateral, clique em <strong>Configurações</strong>.</p>
                </Step>

                <Step number={2} title="Role até 'Credenciais de Mensagens' e clique na aba Email">
                  <p>Você verá 3 campos para preencher:</p>
                </Step>

                <div className="bg-muted/50 rounded-lg p-5 mt-3 space-y-4">
                  <div className="border-b pb-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      API Key do Resend
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Cole a chave que você copiou (começa com re_)</p>
                    <code className="text-xs bg-background p-2 rounded block mt-2">re_ABC123xyz789defGHI456jkl...</code>
                  </div>
                  <div className="border-b pb-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-500" />
                      Email de Envio
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">O email usando seu domínio verificado</p>
                    <code className="text-xs bg-background p-2 rounded block mt-2">contato@send.suaempresa.com.br</code>
                    <p className="text-xs text-muted-foreground mt-1">⚠️ Deve usar o mesmo domínio que você verificou no Resend!</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Nome do Remetente
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">O nome que o destinatário verá</p>
                    <code className="text-xs bg-background p-2 rounded block mt-2">Ricardo da Empresa XYZ</code>
                  </div>
                </div>

                <Step number={3} title="Clique em 'Salvar Configurações Email'">
                  <p>O status deve mudar para <strong className="text-green-500">✅ Configurado</strong>.</p>
                </Step>
              </div>

              {/* PARTE 7: Testar */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">7</span>
                  PARTE 7: Fazer o Primeiro Teste
                </h3>

                <Step number={1} title="Crie um lead de teste">
                  <p>Vá em <strong>Prospecção AI</strong>, faça uma busca e salve um lead com um email válido (pode usar o seu próprio email para testar).</p>
                </Step>

                <Step number={2} title="Envie um email de teste">
                  <p>No <strong>CRM</strong>, clique no lead e depois em <strong className="text-orange-500">📧 Enviar Email</strong>.</p>
                </Step>

                <Step number={3} title="Verifique sua caixa de entrada">
                  <p>O email deve chegar em segundos. Verifique também:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Se caiu na pasta <strong>principal</strong> (não no spam)</li>
                    <li>Se o nome do remetente está correto</li>
                    <li>Se o email de resposta está correto</li>
                  </ul>
                </Step>

                <Tip>
                  <strong>Dica Pro:</strong> Teste enviando para Gmail, Outlook e outros provedores para garantir que não está caindo no spam em nenhum deles.
                </Tip>
              </div>

              {/* Webhooks Opcionais */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">+</span>
                  BÔNUS: Configurar Webhooks (Tracking de Abertura/Cliques)
                </h3>

                <p className="text-muted-foreground mb-4">
                  <strong>Opcional mas recomendado!</strong> Webhooks permitem saber quando o lead abriu seu email ou clicou em links.
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">URL do Webhook:</span>
                  </div>
                  <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-email`} />
                </div>

                <Step number={1} title="Acesse os Webhooks do Resend">
                  <p>Vá para <a href="https://resend.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">resend.com/webhooks <ExternalLink className="h-3 w-3" /></a></p>
                </Step>

                <Step number={2} title="Crie um novo webhook">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Clique em <strong>+ Add Webhook</strong></li>
                    <li>Cole a URL acima no campo "Endpoint URL"</li>
                    <li>Marque os eventos:
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><code className="bg-muted px-1 rounded">email.delivered</code> - Email entregue ✓</li>
                        <li><code className="bg-muted px-1 rounded">email.opened</code> - Lead abriu o email 👀</li>
                        <li><code className="bg-muted px-1 rounded">email.clicked</code> - Lead clicou em link 🔗</li>
                        <li><code className="bg-muted px-1 rounded">email.bounced</code> - Email rejeitado ❌</li>
                      </ul>
                    </li>
                    <li>Clique em <strong>Create Webhook</strong></li>
                  </ol>
                </Step>
              </div>

              {/* Fluxo Visual */}
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 border rounded-lg p-5 mt-4">
                <h4 className="font-bold mb-4">📧 Resumo do Fluxo Completo:</h4>
                <div className="flex flex-col md:flex-row items-center gap-3 text-sm">
                  <div className="bg-background rounded-lg p-3 text-center flex-1">
                    <p className="font-medium">1. Você envia</p>
                    <p className="text-xs text-muted-foreground">Via Resend API</p>
                  </div>
                  <div className="hidden md:block text-muted-foreground">→</div>
                  <div className="bg-background rounded-lg p-3 text-center flex-1">
                    <p className="font-medium">2. Lead recebe</p>
                    <p className="text-xs text-muted-foreground">No email dele</p>
                  </div>
                  <div className="hidden md:block text-muted-foreground">→</div>
                  <div className="bg-background rounded-lg p-3 text-center flex-1">
                    <p className="font-medium">3. Lead responde</p>
                    <p className="text-xs text-muted-foreground">Vai pro seu email!</p>
                  </div>
                  <div className="hidden md:block text-muted-foreground">→</div>
                  <div className="bg-background rounded-lg p-3 text-center flex-1">
                    <p className="font-medium">4. Você responde</p>
                    <p className="text-xs text-muted-foreground">Do Gmail/Outlook</p>
                  </div>
                </div>
              </div>

              {/* Video Tutorial Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Vídeos Tutoriais</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title="Resend: Configuração Completa do Zero"
                    description="Como criar conta, verificar domínio e enviar o primeiro email"
                    youtubeId="T2xaiw7VK4c"
                  />
                  <VideoTutorial
                    title="Como Configurar DNS para Email (DKIM, SPF, DMARC)"
                    description="Tutorial detalhado sobre registros DNS para autenticação de email"
                    youtubeId="J3ySLqFiSMM"
                  />
                  <VideoTutorial
                    title="Verificando Domínio no Resend"
                    description="Passo a passo para verificar seu domínio e criar API Keys"
                    youtubeId="YNfV4ASLaGE"
                  />
                  <VideoTutorial
                    title="DNS Records Explained (DKIM, SPF, DMARC)"
                    description="Explicação técnica de cada tipo de registro DNS para email"
                    youtubeId="qoUNrXr-FsM"
                  />
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">🔗 Links Úteis para Configuração DNS:</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <a href="https://resend.com/docs/dashboard/domains/introduction" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      📘 Documentação Oficial do Resend <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://mxtoolbox.com/SuperTool.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      🔍 MXToolbox - Verificar DNS <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://support.hostgator.com/articles/hosting-guide/lets-get-started/dns-management-add-edit-delete-dns-records" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      📗 Guia HostGator DNS <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      📙 Guia Cloudflare DNS <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>O webhook não está recebendo mensagens. O que fazer?</AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Verifique se a URL do webhook foi copiada corretamente</li>
                  <li>Confirme que o token de verificação está correto (para WhatsApp)</li>
                  <li>Teste se o webhook está acessível acessando a URL no navegador</li>
                  <li>Verifique os logs do webhook no painel da plataforma (Meta, Twilio, Resend)</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>As mensagens estão chegando com atraso?</AccordionTrigger>
              <AccordionContent>
                Normalmente as mensagens chegam em segundos. Se houver atraso, pode ser:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Congestionamento na rede do provedor</li>
                  <li>Problemas temporários no servidor</li>
                  <li>Fila de processamento da plataforma externa</li>
                </ul>
                Aguarde alguns minutos e teste novamente.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Preciso pagar algo extra para usar os webhooks?</AccordionTrigger>
              <AccordionContent>
                <strong>Não!</strong> Os webhooks são gratuitos. Você só paga pelos envios normais das plataformas:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>WhatsApp:</strong> Custo por conversa (definido pela Meta)</li>
                  <li><strong>Twilio:</strong> Custo por SMS enviado/recebido</li>
                  <li><strong>Resend:</strong> Custo por email enviado</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Posso usar meu próprio token de verificação?</AccordionTrigger>
              <AccordionContent>
                Atualmente o token de verificação do WhatsApp é fixo (<code>lovable_inbox_verify</code>). Em breve adicionaremos suporte para tokens personalizados nas configurações.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>As conversas são salvas automaticamente?</AccordionTrigger>
              <AccordionContent>
                <strong>Sim!</strong> Todas as mensagens enviadas e recebidas são salvas automaticamente no banco de dados. Você pode visualizar o histórico completo na Caixa de Entrada.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Links Úteis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Documentação WhatsApp</p>
                <p className="text-sm text-muted-foreground">Meta for Developers</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </a>

            <a
              href="https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Phone className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Documentação Twilio</p>
                <p className="text-sm text-muted-foreground">SMS Webhooks</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </a>

            <a
              href="https://resend.com/docs/dashboard/webhooks/introduction"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Documentação Resend</p>
                <p className="text-sm text-muted-foreground">Email Webhooks</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
