import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import {
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

interface EmailCredentials {
  resend_api_key: string;
  email_from_address: string;
  email_from_name: string;
  email_configured: boolean;
}

const defaultCredentials: EmailCredentials = {
  resend_api_key: '',
  email_from_address: '',
  email_from_name: '',
  email_configured: false,
};

const STORAGE_KEY = 'messaging-credentials-draft';

export const MessagingCredentialsForm: React.FC = () => {
  const { language } = useApp();
  const pt = language === 'pt-BR';

  const [credentials, setCredentials] = useState<EmailCredentials>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          resend_api_key: parsed.resend_api_key || '',
          email_from_address: parsed.email_from_address || '',
          email_from_name: parsed.email_from_name || '',
          email_configured: parsed.email_configured || false,
        };
      }
    } catch {}
    return defaultCredentials;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const hasLoadedFromDb = useRef(false);

  useEffect(() => {
    if (hasLoadedFromDb.current) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    }
  }, [credentials]);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_messaging_credentials')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCredentials({
          resend_api_key: data.resend_api_key || '',
          email_from_address: data.email_from_address || '',
          email_from_name: data.email_from_name || '',
          email_configured: data.email_configured,
        });
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      toast.error(pt ? 'Erro ao carregar credenciais' : 'Error loading credentials');
    } finally {
      hasLoadedFromDb.current = true;
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(pt ? 'Usuário não autenticado' : 'User not authenticated');

      const isConfigured = !!(credentials.resend_api_key && credentials.email_from_address);
      const rpcParams: any = {
        _user_id: user.id,
        _resend_api_key: credentials.resend_api_key,
        _email_from_address: credentials.email_from_address,
        _email_from_name: credentials.email_from_name,
        _email_configured: isConfigured,
      };

      const { error: rpcError } = await supabase.rpc('save_encrypted_credentials', rpcParams);
      if (rpcError) throw rpcError;

      setCredentials(prev => ({ ...prev, email_configured: isConfigured }));
      toast.success(pt ? 'Configurações de Email salvas com criptografia!' : 'Email settings saved with encryption!');
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error(pt ? 'Erro ao salvar credenciais' : 'Error saving credentials');
    } finally {
      setSaving(false);
    }
  };

  const StatusBadge = ({ configured }: { configured: boolean }) => (
    <Badge variant={configured ? 'default' : 'secondary'} className="gap-1">
      {configured ? (
        <>
          <CheckCircle2 className="w-3 h-3" />
          {pt ? 'Configurado' : 'Configured'}
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3" />
          {pt ? 'Não configurado' : 'Not configured'}
        </>
      )}
    </Badge>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {pt ? 'Configurações de Envio de Email' : 'Email Settings'}
        </CardTitle>
        <CardDescription>
          {pt ? 'Configure sua API Resend para enviar emails' : 'Configure your Resend API to send emails'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Email (Resend)</h3>
          <StatusBadge configured={credentials.email_configured} />
        </div>

        <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
          <p className="font-medium">{pt ? 'Como obter suas credenciais:' : 'How to get your credentials:'}</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>
              {pt ? 'Crie uma conta gratuita em' : 'Create a free account at'}{' '}
              <a href="https://resend.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                Resend <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>{pt ? 'Verifique seu domínio de email em "Domains"' : 'Verify your email domain in "Domains"'}</li>
            <li>{pt ? 'Acesse "API Keys" e clique em "Create API Key"' : 'Go to "API Keys" and click "Create API Key"'}</li>
            <li>{pt ? 'Copie a chave (começa com "re_") e cole abaixo' : 'Copy the key (starts with "re_") and paste below'}</li>
            <li>{pt ? 'Informe o email de envio (deve ser do domínio verificado)' : 'Enter the sender email (must be from the verified domain)'}</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resend_api_key">API Key</Label>
            <div className="relative">
              <Input
                id="resend_api_key"
                type={showToken ? 'text' : 'password'}
                value={credentials.resend_api_key}
                onChange={(e) => setCredentials(prev => ({ ...prev, resend_api_key: e.target.value }))}
                placeholder="re_xxxxxx..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowToken(s => !s)}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_from_address">{pt ? 'Email de Envio' : 'Sender Email'}</Label>
            <Input
              id="email_from_address"
              type="email"
              value={credentials.email_from_address}
              onChange={(e) => setCredentials(prev => ({ ...prev, email_from_address: e.target.value }))}
              placeholder={pt ? 'contato@seudominio.com' : 'contact@yourdomain.com'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_from_name">{pt ? 'Nome do Remetente' : 'Sender Name'}</Label>
            <Input
              id="email_from_name"
              value={credentials.email_from_name}
              onChange={(e) => setCredentials(prev => ({ ...prev, email_from_name: e.target.value }))}
              placeholder={pt ? 'Sua Empresa' : 'Your Company'}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {pt ? 'Salvar Configurações Email' : 'Save Email Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagingCredentialsForm;
