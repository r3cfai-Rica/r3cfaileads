import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ExternalLink
} from 'lucide-react';

interface MessagingCredentials {
  id?: string;
  user_id?: string;
  whatsapp_access_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_configured: boolean;
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
        setCredentials({
          id: data.id,
          user_id: data.user_id,
          whatsapp_access_token: data.whatsapp_access_token || '',
          whatsapp_phone_number_id: data.whatsapp_phone_number_id || '',
          whatsapp_configured: data.whatsapp_configured,
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

      let updateData: Partial<MessagingCredentials> = {};
      let isConfigured = false;

      switch (channel) {
        case 'whatsapp':
          isConfigured = !!(credentials.whatsapp_access_token && credentials.whatsapp_phone_number_id);
          updateData = {
            whatsapp_access_token: credentials.whatsapp_access_token,
            whatsapp_phone_number_id: credentials.whatsapp_phone_number_id,
            whatsapp_configured: isConfigured,
          };
          break;
        case 'sms':
          isConfigured = !!(credentials.twilio_account_sid && credentials.twilio_auth_token && credentials.twilio_phone_number);
          updateData = {
            twilio_account_sid: credentials.twilio_account_sid,
            twilio_auth_token: credentials.twilio_auth_token,
            twilio_phone_number: credentials.twilio_phone_number,
            sms_configured: isConfigured,
          };
          break;
        case 'email':
          isConfigured = !!(credentials.resend_api_key && credentials.email_from_address);
          updateData = {
            resend_api_key: credentials.resend_api_key,
            email_from_address: credentials.email_from_address,
            email_from_name: credentials.email_from_name,
            email_configured: isConfigured,
          };
          break;
      }

      if (credentials.id) {
        // Update existing
        const { error } = await supabase
          .from('user_messaging_credentials')
          .update(updateData)
          .eq('id', credentials.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_messaging_credentials')
          .insert({ 
            user_id: user.id, 
            ...updateData 
          })
          .select()
          .single();

        if (error) throw error;
        setCredentials(prev => ({ ...prev, id: data.id, user_id: data.user_id }));
      }

      // Update local state
      setCredentials(prev => ({
        ...prev,
        [`${channel}_configured`]: isConfigured,
      }));

      toast.success(`Configurações de ${channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'Email'} salvas!`);
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
              <h3 className="text-lg font-medium">WhatsApp Business API</h3>
              <StatusBadge configured={credentials.whatsapp_configured} />
            </div>
            
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

              <Button onClick={() => handleSave('whatsapp')} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configurações WhatsApp
              </Button>
            </div>
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
