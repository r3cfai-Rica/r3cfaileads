import React from 'react';
import { useApp, Language } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings as SettingsIcon,
  Globe,
  CreditCard,
  User,
  Crown,
  Check,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { t, user, language, setLanguage } = useApp();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          {t.nav.settings}
        </h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Perfil
            </CardTitle>
            <CardDescription>Suas informações de conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.name}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Membro desde</p>
                <p className="font-medium">
                  {user?.createdAt?.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último acesso</p>
                <p className="font-medium">
                  {user?.lastLogin?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Idioma / Language
            </CardTitle>
            <CardDescription>Escolha o idioma do aplicativo</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(v: Language) => setLanguage(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">
                  <div className="flex items-center gap-2">
                    🇧🇷 Português (Brasil)
                  </div>
                </SelectItem>
                <SelectItem value="en-US">
                  <div className="flex items-center gap-2">
                    🇺🇸 English (US)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Plan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Plano e Assinatura
            </CardTitle>
            <CardDescription>Gerencie seu plano de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-xl bg-muted/50">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  user?.plan === 'paid' ? 'gradient-primary shadow-glow' : 'bg-muted'
                }`}>
                  {user?.plan === 'paid' ? (
                    <Crown className="w-7 h-7 text-primary-foreground" />
                  ) : (
                    <Zap className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">
                      {user?.plan === 'paid' ? 'Plano PRO' : 'Plano Gratuito'}
                    </h3>
                    <Badge variant={user?.plan === 'paid' ? 'gradient' : 'muted'}>
                      {user?.plan === 'paid' ? 'ATIVO' : 'FREE'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {user?.plan === 'paid' 
                      ? 'Acesso completo a todas as funcionalidades'
                      : '1 busca • 10 leads máximo'}
                  </p>
                </div>
              </div>
              {user?.plan === 'free' && (
                <Link to="/plans">
                  <Button variant="gradientCTA" size="lg">
                    <Crown className="w-4 h-4 mr-2" />
                    Fazer Upgrade
                  </Button>
                </Link>
              )}
            </div>

            {/* Usage Stats */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Buscas Realizadas</p>
                <p className="text-2xl font-bold">
                  {user?.searchesUsed || 0}
                  {user?.plan === 'free' && <span className="text-base font-normal text-muted-foreground"> / 1</span>}
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Leads Salvos</p>
                <p className="text-2xl font-bold">
                  {user?.leadsUsed || 0}
                  {user?.plan === 'free' && <span className="text-base font-normal text-muted-foreground"> / 10</span>}
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Status da Conta</p>
                <div className="flex items-center gap-2 mt-1">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-lg font-medium">Ativa</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
