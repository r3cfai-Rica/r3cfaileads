import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Mail, Lock, ArrowRight, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


export const Login: React.FC = () => {
  const { t, language, setLanguage, setUser, isAuthenticated, user } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast.error(authError.message);
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Check if user has admin role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        const isAdmin = roleData?.role === 'admin';

        setUser({
          id: authData.user.id,
          name: profileData?.name || authData.user.email?.split('@')[0] || 'User',
          email: authData.user.email || '',
          plan: (profileData?.plan as 'free' | 'paid') || 'free',
          role: isAdmin ? 'admin' : 'user',
          searchesUsed: profileData?.searches_used || 0,
          leadsUsed: profileData?.leads_used || 0,
          isActive: profileData?.is_active ?? true,
          createdAt: new Date(profileData?.created_at || Date.now()),
          lastLogin: new Date(),
        });

        if (isAdmin) {
          toast.success('Bem-vindo, Admin! Acesso ilimitado ativado.');
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="glass" size="sm" className="gap-2">
              <Globe className="w-4 h-4" />
              {language === 'pt-BR' ? 'PT' : 'EN'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('pt-BR')}>
              🇧🇷 Português
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('en-US')}>
              🇺🇸 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="R3CF.ai Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary-foreground">R3CF.ai</h1>
          <p className="text-primary-foreground/70 mt-1">Prospecção de Leads com IA</p>
        </div>

        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t.auth.welcomeBack}</CardTitle>
            <CardDescription>{t.auth.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
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
              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
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
                  />
                </div>
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? t.common.loading : t.auth.login}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              {t.auth.noAccount}{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                {t.auth.signup}
              </Link>
            </div>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
};

export default Login;
