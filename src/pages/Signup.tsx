import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


export const Signup: React.FC = () => {
  const { t, setUser, isAuthenticated, user } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Este email já está cadastrado. Faça login.');
        } else {
          toast.error(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            name: name,
            email: email,
            plan: 'free',
            searches_used: 0,
            leads_used: 0,
            is_active: true,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Create user role (the trigger will upgrade to admin if email matches)
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'user',
          });

        if (roleError) {
          console.error('Role creation error:', roleError);
        }

        // Check if user got admin role (trigger may have upgraded it)
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        const isAdmin = roleData?.role === 'admin';

        setUser({
          id: authData.user.id,
          name: name,
          email: email,
          plan: 'free',
          role: isAdmin ? 'admin' : 'user',
          searchesUsed: 0,
          leadsUsed: 0,
          isActive: true,
          createdAt: new Date(),
          lastLogin: new Date(),
        });

        if (isAdmin) {
          toast.success('Conta Admin criada com sucesso! Acesso ilimitado.');
        } else {
          toast.success('Conta criada com sucesso!');
        }

        navigate('/plans');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const features = t.plans.freeFeatures;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="R3CF.ai Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary-foreground">R3CF.ai Leads Flow</h1>
          <p className="text-primary-foreground/70 mt-1">Prospecção de Leads com IA</p>
        </div>

        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t.auth.createAccount}</CardTitle>
            <CardDescription>{t.auth.signupSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.auth.name}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
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
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                size="lg"
                disabled={isLoading || password !== confirmPassword}
              >
                {isLoading ? t.common.loading : t.plans.startFree}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            {/* Free features */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                {t.plans.freeTrial} {t.plans.features}:
              </p>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              {t.auth.hasAccount}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t.auth.login}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;