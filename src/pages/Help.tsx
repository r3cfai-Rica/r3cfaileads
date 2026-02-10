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
  BotMessageSquare
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

const CopyableUrl: React.FC<{ url: string; label?: string }> = ({ url }) => {
  const [copied, setCopied] = useState(false);
  const { language } = useApp();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: language === 'pt-BR' ? 'URL copiada!' : 'URL copied!' });
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
  const { language } = useApp();
  const pt = language === 'pt-BR';
  const youtubeUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;

  const thumbUrl = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : undefined;

  return (
    <div className="space-y-3">
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-lg overflow-hidden border bg-muted/30"
        aria-label={`${pt ? 'Abrir vídeo no YouTube' : 'Open video on YouTube'}: ${title}`}
      >
        <AspectRatio ratio={16 / 9}>
          {thumbUrl ? (
            <div className="relative h-full w-full">
              <img
                src={thumbUrl}
                alt={`${pt ? 'Miniatura do vídeo' : 'Video thumbnail'}: ${title}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-full border border-border bg-background/70 backdrop-blur-sm p-3 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Play className="h-6 w-6 text-foreground" />
                  <span className="sr-only">{pt ? 'Assistir no YouTube' : 'Watch on YouTube'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              {pt ? 'Clique em "Assistir" para abrir no YouTube' : 'Click "Watch" to open on YouTube'}
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
            {pt ? 'Assistir' : 'Watch'}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
};

export default function Help() {
  const { language } = useApp();
  const pt = language === 'pt-BR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">
          {pt ? 'Central de Ajuda' : 'Help Center'}
        </h1>
      </div>

      <p className="text-muted-foreground">
        {pt 
          ? <>Aprenda como configurar os webhooks para receber respostas de <span className="font-bold text-green-600">WhatsApp</span>, <span className="font-bold text-blue-600">SMS</span>, <span className="font-bold text-orange-500">Email</span> e <span className="font-bold text-[#0088cc]">Telegram</span> diretamente na sua Caixa de Entrada.</>
          : <>Learn how to configure webhooks to receive responses from <span className="font-bold text-green-600">WhatsApp</span>, <span className="font-bold text-blue-600">SMS</span>, <span className="font-bold text-orange-500">Email</span> and <span className="font-bold text-[#0088cc]">Telegram</span> directly in your Inbox.</>
        }
      </p>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            <span className="font-bold text-green-600">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-blue-600">SMS</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4 text-orange-500" />
            <span className="font-bold text-orange-500">Email</span>
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-2">
            <BotMessageSquare className="h-4 w-4 text-[#0088cc]" />
            <span className="font-bold text-[#0088cc]">Telegram</span>
          </TabsTrigger>
        </TabsList>

        {/* ============ WhatsApp Configuration ============ */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <CardTitle>{pt ? 'Guia COMPLETO: Configurar WhatsApp Business API' : 'COMPLETE Guide: Configure WhatsApp Business API'}</CardTitle>
              </div>
              <CardDescription>
                {pt ? 'Tutorial detalhado DO ZERO - Inclui criação de App na Meta, configuração de webhook e primeiro teste' : 'Detailed tutorial FROM SCRATCH - Includes Meta App creation, webhook setup and first test'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Summary */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  {pt ? 'Resumo: O que você vai configurar' : 'Summary: What you will configure'}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-green-600 mb-1">📱 Meta Business Suite</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• {pt ? 'Conta Business verificada' : 'Verified Business account'}</li>
                      <li>• {pt ? 'Número de telefone' : 'Phone number'}</li>
                      <li>• {pt ? 'App no Meta Developers' : 'App on Meta Developers'}</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-green-600 mb-1">🔗 Webhook</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• {pt ? 'URL de callback' : 'Callback URL'}</li>
                      <li>• {pt ? 'Token de verificação' : 'Verification token'}</li>
                      <li>• {pt ? 'Eventos de mensagem' : 'Message events'}</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-green-600 mb-1">⚙️ {pt ? 'No App' : 'In the App'}</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Access Token</li>
                      <li>• Phone Number ID</li>
                      <li>• {pt ? 'Número de envio' : 'Sending number'}</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm"><strong>⏱️ {pt ? 'Tempo estimado:' : 'Estimated time:'}</strong> {pt ? '30-60 minutos (verificação da Meta pode levar mais)' : '30-60 minutes (Meta verification may take longer)'}</p>
                </div>
              </div>

              {/* Prerequisites */}
              <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  ⚠️ {pt ? 'PRÉ-REQUISITOS OBRIGATÓRIOS' : 'MANDATORY PREREQUISITES'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {pt ? 'Antes de começar, você precisa ter:' : 'Before starting, you need:'}
                </p>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">✅ {pt ? 'Conta no Facebook' : 'Facebook Account'}</p>
                    <p className="text-xs text-muted-foreground">{pt ? 'Conta pessoal ativa para acessar o Meta for Developers' : 'Active personal account to access Meta for Developers'}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">✅ Meta Business Account</p>
                    <p className="text-xs text-muted-foreground">{pt ? 'Conta business para associar ao WhatsApp' : 'Business account to associate with WhatsApp'}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">✅ {pt ? 'Número de Telefone' : 'Phone Number'}</p>
                    <p className="text-xs text-muted-foreground">{pt ? 'Número que NÃO esteja vinculado ao WhatsApp pessoal' : 'Number NOT linked to personal WhatsApp'}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="font-bold text-sm">✅ {pt ? 'Verificação de Negócio' : 'Business Verification'}</p>
                    <p className="text-xs text-muted-foreground">{pt ? 'CNPJ ou documentos da empresa (para sair do modo teste)' : 'Business documents (to leave test mode)'}</p>
                  </div>
                </div>
                <Warning>
                  <strong>{pt ? 'IMPORTANTE:' : 'IMPORTANT:'}</strong> {pt 
                    ? <>O número usado para a API do WhatsApp Business <strong className="text-red-500">NÃO PODE</strong> estar vinculado a um WhatsApp pessoal. Use um número novo ou desvincule o existente.</>
                    : <>The number used for the WhatsApp Business API <strong className="text-red-500">CANNOT</strong> be linked to a personal WhatsApp. Use a new number or unlink the existing one.</>
                  }
                </Warning>
              </div>

              {/* Important URLs */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">{pt ? 'URL do Webhook (copie!)' : 'Webhook URL (copy!)'}</span>
                  </div>
                  <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-whatsapp`} />
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span className="font-medium">{pt ? 'Token de Verificação (copie!)' : 'Verification Token (copy!)'}</span>
                  </div>
                  <CopyableUrl url="lovable_inbox_verify" />
                </div>
              </div>

              {/* PART 1 */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">1</span>
                  {pt ? 'PARTE 1: Criar App no Meta for Developers' : 'PART 1: Create App on Meta for Developers'}
                </h3>
                
                <Step number={1} title={pt ? 'Acesse o Meta for Developers' : 'Access Meta for Developers'}>
                  <p>{pt ? 'Vá para' : 'Go to'} <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">developers.facebook.com <ExternalLink className="h-3 w-3" /></a></p>
                  <p className="mt-2 text-sm">{pt ? 'Faça login com sua conta do Facebook.' : 'Log in with your Facebook account.'}</p>
                </Step>

                <Step number={2} title={pt ? 'Crie um novo App' : 'Create a new App'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Clique em' : 'Click on'} <strong className="text-green-500">My Apps</strong> {pt ? 'no canto superior direito' : 'in the top right corner'}</li>
                    <li>{pt ? 'Clique em' : 'Click on'} <strong>Create App</strong></li>
                    <li>{pt ? 'Selecione' : 'Select'} <strong>"Other"</strong> {pt ? 'como tipo de uso' : 'as usage type'}</li>
                    <li>{pt ? 'Selecione' : 'Select'} <strong>"Business"</strong> {pt ? 'como tipo de app' : 'as app type'}</li>
                    <li>{pt ? 'Dê um nome ao app (ex: "R3CF WhatsApp")' : 'Name your app (e.g.: "R3CF WhatsApp")'}</li>
                    <li>{pt ? 'Clique em' : 'Click on'} <strong>Create App</strong></li>
                  </ol>
                </Step>

                <Step number={3} title={pt ? 'Adicione o produto WhatsApp' : 'Add the WhatsApp product'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Na tela do App Dashboard, role até "Add Products to Your App"' : 'On the App Dashboard screen, scroll to "Add Products to Your App"'}</li>
                    <li>{pt ? 'Encontre' : 'Find'} <strong className="text-green-500">WhatsApp</strong> {pt ? 'e clique em' : 'and click'} <strong>Set Up</strong></li>
                    <li>{pt ? 'Selecione sua Meta Business Account (ou crie uma nova)' : 'Select your Meta Business Account (or create a new one)'}</li>
                  </ol>
                </Step>

                <Tip>
                  {pt 
                    ? 'Se você não tem uma Meta Business Account, o assistente vai te guiar para criar uma. Siga os passos e tenha em mãos os dados da sua empresa.'
                    : "If you don't have a Meta Business Account, the wizard will guide you to create one. Follow the steps and have your company information ready."}
                </Tip>
              </div>

              {/* PART 2 */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">2</span>
                  {pt ? 'PARTE 2: Configurar Número de Telefone' : 'PART 2: Configure Phone Number'}
                </h3>

                <Step number={1} title={pt ? 'Acesse a seção "API Setup"' : 'Access the "API Setup" section'}>
                  <p>{pt ? 'No menu lateral, clique em' : 'In the sidebar, click on'} <strong>WhatsApp</strong> → <strong>API Setup</strong></p>
                </Step>

                <Step number={2} title={pt ? 'Adicione seu número de telefone' : 'Add your phone number'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Na seção "From", você verá um número de teste da Meta' : 'In the "From" section, you will see a Meta test number'}</li>
                    <li>{pt ? 'Para usar seu próprio número, clique em' : 'To use your own number, click on'} <strong>Add phone number</strong></li>
                    <li>{pt ? 'Preencha:' : 'Fill in:'}
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><strong>Display Name:</strong> {pt ? 'Nome que aparece no WhatsApp (ex: "Empresa XYZ")' : 'Name shown on WhatsApp (e.g.: "Company XYZ")'}</li>
                        <li><strong>Phone Number:</strong> {pt ? 'Seu número com código do país (+55...)' : 'Your number with country code (+1...)'}</li>
                      </ul>
                    </li>
                    <li>{pt ? 'Escolha como verificar:' : 'Choose verification method:'} <strong>SMS</strong> {pt ? 'ou' : 'or'} <strong>{pt ? 'Ligação' : 'Call'}</strong></li>
                    <li>{pt ? 'Insira o código de verificação recebido' : 'Enter the verification code received'}</li>
                  </ol>
                </Step>

                <Step number={3} title={pt ? 'Anote o Phone Number ID' : 'Note the Phone Number ID'}>
                  <p>{pt ? 'Após verificar, você verá o' : 'After verifying, you will see the'} <strong>Phone Number ID</strong> {pt ? 'na página. Copie esse valor!' : 'on the page. Copy this value!'}</p>
                  <div className="bg-muted/50 rounded-lg p-4 mt-3">
                    <p className="text-sm font-medium mb-2">{pt ? 'Exemplo de Phone Number ID:' : 'Phone Number ID example:'}</p>
                    <code className="text-xs bg-background p-2 rounded block">123456789012345</code>
                    <p className="text-xs text-muted-foreground mt-2">{pt ? 'É um número grande, normalmente 15 dígitos' : 'It is a large number, usually 15 digits'}</p>
                  </div>
                </Step>

                <Warning>
                  <strong>{pt ? 'Modo de Teste:' : 'Test Mode:'}</strong> {pt 
                    ? 'Enquanto sua empresa não for verificada, você só pode enviar mensagens para números adicionados como "Test Numbers". Para produção, complete a verificação do negócio.'
                    : 'Until your business is verified, you can only send messages to numbers added as "Test Numbers". For production, complete the business verification.'}
                </Warning>
              </div>

              {/* PART 3 */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">3</span>
                  {pt ? 'PARTE 3: Gerar Access Token Permanente' : 'PART 3: Generate Permanent Access Token'}
                </h3>

                <p className="text-muted-foreground mb-4">
                  {pt ? 'O token temporário da página API Setup expira em 24h. Vamos criar um permanente.' : 'The temporary token from the API Setup page expires in 24h. Let\'s create a permanent one.'}
                </p>

                <Step number={1} title={pt ? 'Vá para Business Settings' : 'Go to Business Settings'}>
                  <p>{pt ? 'Acesse' : 'Go to'} <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">business.facebook.com/settings <ExternalLink className="h-3 w-3" /></a></p>
                </Step>

                <Step number={2} title={pt ? 'Crie um System User' : 'Create a System User'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'No menu lateral, clique em' : 'In the sidebar, click on'} <strong>Users</strong> → <strong>System Users</strong></li>
                    <li>{pt ? 'Clique em' : 'Click'} <strong>Add</strong></li>
                    <li>{pt ? 'Nome:' : 'Name:'} <code className="bg-muted px-1 rounded">R3CF API</code></li>
                    <li>Role: {pt ? 'Selecione' : 'Select'} <strong>Admin</strong></li>
                    <li>{pt ? 'Clique em' : 'Click'} <strong>Create System User</strong></li>
                  </ol>
                </Step>

                <Step number={3} title={pt ? 'Adicione Assets ao System User' : 'Add Assets to System User'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Clique no System User criado' : 'Click on the created System User'}</li>
                    <li>{pt ? 'Clique em' : 'Click on'} <strong>Add Assets</strong></li>
                    <li>{pt ? 'Selecione' : 'Select'} <strong>Apps</strong> → {pt ? 'Seu app do WhatsApp' : 'Your WhatsApp app'}</li>
                    <li>{pt ? 'Marque' : 'Check'} <strong>Full Control</strong></li>
                    <li>{pt ? 'Clique em' : 'Click'} <strong>Save Changes</strong></li>
                  </ol>
                </Step>

                <Step number={4} title={pt ? 'Gere o Access Token' : 'Generate the Access Token'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Na página do System User, clique em' : 'On the System User page, click'} <strong>Generate New Token</strong></li>
                    <li>{pt ? 'Selecione seu app do WhatsApp' : 'Select your WhatsApp app'}</li>
                    <li>{pt ? 'Marque as permissões:' : 'Check the permissions:'}
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><code className="bg-muted px-1 rounded">whatsapp_business_messaging</code></li>
                        <li><code className="bg-muted px-1 rounded">whatsapp_business_management</code></li>
                      </ul>
                    </li>
                    <li>{pt ? 'Selecione' : 'Select'} <strong>Never Expire</strong> {pt ? 'para o token não expirar' : 'so the token does not expire'}</li>
                    <li>{pt ? 'Clique em' : 'Click'} <strong>Generate Token</strong></li>
                  </ol>
                </Step>

                <Warning>
                  <strong className="text-red-500">🚨 {pt ? 'COPIE O TOKEN AGORA!' : 'COPY THE TOKEN NOW!'}</strong> {pt 
                    ? 'Ele só aparece UMA VEZ. O token é muito longo (começa com "EAA..."). Guarde em um lugar seguro!'
                    : 'It only appears ONCE. The token is very long (starts with "EAA..."). Store it somewhere safe!'}
                </Warning>
              </div>

              {/* PART 4: Webhook */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">4</span>
                  {pt ? 'PARTE 4: Configurar Webhook (Receber Mensagens)' : 'PART 4: Configure Webhook (Receive Messages)'}
                </h3>

                <p className="text-muted-foreground mb-4">
                  {pt ? 'O webhook permite que seu app receba mensagens quando leads respondem no WhatsApp.' : 'The webhook allows your app to receive messages when leads reply on WhatsApp.'}
                </p>

                <Step number={1} title={pt ? 'Acesse a Configuration do WhatsApp' : 'Access WhatsApp Configuration'}>
                  <p>{pt ? 'No menu lateral do seu App, clique em' : 'In your App sidebar, click on'} <strong>WhatsApp</strong> → <strong>Configuration</strong></p>
                </Step>

                <Step number={2} title={pt ? 'Configure o Webhook' : 'Configure the Webhook'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Na seção "Webhook", clique em' : 'In the "Webhook" section, click'} <strong>Edit</strong></li>
                    <li>{pt ? 'Cole no campo' : 'Paste in the'} <strong>Callback URL</strong>{pt ? ':' : ' field:'}</li>
                  </ol>
                  <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-whatsapp`} />
                  <ol className="list-decimal list-inside space-y-2 mt-2" start={3}>
                    <li>{pt ? 'Cole no campo' : 'Paste in the'} <strong>Verify Token</strong>{pt ? ':' : ' field:'}</li>
                  </ol>
                  <CopyableUrl url="lovable_inbox_verify" />
                  <ol className="list-decimal list-inside space-y-2 mt-2" start={4}>
                    <li>{pt ? 'Clique em' : 'Click'} <strong>Verify and Save</strong></li>
                  </ol>
                </Step>

                <Step number={3} title={pt ? 'Inscreva-se nos eventos de mensagem' : 'Subscribe to message events'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Após verificar, clique em' : 'After verifying, click'} <strong>Manage</strong></li>
                    <li>{pt ? 'Encontre' : 'Find'} <strong>messages</strong> {pt ? 'na lista' : 'in the list'}</li>
                    <li>{pt ? 'Marque a checkbox para ativar' : 'Check the checkbox to activate'}</li>
                    <li>{pt ? 'Clique em' : 'Click'} <strong>Done</strong></li>
                  </ol>
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-700">✅ {pt ? 'Se aparecer "Subscribed", o webhook está configurado!' : 'If "Subscribed" appears, the webhook is configured!'}</p>
                  </div>
                </Step>

                <Tip>
                  {pt 
                    ? 'Se a verificação falhar, verifique se a URL está correta e se não tem espaços. O sistema espera o token exato "lovable_inbox_verify".'
                    : 'If verification fails, check that the URL is correct and has no spaces. The system expects the exact token "lovable_inbox_verify".'}
                </Tip>
              </div>

              {/* PART 5: Configure in App */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm">5</span>
                  {pt ? 'PARTE 5: Configurar no App R3CF Leads Flow' : 'PART 5: Configure in R3CF Leads Flow App'}
                </h3>

                <Step number={1} title={pt ? 'Vá para Configurações' : 'Go to Settings'}>
                  <p>{pt ? 'No menu lateral, clique em' : 'In the sidebar, click on'} <strong>{pt ? 'Configurações' : 'Settings'}</strong>.</p>
                </Step>

                <Step number={2} title={pt ? 'Role até "Credenciais de Mensagens" e clique na aba WhatsApp' : 'Scroll to "Messaging Credentials" and click the WhatsApp tab'}>
                  <p>{pt ? 'Você verá 2 campos para preencher:' : 'You will see 2 fields to fill in:'}</p>
                </Step>

                <div className="bg-muted/50 rounded-lg p-5 mt-3 space-y-4">
                  <div className="border-b pb-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      Access Token
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{pt ? 'O token permanente que você gerou (começa com EAA...)' : 'The permanent token you generated (starts with EAA...)'}</p>
                    <code className="text-xs bg-background p-2 rounded block mt-2 break-all">EAABsbCS1iHgBAKm7ZCZBZBgZD...</code>
                  </div>
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      Phone Number ID
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{pt ? 'O ID do seu número na Meta (15 dígitos)' : 'Your Meta number ID (15 digits)'}</p>
                    <code className="text-xs bg-background p-2 rounded block mt-2">123456789012345</code>
                  </div>
                </div>

                <Step number={3} title={pt ? 'Clique em "Salvar Configurações WhatsApp"' : 'Click "Save WhatsApp Settings"'}>
                  <p>{pt ? 'O status deve mudar para' : 'The status should change to'} <strong className="text-green-500">✅ {pt ? 'Configurado' : 'Configured'}</strong>.</p>
                </Step>
              </div>

              {/* PART 6: Test Numbers */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-yellow-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">6</span>
                  {pt ? 'PARTE 6: Adicionar Números de Teste (Modo Desenvolvimento)' : 'PART 6: Add Test Numbers (Development Mode)'}
                </h3>

                <p className="text-muted-foreground mb-4">
                  {pt ? 'Enquanto sua empresa não for verificada pela Meta, você só pode enviar mensagens para números cadastrados como teste.' : 'Until your business is verified by Meta, you can only send messages to numbers registered as test.'}
                </p>

                <Step number={1} title={pt ? 'Volte para API Setup' : 'Go back to API Setup'}>
                  <p>{pt ? 'No menu lateral, clique em' : 'In the sidebar, click on'} <strong>WhatsApp</strong> → <strong>API Setup</strong></p>
                </Step>

                <Step number={2} title={pt ? 'Adicione números de teste' : 'Add test numbers'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Role até a seção' : 'Scroll to the'} <strong>"To"</strong> {pt ? '' : 'section'}</li>
                    <li>{pt ? 'Clique em' : 'Click'} <strong>Add phone number</strong></li>
                    <li>{pt ? 'Adicione números para teste (seu celular, parceiros, etc.)' : 'Add numbers for testing (your phone, partners, etc.)'}</li>
                    <li>{pt ? 'Cada número precisa receber um código de verificação' : 'Each number needs to receive a verification code'}</li>
                  </ol>
                </Step>

                <Warning>
                  <strong>{pt ? 'Limite:' : 'Limit:'}</strong> {pt 
                    ? 'No modo teste, você pode ter até 5 números de teste. Para enviar para qualquer número, complete a verificação do negócio.'
                    : 'In test mode, you can have up to 5 test numbers. To send to any number, complete the business verification.'}
                </Warning>
              </div>

              {/* PART 7: Test */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">7</span>
                  {pt ? 'PARTE 7: Fazer o Primeiro Teste' : 'PART 7: Run Your First Test'}
                </h3>

                <Step number={1} title={pt ? 'Crie um lead de teste' : 'Create a test lead'}>
                  <p>{pt ? 'Vá em' : 'Go to'} <strong>{pt ? 'Prospecção AI' : 'AI Prospecting'}</strong>{pt ? ', faça uma busca e salve um lead com um número de WhatsApp que está nos seus Test Numbers.' : ', run a search and save a lead with a WhatsApp number from your Test Numbers.'}</p>
                </Step>

                <Step number={2} title={pt ? 'Envie uma mensagem de teste' : 'Send a test message'}>
                  <p>{pt ? 'No' : 'In the'} <strong>CRM</strong>{pt ? ', clique no lead e depois em' : ', click the lead and then'} <strong className="text-green-500">{pt ? '📱 Enviar WhatsApp' : '📱 Send WhatsApp'}</strong>.</p>
                </Step>

                <Step number={3} title={pt ? 'Verifique o recebimento' : 'Verify receipt'}>
                  <p>{pt ? 'A mensagem deve chegar no WhatsApp do número de teste em segundos.' : 'The message should arrive on the test number\'s WhatsApp within seconds.'}</p>
                </Step>

                <Step number={4} title={pt ? 'Responda a mensagem' : 'Reply to the message'}>
                  <p>{pt ? 'Responda pelo WhatsApp e verifique se a resposta aparece na' : 'Reply via WhatsApp and check if the reply appears in the'} <strong>{pt ? 'Caixa de Entrada' : 'Inbox'}</strong> {pt ? 'do app!' : 'of the app!'}</p>
                </Step>

                <Tip>
                  <strong>{pt ? 'Sucesso!' : 'Success!'}</strong> {pt 
                    ? 'Se a resposta aparecer na Caixa de Entrada, seu webhook está funcionando perfeitamente.'
                    : 'If the reply appears in the Inbox, your webhook is working perfectly.'}
                </Tip>
              </div>

              {/* Costs */}
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 border rounded-lg p-5 mt-4">
                <h4 className="font-bold mb-4">💰 {pt ? 'Custos do WhatsApp Business API:' : 'WhatsApp Business API Costs:'}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{pt ? 'Conversas Iniciadas pelo Negócio' : 'Business-Initiated Conversations'}</p>
                      <p className="text-muted-foreground">{pt ? '~$0.05 USD por conversa (varia por país)' : '~$0.05 USD per conversation (varies by country)'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{pt ? 'Conversas Iniciadas pelo Cliente' : 'Customer-Initiated Conversations'}</p>
                      <p className="text-muted-foreground">{pt ? '~$0.03 USD por conversa (mais barato)' : '~$0.03 USD per conversation (cheaper)'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{pt ? '1.000 conversas GRÁTIS/mês' : '1,000 FREE conversations/month'}</p>
                      <p className="text-muted-foreground">{pt ? 'Meta oferece 1.000 conversas gratuitas todo mês' : 'Meta offers 1,000 free conversations every month'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Tutorials */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{pt ? 'Vídeos Tutoriais' : 'Tutorial Videos'}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title={pt ? 'WhatsApp Cloud API - Configuração Completa 2024' : 'WhatsApp Cloud API - Complete Setup 2024'}
                    description={pt ? 'Tutorial atualizado sobre como criar app e configurar a API do WhatsApp' : 'Updated tutorial on creating an app and configuring WhatsApp API'}
                    youtubeId="Y8kihPdCI_U"
                  />
                  <VideoTutorial
                    title={pt ? 'WhatsApp Cloud API - Guia Rápido' : 'WhatsApp Cloud API - Quick Start'}
                    description={pt ? 'Quick start para enviar e receber primeiras mensagens' : 'Quick start to send and receive your first messages'}
                    youtubeId="q0ojEbdezFU"
                  />
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">🔗 {pt ? 'Links Úteis:' : 'Useful Links:'}</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      📘 {pt ? 'Documentação Oficial WhatsApp Cloud API' : 'Official WhatsApp Cloud API Docs'} <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      🔔 {pt ? 'Documentação de Webhooks' : 'Webhooks Documentation'} <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      ⚙️ Meta Business Settings <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      💰 {pt ? 'Tabela de Preços WhatsApp' : 'WhatsApp Pricing Table'} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SMS Configuration ============ */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <CardTitle>{pt ? 'Guia COMPLETO: Configurar SMS via Twilio' : 'COMPLETE Guide: Configure SMS via Twilio'}</CardTitle>
              </div>
              <CardDescription>
                {pt ? 'Tutorial detalhado DO ZERO - Criação de conta, compra de número e configuração de webhook' : 'Detailed tutorial FROM SCRATCH - Account creation, number purchase and webhook setup'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Webhook URL */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">{pt ? 'URL do Webhook' : 'Webhook URL'}</span>
                </div>
                <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-sms`} />
              </div>

              <Step number={1} title={pt ? 'Criar Conta no Twilio' : 'Create Twilio Account'}>
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>{pt ? 'Acesse' : 'Go to'} <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">twilio.com/try-twilio <ExternalLink className="h-3 w-3" /></a></li>
                  <li>{pt ? 'Clique em' : 'Click'} <strong>"Start for free"</strong></li>
                  <li>{pt ? 'Preencha seus dados' : 'Fill in your details'}</li>
                  <li>{pt ? 'Confirme seu email clicando no link recebido' : 'Confirm your email by clicking the link received'}</li>
                  <li>{pt ? 'Verifique seu telefone inserindo o código SMS' : 'Verify your phone by entering the SMS code'}</li>
                </ol>
              </Step>

              <Step number={2} title={pt ? 'Obter Account SID e Auth Token' : 'Get Account SID and Auth Token'}>
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>{pt ? 'Acesse' : 'Go to'} <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">console.twilio.com <ExternalLink className="h-3 w-3" /></a></li>
                  <li>{pt ? 'Na página inicial, localize o painel' : 'On the dashboard, find the'} <strong>"Account Info"</strong> {pt ? '' : 'panel'}</li>
                  <li>{pt ? 'Copie o' : 'Copy the'} <strong>Account SID</strong> {pt ? '(começa com "AC")' : '(starts with "AC")'}</li>
                  <li>{pt ? 'Copie o' : 'Copy the'} <strong>Auth Token</strong></li>
                </ol>
              </Step>

              <Step number={3} title={pt ? 'Comprar um Número de Telefone' : 'Buy a Phone Number'}>
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>{pt ? 'No console, vá em' : 'In the console, go to'} <strong>Phone Numbers → Manage → Buy a number</strong></li>
                  <li>{pt ? 'Selecione o país' : 'Select the country'}</li>
                  <li>{pt ? 'Marque a opção' : 'Check the'} <strong>"SMS"</strong> {pt ? 'em Capabilities' : 'option in Capabilities'}</li>
                  <li>{pt ? 'Clique em' : 'Click'} <strong>"Search"</strong></li>
                  <li>{pt ? 'Escolha um número e clique em' : 'Choose a number and click'} <strong>"Buy"</strong></li>
                </ol>
              </Step>

              <Step number={4} title={pt ? 'Configurar Credenciais no App' : 'Configure Credentials in the App'}>
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>{pt ? 'No app, acesse' : 'In the app, go to'} <strong>{pt ? 'Configurações → Credenciais de Mensagens' : 'Settings → Messaging Credentials'}</strong></li>
                  <li>{pt ? 'Na seção' : 'In the'} <strong className="text-blue-600">"SMS (Twilio)"</strong> {pt ? 'preencha os campos' : 'section, fill in the fields'}</li>
                  <li>{pt ? 'Clique em' : 'Click'} <strong>{pt ? '"Salvar Configurações"' : '"Save Settings"'}</strong></li>
                </ol>
              </Step>

              <Step number={5} title={pt ? 'Configurar Webhook para Respostas' : 'Configure Webhook for Replies'}>
                <ol className="list-decimal list-inside space-y-3 mt-3">
                  <li>{pt ? 'No console Twilio, vá em' : 'In Twilio console, go to'} <strong>Phone Numbers → Manage → Active numbers</strong></li>
                  <li>{pt ? 'Clique no número que você comprou' : 'Click on the number you bought'}</li>
                  <li>{pt ? 'Em "A MESSAGE COMES IN":' : 'In "A MESSAGE COMES IN":'}</li>
                </ol>
                <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-sms`} />
              </Step>

              <Step number={6} title={pt ? 'Testar Envio e Recebimento' : 'Test Sending and Receiving'}>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">📤 {pt ? 'Teste de ENVIO:' : 'SEND Test:'}</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>{pt ? 'Vá em CRM → Leads' : 'Go to CRM → Leads'}</li>
                      <li>{pt ? 'Selecione um lead com telefone cadastrado' : 'Select a lead with a registered phone'}</li>
                      <li>{pt ? 'Clique no ícone de SMS e envie' : 'Click the SMS icon and send'}</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium mb-2">📥 {pt ? 'Teste de RECEBIMENTO:' : 'RECEIVE Test:'}</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>{pt ? 'Do celular, responda o SMS recebido' : 'From your phone, reply to the SMS received'}</li>
                      <li>{pt ? 'Vá em Caixa de Entrada no app' : 'Go to Inbox in the app'}</li>
                      <li>{pt ? 'A resposta deve aparecer em segundos' : 'The reply should appear within seconds'}</li>
                    </ol>
                  </div>
                </div>
              </Step>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Email Configuration ============ */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-500" />
                <CardTitle>{pt ? 'Guia COMPLETO: Configurar Email via Resend' : 'COMPLETE Guide: Configure Email via Resend'}</CardTitle>
              </div>
              <CardDescription>
                {pt ? 'Tutorial detalhado DO ZERO - Conta, verificação de domínio, DNS e primeiro envio' : 'Detailed tutorial FROM SCRATCH - Account, domain verification, DNS and first send'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Webhook URL */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">{pt ? 'URL do Webhook' : 'Webhook URL'}</span>
                </div>
                <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-email`} />
              </div>

              <Step number={1} title={pt ? 'Criar Conta no Resend' : 'Create Resend Account'}>
                <p>{pt ? 'Vá para' : 'Go to'} <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">resend.com/signup <ExternalLink className="h-3 w-3" /></a></p>
                <Tip>
                  <strong>{pt ? 'Plano Gratuito:' : 'Free Plan:'}</strong> {pt ? 'O Resend oferece 100 emails/dia e 3.000/mês sem pagar nada.' : 'Resend offers 100 emails/day and 3,000/month for free.'}
                </Tip>
              </Step>

              <Step number={2} title={pt ? 'Adicionar e Verificar Domínio' : 'Add and Verify Domain'}>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>{pt ? 'Acesse' : 'Go to'} <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">resend.com/domains <ExternalLink className="h-3 w-3" /></a></li>
                  <li>{pt ? 'Clique em' : 'Click'} <strong className="text-orange-500">+ Add Domain</strong></li>
                  <li>{pt ? 'Adicione os registros DNS conforme indicado pelo Resend' : 'Add DNS records as indicated by Resend'}</li>
                  <li>{pt ? 'Aguarde a propagação e clique em "Verify DNS Records"' : 'Wait for propagation and click "Verify DNS Records"'}</li>
                </ol>
              </Step>

              <Step number={3} title={pt ? 'Criar API Key' : 'Create API Key'}>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>{pt ? 'Acesse' : 'Go to'} <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">resend.com/api-keys <ExternalLink className="h-3 w-3" /></a></li>
                  <li>{pt ? 'Clique em' : 'Click'} <strong className="text-purple-500">+ Create API Key</strong></li>
                  <li>{pt ? 'Selecione Full Access e crie' : 'Select Full Access and create'}</li>
                </ol>
                <Warning>
                  <strong className="text-red-500">🚨 {pt ? 'COPIE A CHAVE AGORA!' : 'COPY THE KEY NOW!'}</strong> {pt ? 'A API Key só aparece UMA VEZ.' : 'The API Key only appears ONCE.'}
                </Warning>
              </Step>

              <Step number={4} title={pt ? 'Configurar no App' : 'Configure in the App'}>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>{pt ? 'Vá em Configurações → Credenciais de Mensagens → aba Email' : 'Go to Settings → Messaging Credentials → Email tab'}</li>
                  <li>{pt ? 'Cole a API Key, email de envio e nome do remetente' : 'Paste the API Key, sender email and sender name'}</li>
                  <li>{pt ? 'Clique em "Salvar Configurações Email"' : 'Click "Save Email Settings"'}</li>
                </ol>
              </Step>

              <Step number={5} title={pt ? 'Configurar Webhook para Respostas' : 'Configure Webhook for Replies'}>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>{pt ? 'Acesse' : 'Go to'} <a href="https://resend.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">resend.com/webhooks <ExternalLink className="h-3 w-3" /></a></li>
                  <li>{pt ? 'Clique em' : 'Click'} <strong>+ Add Webhook</strong></li>
                  <li>{pt ? 'Cole a URL do webhook:' : 'Paste the webhook URL:'}</li>
                </ol>
                <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-email`} />
              </Step>

              {/* Video Tutorials */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{pt ? 'Vídeos Tutoriais' : 'Tutorial Videos'}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title={pt ? 'Resend: Configuração Completa do Zero' : 'Resend: Complete Setup from Scratch'}
                    description={pt ? 'Como criar conta, verificar domínio e enviar o primeiro email' : 'How to create account, verify domain and send your first email'}
                    youtubeId="omdy7tqAMWI"
                  />
                  <VideoTutorial
                    title={pt ? 'Configurar DNS para Email - DKIM, SPF, DMARC' : 'Configure DNS for Email - DKIM, SPF, DMARC'}
                    description={pt ? 'Tutorial detalhado sobre registros DNS para autenticação de email' : 'Detailed tutorial on DNS records for email authentication'}
                    youtubeId="ixLAsfSQOb4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Telegram Configuration ============ */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BotMessageSquare className="h-5 w-5 text-[#0088cc]" />
                <CardTitle>{pt ? 'Guia COMPLETO: Configurar Telegram Bot API' : 'COMPLETE Guide: Configure Telegram Bot API'}</CardTitle>
              </div>
              <CardDescription>
                {pt ? 'Tutorial detalhado DO ZERO - Criação de bot, configuração de webhook e primeiro teste' : 'Detailed tutorial FROM SCRATCH - Bot creation, webhook setup and first test'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Summary */}
              <div className="bg-gradient-to-r from-[#0088cc]/10 to-cyan-500/10 border border-[#0088cc]/20 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#0088cc]" />
                  {pt ? 'Resumo: O que você vai configurar' : 'Summary: What you will configure'}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-[#0088cc] mb-1">🤖 {pt ? 'Bot do Telegram' : 'Telegram Bot'}</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• {pt ? 'Criar bot via @BotFather' : 'Create bot via @BotFather'}</li>
                      <li>• {pt ? 'Token de acesso' : 'Access token'}</li>
                      <li>• {pt ? 'Nome e username do bot' : 'Bot name and username'}</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-[#0088cc] mb-1">🔗 Webhook</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• {pt ? 'URL de callback' : 'Callback URL'}</li>
                      <li>• {pt ? 'Receber mensagens' : 'Receive messages'}</li>
                      <li>• {pt ? 'Respostas na Caixa de Entrada' : 'Replies in Inbox'}</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="font-medium text-sm text-[#0088cc] mb-1">💬 Chat ID</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• {pt ? 'Lead inicia conversa' : 'Lead starts conversation'}</li>
                      <li>• {pt ? 'Sistema captura ID' : 'System captures ID'}</li>
                      <li>• {pt ? 'Você envia mensagens' : 'You send messages'}</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-lg">
                  <p className="text-sm"><strong>⏱️ {pt ? 'Tempo estimado:' : 'Estimated time:'}</strong> {pt ? '10-15 minutos (mais rápido que os outros canais!)' : '10-15 minutes (faster than other channels!)'}</p>
                </div>
              </div>

              {/* Important note */}
              <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  ⚠️ {pt ? 'IMPORTANTE: Como funciona o Telegram' : 'IMPORTANT: How Telegram works'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {pt 
                    ? 'Diferente do WhatsApp e SMS, no Telegram o lead precisa iniciar a conversa primeiro com seu bot.'
                    : 'Unlike WhatsApp and SMS, on Telegram the lead needs to start the conversation first with your bot.'}
                </p>
                <Tip>
                  <strong>{pt ? 'Estratégia:' : 'Strategy:'}</strong> {pt 
                    ? 'Compartilhe o link do seu bot (t.me/seubotname) em materiais de marketing. Quando o lead clicar e enviar /start, você poderá contatá-lo!'
                    : 'Share your bot link (t.me/yourbotname) in marketing materials. When the lead clicks and sends /start, you can contact them!'}
                </Tip>
              </div>

              {/* URLs */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium">{pt ? 'URL do Webhook (copie!)' : 'Webhook URL (copy!)'}</span>
                  </div>
                  <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-telegram`} />
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BotMessageSquare className="h-4 w-4 text-[#0088cc]" />
                    <span className="font-medium">{pt ? 'Acesse o BotFather' : 'Access BotFather'}</span>
                  </div>
                  <Button asChild variant="outline" className="w-full mt-2">
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="gap-2">
                      {pt ? 'Abrir @BotFather' : 'Open @BotFather'} <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* PART 1 */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-[#0088cc] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">1</span>
                  {pt ? 'PARTE 1: Criar Bot no Telegram' : 'PART 1: Create Bot on Telegram'}
                </h3>
                
                <Step number={1} title={pt ? 'Abra o Telegram e busque @BotFather' : 'Open Telegram and search @BotFather'}>
                  <p>{pt ? 'O BotFather é o bot oficial do Telegram para criar e gerenciar bots.' : 'BotFather is the official Telegram bot for creating and managing bots.'}</p>
                  <p className="mt-2">{pt ? 'Você pode acessar diretamente:' : 'You can access directly:'} <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">t.me/BotFather <ExternalLink className="h-3 w-3" /></a></p>
                </Step>

                <Step number={2} title={pt ? 'Inicie a conversa e crie um novo bot' : 'Start the conversation and create a new bot'}>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>{pt ? 'Clique em' : 'Click'} <strong>START</strong> {pt ? 'ou envie' : 'or send'} <code className="bg-muted px-2 py-1 rounded">/start</code></li>
                    <li>{pt ? 'Envie o comando' : 'Send the command'} <code className="bg-muted px-2 py-1 rounded">/newbot</code></li>
                    <li>{pt ? 'O BotFather vai pedir um nome para seu bot' : 'BotFather will ask for a name for your bot'}</li>
                    <li>{pt ? 'Depois, vai pedir um username (deve terminar em "bot")' : 'Then, it will ask for a username (must end with "bot")'}</li>
                  </ol>
                </Step>

                <Step number={3} title={pt ? 'Copie o Token de Acesso' : 'Copy the Access Token'}>
                  <p>{pt ? 'Após criar o bot, o BotFather vai enviar uma mensagem com o token de acesso.' : 'After creating the bot, BotFather will send a message with the access token.'}</p>
                  <div className="bg-muted/50 rounded-lg p-4 mt-3">
                    <p className="text-sm font-medium mb-2">{pt ? 'Exemplo de Token:' : 'Token example:'}</p>
                    <code className="text-xs bg-background p-2 rounded block break-all">7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw</code>
                  </div>
                </Step>

                <Warning>
                  <strong className="text-red-500">🚨 {pt ? 'GUARDE O TOKEN COM SEGURANÇA!' : 'STORE THE TOKEN SAFELY!'}</strong> {pt 
                    ? 'Qualquer pessoa com seu token pode controlar seu bot. Nunca compartilhe publicamente!'
                    : 'Anyone with your token can control your bot. Never share it publicly!'}
                </Warning>
              </div>

              {/* PART 2 */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">2</span>
                  {pt ? 'PARTE 2: Configurar Webhook (Receber Mensagens)' : 'PART 2: Configure Webhook (Receive Messages)'}
                </h3>

                <Step number={1} title={pt ? 'Configure o webhook usando a URL abaixo' : 'Configure the webhook using the URL below'}>
                  <p>{pt ? 'Abra seu navegador e acesse a seguinte URL (substitua SEU_TOKEN pelo token do seu bot):' : 'Open your browser and access the following URL (replace YOUR_TOKEN with your bot token):'}</p>
                  <div className="bg-muted/50 rounded-lg p-4 mt-3">
                    <code className="text-xs break-all block">
                      https://api.telegram.org/bot<span className="text-[#0088cc] font-bold">{pt ? 'SEU_TOKEN' : 'YOUR_TOKEN'}</span>/setWebhook?url={WEBHOOK_BASE_URL}/webhook-telegram
                    </code>
                  </div>
                </Step>

                <Step number={2} title={pt ? 'Verifique a resposta' : 'Verify the response'}>
                  <p>{pt ? 'Você deve ver uma resposta JSON como:' : 'You should see a JSON response like:'}</p>
                  <div className="bg-muted/50 rounded-lg p-3 mt-2">
                    <code className="text-xs text-green-500">{`{"ok":true,"result":true,"description":"Webhook was set"}`}</code>
                  </div>
                </Step>
              </div>

              {/* PART 3: Test */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">3</span>
                  {pt ? 'PARTE 3: Fazer o Primeiro Teste' : 'PART 3: Run Your First Test'}
                </h3>

                <Step number={1} title={pt ? 'Encontre seu bot no Telegram' : 'Find your bot on Telegram'}>
                  <p>{pt ? 'Busque pelo username do seu bot e clique em' : 'Search for your bot username and click'} <strong>START</strong>.</p>
                </Step>

                <Step number={2} title={pt ? 'Envie uma mensagem de teste' : 'Send a test message'}>
                  <p>{pt ? 'Escreva qualquer mensagem para o bot. Isso vai criar seu Chat ID no sistema e aparecer na Caixa de Entrada.' : 'Write any message to the bot. This will create your Chat ID in the system and appear in the Inbox.'}</p>
                </Step>

                <Step number={3} title={pt ? 'Verifique na Caixa de Entrada' : 'Check the Inbox'}>
                  <p>{pt ? 'A mensagem deve aparecer na Caixa de Entrada do app com o ícone do Telegram.' : 'The message should appear in the app Inbox with the Telegram icon.'}</p>
                </Step>

                <Tip>
                  <strong>{pt ? 'Sucesso!' : 'Success!'}</strong> {pt 
                    ? 'Se a mensagem aparecer na Caixa de Entrada, seu bot está configurado corretamente!'
                    : 'If the message appears in the Inbox, your bot is configured correctly!'}
                </Tip>
              </div>

              {/* Video Tutorials */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{pt ? 'Vídeos Tutoriais' : 'Tutorial Videos'}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <VideoTutorial
                    title={pt ? 'Como criar um Bot no Telegram (BotFather)' : 'How to create a Telegram Bot (BotFather)'}
                    description={pt ? 'Tutorial completo para criar e configurar seu primeiro bot' : 'Complete tutorial to create and configure your first bot'}
                    youtubeId="aNmRNjME6mE"
                  />
                  <VideoTutorial
                    title={pt ? 'Telegram Bot API - Guia Completo' : 'Telegram Bot API - Complete Guide'}
                    description={pt ? 'Como usar a API do Telegram para enviar mensagens' : 'How to use the Telegram API to send messages'}
                    youtubeId="UQrcOj63S2o"
                  />
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">🔗 {pt ? 'Links Úteis:' : 'Useful Links:'}</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <a href="https://core.telegram.org/bots#how-do-i-create-a-bot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      📘 {pt ? 'Documentação Oficial de Bots' : 'Official Bot Documentation'} <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://core.telegram.org/bots/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      🔧 {pt ? 'Referência da Bot API' : 'Bot API Reference'} <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      🤖 @BotFather {pt ? 'no Telegram' : 'on Telegram'} <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://core.telegram.org/bots/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      🔔 {pt ? 'Documentação de Webhooks' : 'Webhooks Documentation'} <ExternalLink className="h-3 w-3" />
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
            {pt ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{pt ? 'O webhook não está recebendo mensagens. O que fazer?' : 'The webhook is not receiving messages. What to do?'}</AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal list-inside space-y-2">
                  <li>{pt ? 'Verifique se a URL do webhook foi copiada corretamente' : 'Check that the webhook URL was copied correctly'}</li>
                  <li>{pt ? 'Confirme que o token de verificação está correto (para WhatsApp)' : 'Confirm that the verification token is correct (for WhatsApp)'}</li>
                  <li>{pt ? 'Teste se o webhook está acessível acessando a URL no navegador' : 'Test if the webhook is accessible by visiting the URL in your browser'}</li>
                  <li>{pt ? 'Verifique os logs do webhook no painel da plataforma' : 'Check webhook logs in the platform dashboard'}</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>{pt ? 'As mensagens estão chegando com atraso?' : 'Are messages arriving with delay?'}</AccordionTrigger>
              <AccordionContent>
                {pt 
                  ? 'Normalmente as mensagens chegam em segundos. Se houver atraso, pode ser congestionamento na rede, problemas temporários no servidor ou fila de processamento. Aguarde alguns minutos e teste novamente.'
                  : 'Normally messages arrive within seconds. If there is a delay, it could be network congestion, temporary server issues or processing queue. Wait a few minutes and test again.'}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>{pt ? 'Preciso pagar algo extra para usar os webhooks?' : 'Do I need to pay extra to use webhooks?'}</AccordionTrigger>
              <AccordionContent>
                <strong>{pt ? 'Não!' : 'No!'}</strong> {pt 
                  ? 'Os webhooks são gratuitos. Você só paga pelos envios normais das plataformas (WhatsApp, Twilio, Resend).'
                  : 'Webhooks are free. You only pay for regular sends through the platforms (WhatsApp, Twilio, Resend).'}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>{pt ? 'As conversas são salvas automaticamente?' : 'Are conversations saved automatically?'}</AccordionTrigger>
              <AccordionContent>
                <strong>{pt ? 'Sim!' : 'Yes!'}</strong> {pt 
                  ? 'Todas as mensagens enviadas e recebidas são salvas automaticamente no banco de dados. Você pode visualizar o histórico completo na Caixa de Entrada.'
                  : 'All sent and received messages are automatically saved in the database. You can view the complete history in the Inbox.'}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>{pt ? 'Links Úteis' : 'Useful Links'}</CardTitle>
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
                <p className="font-medium">{pt ? 'Documentação WhatsApp' : 'WhatsApp Documentation'}</p>
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
                <p className="font-medium">{pt ? 'Documentação Twilio' : 'Twilio Documentation'}</p>
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
                <p className="font-medium">{pt ? 'Documentação Resend' : 'Resend Documentation'}</p>
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
