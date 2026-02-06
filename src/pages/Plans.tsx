import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutAccessDialog } from '@/components/billing/CheckoutAccessDialog';
import { Check, Zap, Crown, Sparkles, Loader2, Star, AlertTriangle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PlanType = 'free' | 'premium';

export const Plans: React.FC = () => {
  const { t, user, setUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<PlanType | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);

  // Show toast if payment was cancelled
  React.useEffect(() => {
    if (searchParams.get('payment') === 'cancelled') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleSelectFreePlan = () => {
    if (user) {
      setUser({ ...user, plan: 'free' });
    }
    navigate('/dashboard');
  };

  const handleCheckout = async (planType: PlanType) => {
    if (planType === 'free') {
      handleSelectFreePlan();
      return;
    }

    // Pre-open a tab synchronously to reduce popup blocking
    const preOpenedWindow = window.open('', '_blank');
    try {
      if (preOpenedWindow?.document) {
        preOpenedWindow.document.write(
          '<title>Carregando pagamento...</title><div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding:24px;">Carregando pagamento...</div>'
        );
      }
    } catch {
      // ignore
    }

    setIsLoading(planType);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        preOpenedWindow?.close();
        toast({
          title: "Erro",
          description: "Você precisa estar logado para fazer upgrade.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { planType },
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      // Keep the app open and show a dialog with the link (useful if corporate networks block the payment page)
      setCheckoutUrl(data.url);
      setIsCheckoutDialogOpen(true);

      // Redirect the pre-opened tab
      if (preOpenedWindow) {
        preOpenedWindow.location.href = data.url;
      }
    } catch (error) {
      preOpenedWindow?.close();
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-4xl animate-slide-up">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">{t.plans.title}</h1>
          <p className="text-xl text-primary-foreground/70">{t.plans.subtitle}</p>
        </div>

        {/* Plans Grid - 2 columns */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Demo/Free Plan */}
          <Card variant="glass" className="backdrop-blur-xl relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                </div>
                <Badge variant="secondary">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Demo
                </Badge>
              </div>
              <CardTitle className="text-2xl mt-4">{t.plans.freeTrial}</CardTitle>
              <CardDescription>{t.plans.freeTrialDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold">
                R$ 0
              </div>
              
              {/* Warning about demo leads */}
              <Alert variant="default" className="bg-warning/10 border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm text-warning">
                  {t.plans.freeNote}
                </AlertDescription>
              </Alert>

              <ul className="space-y-3">
                {t.plans.freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleSelectFreePlan}
              >
                {t.plans.startFree}
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card variant="glass" className="backdrop-blur-xl relative border-2 border-success/50">
            {/* Real Leads Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="gradientCTA" className="gradient-cta px-4 py-1 text-sm shadow-lg">
                <MapPin className="w-3 h-3 mr-1" />
                {t.plans.promo}
              </Badge>
            </div>
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <Crown className="w-6 h-6 text-primary-foreground" />
                </div>
                <Badge variant="gradient">
                  <Star className="w-3 h-3 mr-1" />
                  VIP
                </Badge>
              </div>
              <CardTitle className="text-2xl mt-4">{t.plans.premium}</CardTitle>
              <CardDescription>{t.plans.premiumDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-success">{t.plans.premiumPrice}</span>
                  <span className="text-lg text-muted-foreground">{t.plans.premiumPriceNote}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t.plans.premiumFirstPayment}</p>
              </div>
              <ul className="space-y-3">
                {t.plans.premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="gradientCTA"
                className="w-full"
                size="lg"
                onClick={() => handleCheckout('premium')}
                disabled={isLoading !== null}
              >
                {isLoading === 'premium' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  t.plans.selectPremium
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            className="text-primary-foreground/60 hover:text-primary-foreground"
            onClick={() => navigate('/dashboard')}
          >
            Continuar com demonstração gratuita
          </Button>
        </div>

        <CheckoutAccessDialog
          open={isCheckoutDialogOpen}
          onOpenChange={setIsCheckoutDialogOpen}
          url={checkoutUrl}
        />
      </div>
    </div>
  );
};

export default Plans;
