import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Crown, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp, User } from '@/contexts/AppContext';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const checkSessionAndUpdatePlan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // User is authenticated, update their plan to paid
          const { data: profile, error } = await supabase
            .from('profiles')
            .update({ plan: 'paid' })
            .eq('user_id', session.user.id)
            .select()
            .single();

          if (!error && profile) {
            const updatedUser: User = {
              id: profile.user_id,
              email: profile.email,
              name: profile.name,
              plan: profile.plan as 'free' | 'paid',
              role: 'user',
              searchesUsed: profile.searches_used,
              leadsUsed: profile.leads_used,
              isActive: profile.is_active,
              createdAt: new Date(profile.created_at),
              lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
            };
            setUser(updatedUser);
            setIsSuccess(true);
          }
        } else {
          // No session, but payment was successful - show success anyway
          // The webhook will have updated the plan
          setIsSuccess(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsSuccess(true); // Show success even on error - payment went through
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndUpdatePlan();
  }, [setUser]);

  const handleContinue = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card variant="glass" className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-8">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-6" />
            <h2 className="text-xl font-semibold">Processando pagamento...</h2>
            <p className="text-muted-foreground mt-2">Aguarde um momento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-md text-center animate-fade-in">
        <CardHeader className="pb-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <CardTitle className="text-2xl">Pagamento Confirmado! 🎉</CardTitle>
          <CardDescription className="text-base">
            Parabéns! Seu plano PRO foi ativado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PRO Benefits Summary */}
          <div className="bg-primary/10 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold">Você agora tem acesso a:</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Buscas ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                500 leads por mês
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Geração de IA avançada
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Suporte prioritário
              </li>
            </ul>
          </div>

          <Button
            variant="gradientCTA"
            size="lg"
            className="w-full gap-2"
            onClick={handleContinue}
          >
            Acessar o Dashboard
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Um recibo foi enviado para o seu e-mail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
