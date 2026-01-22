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
  Video,
  FileText,
  Calculator
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PremiumCostCalculator from '@/components/help/PremiumCostCalculator';

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

  // NOTE: Alguns vídeos bloqueiam reprodução via iframe ("Playback on other websites...").
  // Para evitar cards quebrados, usamos miniatura + link direto para o YouTube.
  const thumbUrl = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : undefined;

  return (
    <div className="space-y-3">
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-lg overflow-hidden border bg-muted/30"
        aria-label={`Abrir vídeo no YouTube: ${title}`}
      >
        <AspectRatio ratio={16 / 9}>
          {thumbUrl ? (
            <div className="relative h-full w-full">
              <img
                src={thumbUrl}
                alt={`Miniatura do vídeo: ${title}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-full border border-border bg-background/70 backdrop-blur-sm p-3 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Play className="h-6 w-6 text-foreground" />
                  <span className="sr-only">Assistir no YouTube</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              Clique em “Assistir” para abrir no YouTube
            </div>
          )}
        </AspectRatio>
      </a>

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
  const { language, user } = useApp();
  const isAdmin = user?.role === 'admin';

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

      {/* Premium Cost Calculator - Admin Only */}
      {isAdmin && <PremiumCostCalculator />}

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
                <CardTitle>Guia COMPLETO: Configurar WhatsApp Business API</CardTitle>
              </div>
              <CardDescription>
                Tutorial detalhado DO ZERO - Inclui criação de App na Meta, configuração de webhook e primeiro teste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Resumo Executivo */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Resumo: O que você vai configurar
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-green-600 mb-1">📱 Meta Business Suite</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Conta Business verificada</li>
                      <li>• Número de telefone</li>
                      <li>• App no Meta Developers</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-green-600 mb-1">🔗 Webhook</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• URL de callback</li>
                      <li>• Token de verificação</li>
                      <li>• Eventos de mensagem</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-green-600 mb-1">⚙️ No App</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Access Token</li>
                      <li>• Phone Number ID</li>
                      <li>• Número de envio</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm"><strong>⏱️ Tempo estimado:</strong> 30-60 minutos (verificação da Meta pode levar mais)</p>
                </div>
              </div>

              {/* Pré-requisitos */}
              <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  ⚠️ PRÉ-REQUISITOS OBRIGATÓRIOS
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Antes de começar, você precisa ter:
                </p>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">✅ Conta no Facebook</p>
                    <p className="text-xs text-muted-foreground">Conta pessoal ativa para acessar o Meta for Developers</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">✅ Meta Business Account</p>
                    <p className="text-xs text-muted-foreground">Conta business para associar ao WhatsApp</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">✅ Número de Telefone</p>
                    <p className="text-xs text-muted-foreground">Número que NÃO esteja vinculado ao WhatsApp pessoal</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">✅ Verificação de Negócio</p>
                    <p className="text-xs text-muted-foreground">CNPJ ou documentos da empresa (para sair do modo teste)</p>
                  </div>
                </div>
                <Warning>
                  <strong>IMPORTANTE:</strong> O número usado para a API do WhatsApp Business <strong className="text-red-500">NÃO PODE</strong> estar 
                  vinculado a um WhatsApp pessoal. Use um número novo ou desvincule o existente.
                </Warning>
              </div>

              {/* URLs importantes */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">URL do Webhook (copie!)</span>
                  </div>
                  <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-whatsapp`} />
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span className="font-medium">Token de Verificação (copie!)</span>
                  </div>
                  <CopyableUrl url="lovable_inbox_verify" />
                </div>
              </div>

              {/* PARTE 1: Criar App na Meta */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">1</span>
                  PARTE 1: Criar App no Meta for Developers
                </h3>
                
                <Step number={1} title="Acesse o Meta for Developers">
                  <p>Vá para <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">developers.facebook.com <ExternalLink className="h-3 w-3" /></a></p>
                  <p className="mt-2 text-sm">Faça login com sua conta do Facebook.</p>
                </Step>

                <Step number={2} title="Crie um novo App">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Clique em <strong className="text-green-500">My Apps</strong> no canto superior direito</li>
                    <li>Clique em <strong>Create App</strong></li>
                    <li>Selecione <strong>"Other"</strong> como tipo de uso</li>
                    <li>Selecione <strong>"Business"</strong> como tipo de app</li>
                    <li>Dê um nome ao app (ex: "R3CF WhatsApp")</li>
                    <li>Clique em <strong>Create App</strong></li>
                  </ol>
                </Step>

                <Step number={3} title="Adicione o produto WhatsApp">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Na tela do App Dashboard, role até "Add Products to Your App"</li>
                    <li>Encontre <strong className="text-green-500">WhatsApp</strong> e clique em <strong>Set Up</strong></li>
                    <li>Selecione sua Meta Business Account (ou crie uma nova)</li>
                  </ol>
                </Step>

                <Tip>
                  Se você não tem uma Meta Business Account, o assistente vai te guiar para criar uma. 
                  Siga os passos e tenha em mãos os dados da sua empresa.
                </Tip>
              </div>

              {/* PARTE 2: Configurar Número de Telefone */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">2</span>
                  PARTE 2: Configurar Número de Telefone
                </h3>

                <Step number={1} title="Acesse a seção 'API Setup'">
                  <p>No menu lateral, clique em <strong>WhatsApp</strong> → <strong>API Setup</strong></p>
                </Step>

                <Step number={2} title="Adicione seu número de telefone">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Na seção "From", você verá um número de teste da Meta</li>
                    <li>Para usar seu próprio número, clique em <strong>Add phone number</strong></li>
                    <li>Preencha:
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><strong>Display Name:</strong> Nome que aparece no WhatsApp (ex: "Empresa XYZ")</li>
                        <li><strong>Phone Number:</strong> Seu número com código do país (+55...)</li>
                      </ul>
                    </li>
                    <li>Escolha como verificar: <strong>SMS</strong> ou <strong>Ligação</strong></li>
                    <li>Insira o código de verificação recebido</li>
                  </ol>
                </Step>

                <Step number={3} title="Anote o Phone Number ID">
                  <p>Após verificar, você verá o <strong>Phone Number ID</strong> na página. Copie esse valor!</p>
                  <div className="bg-muted/50 rounded-lg p-4 mt-3">
                    <p className="text-sm font-medium mb-2">Exemplo de Phone Number ID:</p>
                    <code className="text-xs bg-background p-2 rounded block">123456789012345</code>
                    <p className="text-xs text-muted-foreground mt-2">É um número grande, normalmente 15 dígitos</p>
                  </div>
                </Step>

                <Warning>
                  <strong>Modo de Teste:</strong> Enquanto sua empresa não for verificada, você só pode enviar mensagens 
                  para números adicionados como "Test Numbers". Para produção, complete a verificação do negócio.
                </Warning>
              </div>

              {/* PARTE 3: Gerar Access Token */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">3</span>
                  PARTE 3: Gerar Access Token Permanente
                </h3>

                <p className="text-muted-foreground mb-4">
                  O token temporário da página API Setup expira em 24h. Vamos criar um permanente.
                </p>

                <Step number={1} title="Vá para Business Settings">
                  <p>Acesse <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">business.facebook.com/settings <ExternalLink className="h-3 w-3" /></a></p>
                </Step>

                <Step number={2} title="Crie um System User">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>No menu lateral, clique em <strong>Users</strong> → <strong>System Users</strong></li>
                    <li>Clique em <strong>Add</strong></li>
                    <li>Nome: <code className="bg-muted px-1 rounded">R3CF API</code></li>
                    <li>Role: Selecione <strong>Admin</strong></li>
                    <li>Clique em <strong>Create System User</strong></li>
                  </ol>
                </Step>

                <Step number={3} title="Adicione Assets ao System User">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Clique no System User criado</li>
                    <li>Clique em <strong>Add Assets</strong></li>
                    <li>Selecione <strong>Apps</strong> → Seu app do WhatsApp</li>
                    <li>Marque <strong>Full Control</strong></li>
                    <li>Clique em <strong>Save Changes</strong></li>
                  </ol>
                </Step>

                <Step number={4} title="Gere o Access Token">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Na página do System User, clique em <strong>Generate New Token</strong></li>
                    <li>Selecione seu app do WhatsApp</li>
                    <li>Marque as permissões:
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><code className="bg-muted px-1 rounded">whatsapp_business_messaging</code></li>
                        <li><code className="bg-muted px-1 rounded">whatsapp_business_management</code></li>
                      </ul>
                    </li>
                    <li>Selecione <strong>Never Expire</strong> para o token não expirar</li>
                    <li>Clique em <strong>Generate Token</strong></li>
                  </ol>
                </Step>

                <Warning>
                  <strong className="text-red-500">🚨 COPIE O TOKEN AGORA!</strong> Ele só aparece UMA VEZ. 
                  O token é muito longo (começa com "EAA..."). Guarde em um lugar seguro!
                </Warning>

                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium mb-2">Exemplo de Access Token:</p>
                  <code className="text-xs bg-background p-2 rounded block break-all">EAABsbCS1iHgBAKm7ZCZBZBgZD...</code>
                  <p className="text-xs text-muted-foreground mt-2">O token real é muito maior (centenas de caracteres)</p>
                </div>
              </div>

              {/* PARTE 4: Configurar Webhook */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">4</span>
                  PARTE 4: Configurar Webhook (Receber Mensagens)
                </h3>

                <p className="text-muted-foreground mb-4">
                  O webhook permite que seu app receba mensagens quando leads respondem no WhatsApp.
                </p>

                <Step number={1} title="Acesse a Configuration do WhatsApp">
                  <p>No menu lateral do seu App, clique em <strong>WhatsApp</strong> → <strong>Configuration</strong></p>
                </Step>

                <Step number={2} title="Configure o Webhook">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Na seção "Webhook", clique em <strong>Edit</strong></li>
                    <li>Cole no campo <strong>Callback URL</strong>:</li>
                  </ol>
                  <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-whatsapp`} />
                  <ol className="list-decimal list-inside space-y-2 mt-2" start={3}>
                    <li>Cole no campo <strong>Verify Token</strong>:</li>
                  </ol>
                  <CopyableUrl url="lovable_inbox_verify" />
                  <ol className="list-decimal list-inside space-y-2 mt-2" start={4}>
                    <li>Clique em <strong>Verify and Save</strong></li>
                  </ol>
                </Step>

                <Step number={3} title="Inscreva-se nos eventos de mensagem">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Após verificar, clique em <strong>Manage</strong></li>
                    <li>Encontre <strong>messages</strong> na lista</li>
                    <li>Marque a checkbox para ativar</li>
                    <li>Clique em <strong>Done</strong></li>
                  </ol>
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-700">✅ Se aparecer "Subscribed", o webhook está configurado!</p>
                  </div>
                </Step>

                <Tip>
                  Se a verificação falhar, verifique se a URL está correta e se não tem espaços. 
                  O sistema espera o token exato "lovable_inbox_verify".
                </Tip>
              </div>

              {/* PARTE 5: Configurar no App */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm">5</span>
                  PARTE 5: Configurar no App R3CF Leads Flow
                </h3>

                <Step number={1} title="Vá para Configurações">
                  <p>No menu lateral, clique em <strong>Configurações</strong>.</p>
                </Step>

                <Step number={2} title="Role até 'Credenciais de Mensagens' e clique na aba WhatsApp">
                  <p>Você verá 2 campos para preencher:</p>
                </Step>

                <div className="bg-muted/50 rounded-lg p-5 mt-3 space-y-4">
                  <div className="border-b pb-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      Access Token
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">O token permanente que você gerou (começa com EAA...)</p>
                    <code className="text-xs bg-background p-2 rounded block mt-2 break-all">EAABsbCS1iHgBAKm7ZCZBZBgZD...</code>
                  </div>
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      Phone Number ID
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">O ID do seu número na Meta (15 dígitos)</p>
                    <code className="text-xs bg-background p-2 rounded block mt-2">123456789012345</code>
                  </div>
                </div>

                <Step number={3} title="Clique em 'Salvar Configurações WhatsApp'">
                  <p>O status deve mudar para <strong className="text-green-500">✅ Configurado</strong>.</p>
                </Step>
              </div>

              {/* PARTE 6: Adicionar Test Numbers */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-yellow-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">6</span>
                  PARTE 6: Adicionar Números de Teste (Modo Desenvolvimento)
                </h3>

                <p className="text-muted-foreground mb-4">
                  Enquanto sua empresa não for verificada pela Meta, você só pode enviar mensagens para números cadastrados como teste.
                </p>

                <Step number={1} title="Volte para API Setup">
                  <p>No menu lateral, clique em <strong>WhatsApp</strong> → <strong>API Setup</strong></p>
                </Step>

                <Step number={2} title="Adicione números de teste">
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Role até a seção <strong>"To"</strong></li>
                    <li>Clique em <strong>Add phone number</strong></li>
                    <li>Adicione números para teste (seu celular, parceiros, etc.)</li>
                    <li>Cada número precisa receber um código de verificação</li>
                  </ol>
                </Step>

                <Warning>
                  <strong>Limite:</strong> No modo teste, você pode ter até 5 números de teste. 
                  Para enviar para qualquer número, complete a verificação do negócio.
                </Warning>
              </div>

              {/* PARTE 7: Testar */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">7</span>
                  PARTE 7: Fazer o Primeiro Teste
                </h3>

                <Step number={1} title="Crie um lead de teste">
                  <p>Vá em <strong>Prospecção AI</strong>, faça uma busca e salve um lead com um número de WhatsApp que está nos seus Test Numbers.</p>
                </Step>

                <Step number={2} title="Envie uma mensagem de teste">
                  <p>No <strong>CRM</strong>, clique no lead e depois em <strong className="text-green-500">📱 Enviar WhatsApp</strong>.</p>
                </Step>

                <Step number={3} title="Verifique o recebimento">
                  <p>A mensagem deve chegar no WhatsApp do número de teste em segundos.</p>
                </Step>

                <Step number={4} title="Responda a mensagem">
                  <p>Responda pelo WhatsApp e verifique se a resposta aparece na <strong>Caixa de Entrada</strong> do app!</p>
                </Step>

                <Tip>
                  <strong>Sucesso!</strong> Se a resposta aparecer na Caixa de Entrada, seu webhook está funcionando perfeitamente.
                </Tip>
              </div>

              {/* Verificação de Negócio */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-purple-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">+</span>
                  BÔNUS: Verificação de Negócio (Para Produção)
                </h3>

                <p className="text-muted-foreground mb-4">
                  Para sair do modo teste e enviar mensagens para qualquer número, você precisa verificar seu negócio.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">📄 Documentos Necessários:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• CNPJ da empresa</li>
                      <li>• Contrato Social ou equivalente</li>
                      <li>• Conta de luz/telefone em nome da empresa</li>
                      <li>• Site da empresa (opcional mas recomendado)</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">⏱️ Tempo de Aprovação:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Geralmente 1-3 dias úteis</li>
                      <li>• Pode demorar mais se houver pendências</li>
                      <li>• Meta pode solicitar documentos adicionais</li>
                    </ul>
                  </div>
                </div>

                <Step number={1} title="Inicie a verificação">
                  <p>Acesse <a href="https://business.facebook.com/settings/security" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">business.facebook.com/settings/security <ExternalLink className="h-3 w-3" /></a> e clique em "Start Verification"</p>
                </Step>
              </div>

              {/* Custos */}
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 border rounded-lg p-5 mt-4">
                <h4 className="font-bold mb-4">💰 Custos do WhatsApp Business API:</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Conversas Iniciadas pelo Negócio</p>
                      <p className="text-muted-foreground">~$0.05 USD por conversa (varia por país)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Conversas Iniciadas pelo Cliente</p>
                      <p className="text-muted-foreground">~$0.03 USD por conversa (mais barato)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">1.000 conversas GRÁTIS/mês</p>
                      <p className="text-muted-foreground">Meta oferece 1.000 conversas gratuitas todo mês</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * Preços podem variar. Consulte a <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tabela oficial da Meta</a>.
                </p>
              </div>

              {/* Video Tutorial Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Vídeos Tutoriais</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title="WhatsApp Cloud API - Configuração Completa 2024"
                    description="Tutorial atualizado sobre como criar app e configurar a API do WhatsApp"
                    youtubeId="Y8kihPdCI_U"
                  />
                  <VideoTutorial
                    title="WhatsApp Cloud API - Guia Rápido"
                    description="Quick start para enviar e receber primeiras mensagens"
                    youtubeId="q0ojEbdezFU"
                  />
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">🔗 Links Úteis:</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      📘 Documentação Oficial WhatsApp Cloud API <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      🔔 Documentação de Webhooks <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      ⚙️ Meta Business Settings <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      💰 Tabela de Preços WhatsApp <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
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
                <Phone className="h-5 w-5 text-blue-600" />
                <CardTitle>Guia COMPLETO: Configurar SMS via Twilio</CardTitle>
              </div>
              <CardDescription>
                Tutorial detalhado DO ZERO - Criação de conta, compra de número e configuração de webhook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Resumo Executivo */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Resumo: O que você vai configurar
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-blue-600 mb-1">📱 Conta Twilio</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Criar conta gratuita</li>
                      <li>• Verificar identidade</li>
                      <li>• Obter credenciais API</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-blue-600 mb-1">📞 Número de Telefone</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Comprar número SMS</li>
                      <li>• Configurar webhook</li>
                      <li>• Testar envio/recepção</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-blue-600 mb-1">⚙️ No App</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Account SID</li>
                      <li>• Auth Token</li>
                      <li>• Número de telefone</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm"><strong>⏱️ Tempo estimado:</strong> 10-20 minutos (se já tem cartão de crédito cadastrado)</p>
                </div>
              </div>

              {/* Pré-requisitos */}
              <div className="border border-blue-500/30 bg-blue-500/5 rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-600">
                  <AlertTriangle className="h-5 w-5" />
                  📋 PRÉ-REQUISITOS
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-medium">Você vai precisar de:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Cartão de crédito internacional</strong> (para verificação da conta)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Documento de identidade</strong> (RG ou CNH para verificação)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Telefone para verificação</strong> (receberá código por SMS)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="font-medium text-yellow-600 mb-2">💵 Sobre o Trial Gratuito:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Twilio oferece <strong>$15 USD de crédito grátis</strong></li>
                      <li>• Suficiente para ~300 SMS nacionais</li>
                      <li>• Não precisa pagar nada para testar</li>
                      <li>• Cartão só é necessário após trial</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tabela de Custos */}
              <div className="border rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  💰 Tabela de Custos - Twilio SMS
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Item</th>
                        <th className="text-left p-3 font-semibold">Custo (USD)</th>
                        <th className="text-left p-3 font-semibold">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 font-medium">📞 Número de Telefone (BR)</td>
                        <td className="p-3 text-blue-600 font-mono">$5.50/mês</td>
                        <td className="p-3 text-muted-foreground">Número brasileiro com SMS habilitado</td>
                      </tr>
                      <tr className="bg-muted/30">
                        <td className="p-3 font-medium">📤 SMS Enviado (BR)</td>
                        <td className="p-3 text-blue-600 font-mono">~$0.05/SMS</td>
                        <td className="p-3 text-muted-foreground">Varia por operadora do destinatário</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">📥 SMS Recebido (BR)</td>
                        <td className="p-3 text-blue-600 font-mono">$0.0075/SMS</td>
                        <td className="p-3 text-muted-foreground">Muito mais barato que enviar</td>
                      </tr>
                      <tr className="bg-muted/30">
                        <td className="p-3 font-medium">🇺🇸 Número USA</td>
                        <td className="p-3 text-blue-600 font-mono">$1.15/mês</td>
                        <td className="p-3 text-muted-foreground">Opção mais barata, mas +55 fica caro</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">🎁 Crédito Trial</td>
                        <td className="p-3 text-green-600 font-mono font-bold">$15 GRÁTIS</td>
                        <td className="p-3 text-muted-foreground">Para novos usuários</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * Preços aproximados. Consulte <a href="https://www.twilio.com/en-us/sms/pricing/br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">twilio.com/sms/pricing</a> para valores atualizados.
                </p>
              </div>

              {/* URL do Webhook */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">URL do Webhook (você vai precisar no Passo 6)</span>
                </div>
                <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-sms`} />
              </div>

              {/* Passo 1: Criar conta */}
              <Step number={1} title="Criar Conta no Twilio">
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>Acesse <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">twilio.com/try-twilio <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Clique em <strong>"Start for free"</strong></li>
                  <li>Preencha seus dados:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>Email (será seu login)</li>
                      <li>Nome completo</li>
                      <li>Senha forte</li>
                      <li>Número de telefone (para verificação)</li>
                    </ul>
                  </li>
                  <li>Confirme seu email clicando no link recebido</li>
                  <li>Verifique seu telefone inserindo o código SMS</li>
                </ol>
                <Tip>
                  <strong>Dica:</strong> Use seu email corporativo para facilitar a verificação de identidade posteriormente.
                </Tip>
              </Step>

              {/* Passo 2: Verificar Identidade */}
              <Step number={2} title="Verificar Identidade (Obrigatório)">
                <p className="text-muted-foreground mb-3">O Twilio exige verificação de identidade para prevenir fraudes. Sem isso, você não consegue comprar números.</p>
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>No console, vá em <strong>Settings → General → User Settings</strong></li>
                  <li>Clique em <strong>"Verify your identity"</strong></li>
                  <li>Escolha o tipo de documento:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li><strong>Passaporte</strong> (mais rápido - aprovação instantânea)</li>
                      <li><strong>RG ou CNH</strong> (pode levar até 24h)</li>
                    </ul>
                  </li>
                  <li>Tire uma foto do documento</li>
                  <li>Tire uma selfie para confirmação</li>
                  <li>Aguarde a aprovação</li>
                </ol>
                <Warning>
                  <strong>Importante:</strong> A verificação com passaporte é quase instantânea. RG/CNH pode demorar algumas horas para aprovação manual.
                </Warning>
              </Step>

              {/* Passo 3: Obter Credenciais API */}
              <Step number={3} title="Obter Account SID e Auth Token">
                <p className="text-muted-foreground mb-3">Essas são suas credenciais de API - você vai precisar delas para configurar no app.</p>
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>Acesse <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">console.twilio.com <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Na página inicial (Dashboard), localize o painel <strong>"Account Info"</strong></li>
                  <li>Copie o <strong>Account SID</strong> (começa com "AC")</li>
                  <li>Clique no ícone de olho para revelar o <strong>Auth Token</strong></li>
                  <li>Copie o Auth Token também</li>
                </ol>
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-600 mb-2">🔐 SEGURANÇA CRÍTICA:</p>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>NUNCA</strong> compartilhe seu Auth Token publicamente</li>
                    <li>• Não coloque em repositórios públicos (GitHub, etc.)</li>
                    <li>• Se vazar, regenere imediatamente no console</li>
                  </ul>
                </div>
              </Step>

              {/* Passo 4: Comprar Número */}
              <Step number={4} title="Comprar um Número de Telefone">
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>No console, vá em <strong>Phone Numbers → Manage → Buy a number</strong></li>
                  <li>Em "Country", selecione <strong>Brazil (+55)</strong></li>
                  <li>Marque a opção <strong>"SMS"</strong> em Capabilities</li>
                  <li>Clique em <strong>"Search"</strong></li>
                  <li>Escolha um número da lista disponível</li>
                  <li>Clique em <strong>"Buy"</strong> para confirmar a compra</li>
                </ol>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="font-medium text-blue-600 mb-2">📍 Sobre Números Brasileiros:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• DDDs disponíveis variam (11, 21, etc.)</li>
                      <li>• Custo: ~$5.50/mês</li>
                      <li>• SMS para qualquer operadora BR</li>
                    </ul>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <p className="font-medium text-amber-600 mb-2">🇺🇸 Alternativa - Número USA:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Mais barato: $1.15/mês</li>
                      <li>• SMS para BR funciona</li>
                      <li>• Leads veem número estrangeiro</li>
                    </ul>
                  </div>
                </div>
                <Tip>
                  <strong>Trial:</strong> Durante o trial gratuito, você pode usar os $15 de crédito para comprar um número e enviar SMS de teste.
                </Tip>
              </Step>

              {/* Passo 5: Configurar no App */}
              <Step number={5} title="Configurar Credenciais no App">
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>No app, acesse <strong>Configurações → Credenciais de Mensagens</strong></li>
                  <li>Na seção <strong className="text-blue-600">"SMS (Twilio)"</strong>, preencha:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                      <li><strong>Account SID:</strong> Cole o valor que começa com "AC..."</li>
                      <li><strong>Auth Token:</strong> Cole o token secreto</li>
                      <li><strong>Número de Telefone:</strong> No formato internacional (+5511...)</li>
                    </ul>
                  </li>
                  <li>Clique em <strong>"Salvar Configurações"</strong></li>
                </ol>
                <div className="mt-4 bg-muted rounded-lg p-4 font-mono text-sm">
                  <p className="text-muted-foreground mb-2">Exemplo de número no formato correto:</p>
                  <code className="text-blue-600">+5511999887766</code>
                </div>
              </Step>

              {/* Passo 6: Configurar Webhook */}
              <Step number={6} title="Configurar Webhook para Respostas">
                <p className="text-muted-foreground mb-3">Para que as respostas dos seus leads apareçam na Caixa de Entrada, configure o webhook:</p>
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>No console Twilio, vá em <strong>Phone Numbers → Manage → Active numbers</strong></li>
                  <li>Clique no número que você comprou</li>
                  <li>Role até a seção <strong>"Messaging Configuration"</strong></li>
                  <li>Em "A MESSAGE COMES IN":
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                      <li>Selecione <strong>"Webhook"</strong></li>
                      <li>Cole a URL: <code className="bg-muted px-2 py-1 rounded text-xs">{`${WEBHOOK_BASE_URL}/webhook-sms`}</code></li>
                      <li>Método: <strong>HTTP POST</strong></li>
                    </ul>
                  </li>
                  <li>Clique em <strong>"Save configuration"</strong></li>
                </ol>
                <div className="mt-4 bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Copie a URL do Webhook:</p>
                  <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-sms`} />
                </div>
              </Step>

              {/* Passo 7: Testar */}
              <Step number={7} title="Testar Envio e Recebimento">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">📤 Teste de ENVIO:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Vá em <strong>CRM → Leads</strong></li>
                      <li>Selecione um lead com telefone cadastrado</li>
                      <li>Clique no ícone de SMS</li>
                      <li>Envie uma mensagem de teste</li>
                      <li>Verifique se chegou no celular</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium mb-2">📥 Teste de RECEBIMENTO:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Do celular, responda o SMS recebido</li>
                      <li>Vá em <strong>Caixa de Entrada</strong> no app</li>
                      <li>A resposta deve aparecer em segundos</li>
                      <li>O canal deve mostrar ícone de SMS (azul)</li>
                    </ol>
                  </div>
                </div>
                <Tip>
                  <strong>Trial:</strong> Durante o trial, você só pode enviar SMS para números verificados. Adicione seu celular em <strong>Phone Numbers → Verified Caller IDs</strong>.
                </Tip>
              </Step>

              {/* Limitações do Trial */}
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  ⚠️ Limitações do Trial Gratuito
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span><strong>Apenas números verificados:</strong> Só pode enviar SMS para números que você cadastrou manualmente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span><strong>Prefixo nas mensagens:</strong> "Sent from your Twilio trial account" aparece no início de cada SMS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span><strong>Crédito limitado:</strong> $15 USD que expira após alguns meses</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm"><strong>Para remover limitações:</strong> Faça upgrade da conta adicionando créditos ou assinando um plano pago.</p>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="border rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  🔧 Resolução de Problemas
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>SMS não está sendo enviado</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>Verifique se o Account SID e Auth Token estão corretos</li>
                        <li>Confirme se o número está no formato +55...</li>
                        <li>No trial, verifique se o destinatário está em "Verified Caller IDs"</li>
                        <li>Cheque se há crédito suficiente na conta</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Respostas não aparecem na Caixa de Entrada</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>Verifique se a URL do webhook está correta no Twilio</li>
                        <li>Confirme que o método está como HTTP POST</li>
                        <li>Teste enviando uma mensagem para seu número Twilio</li>
                        <li>Verifique os logs de erro no console do Twilio</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Erro "21608: The 'To' phone number is not valid"</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>O número deve estar no formato E.164: +5511999887766</li>
                        <li>Não use parênteses, traços ou espaços</li>
                        <li>Inclua o código do país (+55 para Brasil)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Erro "21211: Invalid 'To' Phone Number"</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>No trial, você só pode enviar para números verificados</li>
                        <li>Adicione o número em: Phone Numbers → Verified Caller IDs</li>
                        <li>O Twilio enviará um código de verificação por ligação ou SMS</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Links Úteis */}
              <div className="border rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  🔗 Links Úteis
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm">Console do Twilio</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                  <a href="https://www.twilio.com/docs/sms" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Documentação SMS</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                  <a href="https://www.twilio.com/en-us/sms/pricing/br" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Preços SMS Brasil</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                  <a href="https://support.twilio.com" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Suporte Twilio</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </div>
              </div>

              {/* Video Tutorial Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">📺 Vídeos Tutoriais</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title="Como Usar Twilio SMS - Tutorial 2025"
                    description="Walkthrough completo do console Twilio"
                    youtubeId="TSJChz6adv8"
                  />
                  <VideoTutorial
                    title="Twilio Programmable SMS"
                    description="Entenda como funciona a plataforma Twilio"
                    youtubeId="knxlmCVFAZI"
                  />
                </div>
                <div className="mt-4">
                  <a 
                    href="https://www.youtube.com/results?search_query=twilio+sms+setup+tutorial" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Video className="h-4 w-4" />
                    Assistir mais tutoriais no YouTube
                    <ExternalLink className="h-3 w-3" />
                  </a>
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
                    youtubeId="omdy7tqAMWI"
                  />
                  <VideoTutorial
                    title="Configurar DNS para Email - DKIM, SPF, DMARC"
                    description="Tutorial detalhado sobre registros DNS para autenticação de email"
                    youtubeId="ixLAsfSQOb4"
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
