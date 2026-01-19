import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ForgotPassword: React.FC = () => {
  const { language } = useApp();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const t = {
    'pt-BR': {
      title: 'Esqueceu sua senha?',
      subtitle: 'Digite seu email para receber um link de recuperação',
      email: 'Email',
      send: 'Enviar Link',
      sending: 'Enviando...',
      backToLogin: 'Voltar ao Login',
      successTitle: 'Email Enviado!',
      successMessage: 'Verifique sua caixa de entrada e spam. Clique no link para redefinir sua senha.',
      tryAgain: 'Não recebeu? Enviar novamente',
    },
    'en-US': {
      title: 'Forgot your password?',
      subtitle: 'Enter your email to receive a recovery link',
      email: 'Email',
      send: 'Send Link',
      sending: 'Sending...',
      backToLogin: 'Back to Login',
      successTitle: 'Email Sent!',
      successMessage: 'Check your inbox and spam folder. Click the link to reset your password.',
      tryAgain: "Didn't receive it? Send again",
    },
  }[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
      toast.success(language === 'pt-BR' ? 'Email enviado com sucesso!' : 'Email sent successfully!');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(language === 'pt-BR' ? 'Erro ao enviar email' : 'Error sending email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground">LeadFlow</h1>
        </div>

        <Card variant="glass" className="backdrop-blur-xl">
          {emailSent ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                </div>
                <CardTitle className="text-2xl">{t.successTitle}</CardTitle>
                <CardDescription className="text-base">{t.successMessage}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEmailSent(false)}
                >
                  {t.tryAgain}
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription>{t.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? t.sending : t.send}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t.backToLogin}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
