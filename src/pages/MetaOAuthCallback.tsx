import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const MetaOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useApp();
  const pt = language === 'pt-BR';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(pt ? 'Autorização cancelada pelo usuário.' : 'Authorization cancelled by user.');
      setTimeout(() => navigate('/settings'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage(pt ? 'Código de autorização não encontrado.' : 'Authorization code not found.');
      setTimeout(() => navigate('/settings'), 3000);
      return;
    }

    const exchangeCode = async () => {
      try {
        // Wait for session to be recovered from localStorage
        let session = (await supabase.auth.getSession()).data.session;

        if (!session) {
          // Wait up to 5 seconds for session recovery
          session = await new Promise<any>((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (_event, sess) => {
                if (sess) {
                  clearTimeout(timeout);
                  subscription.unsubscribe();
                  resolve(sess);
                }
              }
            );
          });
        }

        if (!session) {
          throw new Error(
            pt ? 'Sessão expirada. Faça login novamente.' : 'Session expired. Please log in again.'
          );
        }

        const redirectUri = 'https://r3cfaileads.lovable.app/meta-oauth-callback';

        const { data, error: fnError } = await supabase.functions.invoke('meta-oauth', {
          body: { code, redirect_uri: redirectUri },
        });

        if (fnError) {
          let errorMessage = fnError.message;
          try {
            if ((fnError as any).context) {
              const errorBody = await (fnError as any).context.json();
              errorMessage = errorBody?.error || errorMessage;
            }
          } catch {}
          throw new Error(errorMessage);
        }

        if (data?.success) {
          const pageCount = data.pages?.length || 0;
          setStatus('success');
          setMessage(
            pt
              ? `${pageCount} página(s) conectada(s) com sucesso!`
              : `${pageCount} page(s) connected successfully!`
          );
          setTimeout(() => navigate('/settings'), 2500);
        } else {
          throw new Error(data?.error || 'Unknown error');
        }
      } catch (err: any) {
        console.error('Meta OAuth error:', err);
        setStatus('error');
        setMessage(err.message || (pt ? 'Erro ao conectar com o Meta.' : 'Error connecting to Meta.'));
        setTimeout(() => navigate('/settings'), 4000);
      }
    };

    exchangeCode();
  }, [searchParams, navigate, pt]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">
              {pt ? 'Conectando com o Meta...' : 'Connecting to Meta...'}
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <p className="text-lg font-semibold">{message}</p>
            <p className="text-sm text-muted-foreground">
              {pt ? 'Redirecionando...' : 'Redirecting...'}
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="text-lg font-semibold">{message}</p>
            <p className="text-sm text-muted-foreground">
              {pt ? 'Redirecionando...' : 'Redirecting...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default MetaOAuthCallback;
