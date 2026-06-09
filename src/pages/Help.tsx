import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Key,
  Globe,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const WEBHOOK_BASE_URL = 'https://gylxzoogrqqeqihqknkm.supabase.co/functions/v1';

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
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

const CopyableUrl: React.FC<{ url: string }> = ({ url }) => {
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

export default function Help() {
  const { language } = useApp();
  const pt = language === 'pt-BR';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">
          {pt ? 'Central de Ajuda' : 'Help Center'}
        </h1>
      </div>

      <p className="text-muted-foreground">
        {pt
          ? <>Aprenda como configurar o envio de <span className="font-bold text-orange-500">Email</span> através do Resend.</>
          : <>Learn how to configure <span className="font-bold text-orange-500">Email</span> sending through Resend.</>}
      </p>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            <CardTitle>{pt ? 'Guia: Configurar Email com Resend' : 'Guide: Configure Email with Resend'}</CardTitle>
          </div>
          <CardDescription>
            {pt
              ? 'Passo a passo para configurar o envio de emails usando o Resend.'
              : 'Step by step to configure email sending using Resend.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="font-medium">{pt ? 'Site do Resend' : 'Resend website'}</span>
              </div>
              <CopyableUrl url="https://resend.com" />
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-primary" />
                <span className="font-medium">{pt ? 'Webhook (recebimento)' : 'Webhook (incoming)'}</span>
              </div>
              <CopyableUrl url={`${WEBHOOK_BASE_URL}/webhook-email`} />
            </div>
          </div>

          <Step number={1} title={pt ? 'Crie uma conta gratuita no Resend' : 'Create a free account on Resend'}>
            <p>
              {pt ? 'Acesse ' : 'Go to '}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                resend.com <ExternalLink className="h-3 w-3" />
              </a>
              {pt ? ' e crie uma conta com seu email profissional.' : ' and create an account with your business email.'}
            </p>
          </Step>

          <Step number={2} title={pt ? 'Verifique seu domínio' : 'Verify your domain'}>
            <p>{pt ? 'No painel, vá em "Domains" e adicione o domínio que você quer usar (ex: seudominio.com).' : 'In the dashboard, go to "Domains" and add the domain you want to use (e.g. yourdomain.com).'}</p>
            <p className="mt-2">{pt ? 'Adicione os registros DNS (SPF, DKIM e DMARC) fornecidos pelo Resend no painel do seu provedor de domínio.' : 'Add the DNS records (SPF, DKIM, DMARC) provided by Resend in your domain provider panel.'}</p>
            <Warning>
              {pt
                ? 'A verificação do domínio pode levar de alguns minutos até 24h. Sem domínio verificado, você só consegue enviar para seu próprio email.'
                : 'Domain verification can take from minutes to 24h. Without a verified domain, you can only send to your own email.'}
            </Warning>
          </Step>

          <Step number={3} title={pt ? 'Gere uma API Key' : 'Generate an API Key'}>
            <p>{pt ? 'No painel do Resend, clique em "API Keys" no menu lateral e depois em "Create API Key".' : 'In the Resend dashboard, click "API Keys" in the sidebar and then "Create API Key".'}</p>
            <p className="mt-2">{pt ? 'Dê um nome (ex: "R3CF Leads") e selecione permissão "Full access".' : 'Give it a name (e.g. "R3CF Leads") and select "Full access" permission.'}</p>
            <p className="mt-2">{pt ? 'Copie a chave gerada (começa com "re_") — ela só aparece uma vez.' : 'Copy the generated key (starts with "re_") — it is only shown once.'}</p>
          </Step>

          <Step number={4} title={pt ? 'Cole as credenciais em Configurações' : 'Paste credentials in Settings'}>
            <p>{pt ? 'Volte para o app, vá em "Configurações" e preencha:' : 'Go back to the app, open "Settings" and fill in:'}</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>API Key</strong>: {pt ? 'a chave que você copiou do Resend' : 'the key you copied from Resend'}</li>
              <li><strong>{pt ? 'Email de Envio' : 'Sender Email'}</strong>: {pt ? 'um email do domínio verificado (ex: contato@seudominio.com)' : 'an email from the verified domain (e.g. contact@yourdomain.com)'}</li>
              <li><strong>{pt ? 'Nome do Remetente' : 'Sender Name'}</strong>: {pt ? 'o nome que aparecerá para quem receber (ex: sua empresa)' : 'the name shown to recipients (e.g. your company)'}</li>
            </ul>
            <p className="mt-2">{pt ? 'Clique em "Salvar Configurações Email".' : 'Click "Save Email Settings".'}</p>
          </Step>

          <Step number={5} title={pt ? 'Teste o envio' : 'Test sending'}>
            <p>{pt ? 'Na página de Mensagens, selecione um lead com email e envie uma mensagem de teste para validar a configuração.' : 'On the Messaging page, pick a lead with email and send a test message to validate the setup.'}</p>
            <Tip>
              {pt
                ? 'Dica: use seu próprio email como primeiro teste para confirmar que tudo está funcionando antes de enviar para clientes reais.'
                : 'Tip: use your own email as the first test to confirm everything works before sending to real customers.'}
            </Tip>
          </Step>
        </CardContent>
      </Card>
    </div>
  );
}
