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
                <Mail className="h-5 w-5 text-blue-500" />
                <CardTitle>Configurar Webhook de Email (Resend)</CardTitle>
              </div>
              <CardDescription>
                Configure webhooks para receber notificações de email na sua Caixa de Entrada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">URL do Webhook</span>
                </div>
                <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-email`} />
              </div>

              <Step number={1} title="Acesse o Dashboard do Resend">
                <p>Vá para <a href="https://resend.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">resend.com/webhooks <ExternalLink className="h-3 w-3" /></a> e faça login na sua conta.</p>
              </Step>

              <Step number={2} title="Crie um Novo Webhook">
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>Clique em <strong>Add Webhook</strong></li>
                  <li>Cole a URL do webhook (acima) no campo "Endpoint URL"</li>
                  <li>Selecione os eventos que deseja receber:
                    <ul className="list-disc list-inside ml-4 mt-2">
                      <li><code>email.delivered</code> - Email entregue</li>
                      <li><code>email.opened</code> - Email aberto</li>
                      <li><code>email.clicked</code> - Link clicado</li>
                      <li><code>email.bounced</code> - Email rejeitado</li>
                      <li><code>email.complained</code> - Marcado como spam</li>
                    </ul>
                  </li>
                  <li>Clique em <strong>Create Webhook</strong></li>
                </ol>
              </Step>

              <Step number={3} title="Configure o Reply-To (Opcional)">
                <p>Para receber respostas de email, você precisa configurar um serviço de inbound email. Recomendamos:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><a href="https://www.mailgun.com/inbound-routing/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mailgun Inbound Routing</a></li>
                  <li><a href="https://sendgrid.com/solutions/inbound-parse/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SendGrid Inbound Parse</a></li>
                </ul>
              </Step>

              <Tip>
                Os webhooks do Resend notificam sobre status de entrega (aberto, clicado, etc). Para receber respostas completas de email, configure um serviço de inbound email que encaminhe para o mesmo webhook.
              </Tip>

              <Warning>
                O Resend atualmente não oferece inbound email nativo. As respostas dos leads vão para o email configurado no "Reply-To" e precisam ser verificadas no seu cliente de email.
              </Warning>

              {/* Video Tutorial Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Vídeo Tutorial</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title="Resend - Primeiros Passos"
                    description="Como configurar sua conta Resend e começar a enviar emails"
                    youtubeId="T2xaiw7VK4c"
                  />
                  <VideoTutorial
                    title="Configurando Webhooks de Email"
                    description="Tutorial sobre webhooks e tracking de emails com Resend"
                    youtubeId="YNfV4ASLaGE"
                  />
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
