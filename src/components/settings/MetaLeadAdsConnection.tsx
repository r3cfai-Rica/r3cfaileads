import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Link2, Unlink, RefreshCw, Loader2 } from 'lucide-react';

interface MetaConnection {
  id: string;
  page_id: string;
  page_name: string;
  is_active: boolean;
  created_at: string;
}

const META_APP_ID = '1183775287299903';

export const MetaLeadAdsConnection: React.FC = () => {
  const { language, user } = useApp();
  const pt = language === 'pt-BR';
  const { toast } = useToast();
  const [connections, setConnections] = useState<MetaConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConnections = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meta_connections')
        .select('id, page_id, page_name, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections((data as MetaConnection[]) || []);
    } catch (err) {
      console.error('Error loading meta connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [user]);

  const handleConnect = () => {
    const redirectUri = 'https://r3cfaileads.lovable.app/meta-oauth-callback';
    const scope = 'pages_show_list,leads_retrieval,pages_manage_ads,pages_read_engagement,business_management';
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&auth_type=rerequest`;
    window.location.href = authUrl;
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('meta_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast({
        title: pt ? 'Página desconectada' : 'Page disconnected',
      });
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast({
        title: pt ? 'Erro ao desconectar' : 'Error disconnecting',
        variant: 'destructive',
      });
    }
  };

  const activeConnections = connections.filter(c => c.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-[#1877F2]" />
          Meta Lead Ads
        </CardTitle>
        <CardDescription>
          {pt
            ? 'Conecte suas páginas do Facebook para receber leads automaticamente'
            : 'Connect your Facebook pages to receive leads automatically'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {pt ? 'Carregando...' : 'Loading...'}
          </div>
        ) : (
          <>
            {activeConnections.length > 0 && (
              <div className="space-y-3">
                {activeConnections.map(conn => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
                        <Facebook className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{conn.page_name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {conn.page_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        {pt ? 'Conectado' : 'Connected'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDisconnect(conn.id)}
                        title={pt ? 'Desconectar' : 'Disconnect'}
                      >
                        <Unlink className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleConnect} className="bg-[#1877F2] hover:bg-[#166FE5] text-white">
                <Link2 className="w-4 h-4 mr-2" />
                {activeConnections.length > 0
                  ? (pt ? 'Conectar outra página' : 'Connect another page')
                  : (pt ? 'Conectar com Facebook' : 'Connect with Facebook')}
              </Button>
              {activeConnections.length > 0 && (
                <Button variant="outline" onClick={loadConnections}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {pt ? 'Atualizar' : 'Refresh'}
                </Button>
              )}
            </div>

            {activeConnections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {pt
                  ? 'Nenhuma página conectada. Clique acima para conectar suas páginas do Facebook e receber leads automaticamente.'
                  : 'No pages connected. Click above to connect your Facebook pages and receive leads automatically.'}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
