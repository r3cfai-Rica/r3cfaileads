import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ResetPassword: React.FC = () => {
  const { language } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const t = {
    'pt-BR': {
      title: 'Nova Senha',
      subtitle: 'Digite sua nova senha',
      password: 'Nova Senha',
      confirmPassword: 'Confirmar Senha',
      save: 'Salvar Senha',
      saving: 'Salvando...',
      backToLogin: 'Voltar ao Login',
      successTitle: 'Senha Alterada!',
      successMessage: 'Sua senha foi alterada com sucesso. Você já pode fazer login.',
      goToLogin: 'Ir para Login',
      invalidLink: 'Link Inválido',
      invalidMessage: 'Este link de recuperação é inválido ou expirou. Solicite um novo.',
      requestNew: 'Solicitar Novo Link',
      passwordMismatch: 'As senhas não conferem',
      passwordTooShort: 'A senha deve ter pelo menos 6 caracteres',
    },
    'en-US': {
      title: 'New Password',
      subtitle: 'Enter your new password',
      password: 'New Password',
      confirmPassword: 'Confirm Password',
      save: 'Save Password',
      saving: 'Saving...',
      backToLogin: 'Back to Login',
      successTitle: 'Password Changed!',
      successMessage: 'Your password has been changed successfully. You can now log in.',
      goToLogin: 'Go to Login',
      invalidLink: 'Invalid Link',
      invalidMessage: 'This recovery link is invalid or expired. Request a new one.',
      requestNew: 'Request New Link',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
    },
  }[language];

  useEffect(() => {
    // Check if there's a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    
    checkSession();

    // Listen for auth state changes (when user clicks the reset link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      toast.error(t.passwordTooShort);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSuccess(true);
      toast.success(language === 'pt-BR' ? 'Senha alterada com sucesso!' : 'Password changed successfully!');
      
      // Sign out after password change so user can log in fresh
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Update password error:', error);
      toast.error(language === 'pt-BR' ? 'Erro ao alterar senha' : 'Error changing password');
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
          {isSuccess ? (
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
              <CardContent>
                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  {t.goToLogin}
                </Button>
              </CardContent>
            </>
          ) : isValidSession === false ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                </div>
                <CardTitle className="text-2xl">{t.invalidLink}</CardTitle>
                <CardDescription className="text-base">{t.invalidMessage}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/forgot-password')}
                >
                  {t.requestNew}
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
                    <Label htmlFor="password">{t.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || isValidSession === null}
                  >
                    {isLoading ? t.saving : t.save}
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

export default ResetPassword;
