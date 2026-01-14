import React, { useState } from 'react';
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

export const Login: React.FC = () => {
  const { t, language, setLanguage, setUser } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulated login
    setTimeout(() => {
      const isAdmin = email.includes('admin');
      setUser({
        id: '1',
        name: isAdmin ? 'Admin User' : 'Demo User',
        email,
        plan: 'free',
        role: isAdmin ? 'admin' : 'user',
        searchesUsed: 0,
        leadsUsed: 0,
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      setIsLoading(false);
      navigate('/dashboard');
    }, 1000);
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground">LeadFlow</h1>
          <p className="text-primary-foreground/70 mt-1">AI-Powered Lead Prospecting</p>
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

        {/* Demo hint */}
        <p className="text-center text-primary-foreground/50 text-sm mt-6">
          Use qualquer email para demo. Inclua "admin" para acesso Admin.
        </p>
      </div>
    </div>
  );
};

export default Login;
