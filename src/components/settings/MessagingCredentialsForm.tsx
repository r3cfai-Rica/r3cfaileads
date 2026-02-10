import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Zap
} from 'lucide-react';

interface MessagingCredentials {
  id?: string;
  user_id?: string;
  whatsapp_access_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_configured: boolean;
  whatsapp_provider: 'meta' | 'evolution';
  evolution_api_url: string;
  evolution_api_key: string;
  evolution_instance_name: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  sms_configured: boolean;
  resend_api_key: string;
  email_from_address: string;
  email_from_name: string;
  email_configured: boolean;
}

const defaultCredentials: MessagingCredentials = {
  whatsapp_access_token: '',
  whatsapp_phone_number_id: '',
  whatsapp_configured: false,
  whatsapp_provider: 'meta',
  evolution_api_url: '',
  evolution_api_key: '',
  evolution_instance_name: '',
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_phone_number: '',
  sms_configured: false,
  resend_api_key: '',
  email_from_address: '',
  email_from_name: '',
  email_configured: false,
};

export const MessagingCredentialsForm: React.FC = () => {
  const [credentials, setCredentials] = useState<MessagingCredentials>(defaultCredentials);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTokens, setShowTokens] = useState({
    whatsapp: false,
    evolution: false,
    twilio: false,
    resend: false,
  });

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

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Parse metadata for evolution credentials if stored there
        const metadata = (data as any).metadata || {};
        
        setCredentials({
          id: data.id,
          user_id: data.user_id,
          whatsapp_access_token: data.whatsapp_access_token || '',
          whatsapp_phone_number_id: data.whatsapp_phone_number_id || '',
          whatsapp_configured: data.whatsapp_configured,
          whatsapp_provider: metadata.whatsapp_provider || 'meta',
          evolution_api_url: metadata.evolution_api_url || '',
          evolution_api_key: metadata.evolution_api_key || '',
          evolution_instance_name: metadata.evolution_instance_name || '',
          twilio_account_sid: data.twilio_account_sid || '',
          twilio_auth_token: data.twilio_auth_token || '',
          twilio_phone_number: data.twilio_phone_number || '',
          sms_configured: data.sms_configured,
          resend_api_key: data.resend_api_key || '',
          email_from_address: data.email_from_address || '',
          email_from_name: data.email_from_name || '',
          email_configured: data.email_configured,
        });
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      toast.error('Erro ao carregar credenciais');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (channel: 'whatsapp' | 'sms' | 'email') => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Build RPC params for encrypted save
      const rpcParams = { _user_id: user.id } as any;

      switch (channel) {
        case 'whatsapp':
          if (credentials.whatsapp_provider === 'evolution') {
            const isConfigured = !!(credentials.evolution_api_url && credentials.evolution_api_key && credentials.evolution_instance_name);
            rpcParams._whatsapp_access_token = ''; // Clear Meta credentials
            rpcParams._whatsapp_configured = isConfigured;
            // Evolution credentials go via direct update for metadata
            const metadataUpdate = {
              whatsapp_provider: 'evolution',
              evolution_api_url: credentials.evolution_api_url,
              evolution_api_key: credentials.evolution_api_key,
              evolution_instance_name: credentials.evolution_instance_name,
            };
            // Save encrypted fields via RPC first
            const { error: rpcError } = await supabase.rpc('save_encrypted_credentials', rpcParams);
            if (rpcError) throw rpcError;
            // Then update metadata separately
            const { error: metaError } = await supabase
              .from('user_messaging_credentials')
              .update({ metadata: metadataUpdate, whatsapp_configured: isConfigured })
              .eq('user_id', user.id);
            if (metaError) throw metaError;
            setCredentials(prev => ({ ...prev, whatsapp_configured: isConfigured }));
          } else {
            const isConfigured = !!(credentials.whatsapp_access_token && credentials.whatsapp_phone_number_id);
            rpcParams._whatsapp_access_token = credentials.whatsapp_access_token;
            rpcParams._whatsapp_phone_number_id = credentials.whatsapp_phone_number_id;
            rpcParams._whatsapp_configured = isConfigured;
            const { error: rpcError } = await supabase.rpc('save_encrypted_credentials', rpcParams);
            if (rpcError) throw rpcError;
            // Update metadata for provider
            await supabase
              .from('user_messaging_credentials')
              .update({ metadata: { whatsapp_provider: 'meta' } })
              .eq('user_id', user.id);
            setCredentials(prev => ({ ...prev, whatsapp_configured: isConfigured }));
          }
          break;
        case 'sms': {
          const isConfigured = !!(credentials.twilio_account_sid && credentials.twilio_auth_token && credentials.twilio_phone_number);
          rpcParams._twilio_account_sid = credentials.twilio_account_sid;
          rpcParams._twilio_auth_token = credentials.twilio_auth_token;
          rpcParams._twilio_phone_number = credentials.twilio_phone_number;
          rpcParams._sms_configured = isConfigured;
          const { error: rpcError } = await supabase.rpc('save_encrypted_credentials', rpcParams);
          if (rpcError) throw rpcError;
          setCredentials(prev => ({ ...prev, sms_configured: isConfigured }));
          break;
        }
        case 'email': {
          const isConfigured = !!(credentials.resend_api_key && credentials.email_from_address);
          rpcParams._resend_api_key = credentials.resend_api_key;
          rpcParams._email_from_address = credentials.email_from_address;
          rpcParams._email_from_name = credentials.email_from_name;
          rpcParams._email_configured = isConfigured;
          const { error: rpcError } = await supabase.rpc('save_encrypted_credentials', rpcParams);
          if (rpcError) throw rpcError;
          setCredentials(prev => ({ ...prev, email_configured: isConfigured }));
          break;
        }
      }

      const providerName = channel === 'whatsapp' 
        ? (credentials.whatsapp_provider === 'evolution' ? 'Evolution API' : 'WhatsApp Cloud API')
        : channel === 'sms' ? 'SMS' : 'Email';
      toast.success(`Configurações de ${providerName} salvas com criptografia!`);
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Erro ao salvar credenciais');
    } finally {
      setSaving(false);
    }
  };

  const StatusBadge = ({ configured }: { configured: boolean }) => (
    <Badge variant={configured ? 'default' : 'secondary'} className="gap-1">
      {configured ? (
        <>
          <CheckCircle2 className="w-3 h-3" />
          Configurado
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3" />
          Não configurado
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
          <MessageSquare className="w-5 h-5" />
          Configurações de Envio de Mensagens
        </CardTitle>
        <CardDescription>
          Configure suas APIs para enviar mensagens via WhatsApp, SMS e Email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <Phone className="w-4 h-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">WhatsApp API</h3>
              <StatusBadge configured={credentials.whatsapp_configured} />
            </div>
            
            {/* Provider Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Escolha o provedor:</Label>
              <RadioGroup
                value={credentials.whatsapp_provider}
                onValueChange={(v: 'meta' | 'evolution') => setCredentials(prev => ({ ...prev, whatsapp_provider: v }))}
                className="grid grid-cols-2 gap-4"
              >
                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  credentials.whatsapp_provider === 'meta' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
                }`}>
                  <RadioGroupItem value="meta" id="meta" />
                  <Label htmlFor="meta" className="flex-1 cursor-pointer">
                    <div className="font-medium">Meta Cloud API</div>
                    <div className="text-xs text-muted-foreground">WhatsApp Business oficial</div>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  credentials.whatsapp_provider === 'evolution' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
                }`}>
                  <RadioGroupItem value="evolution" id="evolution" />
                  <Label htmlFor="evolution" className="flex-1 cursor-pointer">
                    <div className="font-medium flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Evolution API
                    </div>
                    <div className="text-xs text-muted-foreground">Plataforma open-source</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Meta Cloud API Fields */}
            {credentials.whatsapp_provider === 'meta' && (
              <>
                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                  <p className="font-medium">Como obter suas credenciais:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Acesse o <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Meta for Developers <ExternalLink className="w-3 h-3" /></a></li>
                    <li>Crie um app do tipo "Business"</li>
                    <li>Adicione o produto "WhatsApp" ao seu app</li>
                    <li>Em "API Setup", copie o Access Token temporário ou gere um permanente</li>
                    <li>Copie o Phone Number ID</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_access_token">Access Token</Label>
                    <div className="relative">
                      <Input
                        id="whatsapp_access_token"
                        type={showTokens.whatsapp ? 'text' : 'password'}
                        value={credentials.whatsapp_access_token}
                        onChange={(e) => setCredentials(prev => ({ ...prev, whatsapp_access_token: e.target.value }))}
                        placeholder="EAAxxxxxx..."
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowTokens(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                      >
                        {showTokens.whatsapp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_phone_number_id">Phone Number ID</Label>
                    <Input
                      id="whatsapp_phone_number_id"
                      value={credentials.whatsapp_phone_number_id}
                      onChange={(e) => setCredentials(prev => ({ ...prev, whatsapp_phone_number_id: e.target.value }))}
                      placeholder="1234567890..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* Evolution API Fields */}
            {credentials.whatsapp_provider === 'evolution' && (
              <>
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-lg text-sm space-y-2 border border-yellow-500/20">
                  <p className="font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Evolution API - Configuração
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Tenha sua instância Evolution API rodando</li>
                    <li>Copie a URL base da sua API (ex: https://api.seudominio.com)</li>
                    <li>Copie sua API Key de autenticação</li>
                    <li>Informe o nome da instância conectada ao WhatsApp</li>
                  </ol>
                  <a 
                    href="https://doc.evolution-api.com/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
                  >
                    Ver documentação <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="evolution_api_url">URL da API</Label>
                    <Input
                      id="evolution_api_url"
                      type="url"
                      value={credentials.evolution_api_url}
                      onChange={(e) => setCredentials(prev => ({ ...prev, evolution_api_url: e.target.value }))}
                      placeholder="https://api.seudominio.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evolution_api_key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="evolution_api_key"
                        type={showTokens.evolution ? 'text' : 'password'}
                        value={credentials.evolution_api_key}
                        onChange={(e) => setCredentials(prev => ({ ...prev, evolution_api_key: e.target.value }))}
                        placeholder="Sua API Key"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowTokens(prev => ({ ...prev, evolution: !prev.evolution }))}
                      >
                        {showTokens.evolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evolution_instance_name">Nome da Instância</Label>
                    <Input
                      id="evolution_instance_name"
                      value={credentials.evolution_instance_name}
                      onChange={(e) => setCredentials(prev => ({ ...prev, evolution_instance_name: e.target.value }))}
                      placeholder="minha-instancia"
                    />
                  </div>
                </div>
              </>
            )}

            <Button onClick={() => handleSave('whatsapp')} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações WhatsApp
            </Button>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Twilio SMS</h3>
              <StatusBadge configured={credentials.sms_configured} />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
              <p className="font-medium">Como obter suas credenciais:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Crie uma conta em <a href="https://www.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Twilio <ExternalLink className="w-3 h-3" /></a></li>
                <li>Copie o Account SID e Auth Token do Console</li>
                <li>Compre um número de telefone para envio</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twilio_account_sid">Account SID</Label>
                <Input
                  id="twilio_account_sid"
                  value={credentials.twilio_account_sid}
                  onChange={(e) => setCredentials(prev => ({ ...prev, twilio_account_sid: e.target.value }))}
                  placeholder="ACxxxxxx..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio_auth_token">Auth Token</Label>
                <div className="relative">
                  <Input
                    id="twilio_auth_token"
                    type={showTokens.twilio ? 'text' : 'password'}
                    value={credentials.twilio_auth_token}
                    onChange={(e) => setCredentials(prev => ({ ...prev, twilio_auth_token: e.target.value }))}
                    placeholder="Seu Auth Token"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowTokens(prev => ({ ...prev, twilio: !prev.twilio }))}
                  >
                    {showTokens.twilio ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio_phone_number">Número de Telefone (formato: +5511999999999)</Label>
                <Input
                  id="twilio_phone_number"
                  value={credentials.twilio_phone_number}
                  onChange={(e) => setCredentials(prev => ({ ...prev, twilio_phone_number: e.target.value }))}
                  placeholder="+5511999999999"
                />
              </div>

              <Button onClick={() => handleSave('sms')} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configurações SMS
              </Button>
            </div>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Email (Resend)</h3>
              <StatusBadge configured={credentials.email_configured} />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
              <p className="font-medium">Como obter suas credenciais:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Crie uma conta em <a href="https://resend.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Resend <ExternalLink className="w-3 h-3" /></a></li>
                <li>Verifique seu domínio de email</li>
                <li>Gere uma API Key</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend_api_key">API Key</Label>
                <div className="relative">
                  <Input
                    id="resend_api_key"
                    type={showTokens.resend ? 'text' : 'password'}
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
                    onClick={() => setShowTokens(prev => ({ ...prev, resend: !prev.resend }))}
                  >
                    {showTokens.resend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_from_address">Email de Envio</Label>
                <Input
                  id="email_from_address"
                  type="email"
                  value={credentials.email_from_address}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email_from_address: e.target.value }))}
                  placeholder="contato@seudominio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_from_name">Nome do Remetente</Label>
                <Input
                  id="email_from_name"
                  value={credentials.email_from_name}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email_from_name: e.target.value }))}
                  placeholder="Sua Empresa"
                />
              </div>

              <Button onClick={() => handleSave('email')} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configurações Email
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MessagingCredentialsForm;
