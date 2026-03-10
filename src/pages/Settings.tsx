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
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MessagingCredentialsForm } from '@/components/settings/MessagingCredentialsForm';
import { MetaLeadAdsConnection } from '@/components/settings/MetaLeadAdsConnection';

export const Settings: React.FC = () => {
  const { t, user, language, setLanguage } = useApp();
  const pt = language === 'pt-BR';

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
              {pt ? 'Perfil' : 'Profile'}
            </CardTitle>
            <CardDescription>{pt ? 'Suas informações de conta' : 'Your account information'}</CardDescription>
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
                <p className="text-sm text-muted-foreground">{pt ? 'Membro desde' : 'Member since'}</p>
                <p className="font-medium">
                  {user?.createdAt?.toLocaleDateString(language)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{pt ? 'Último acesso' : 'Last login'}</p>
                <p className="font-medium">
                  {user?.lastLogin?.toLocaleDateString(language)}
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
              {pt ? 'Idioma / Language' : 'Language / Idioma'}
            </CardTitle>
            <CardDescription>{pt ? 'Escolha o idioma do aplicativo' : 'Choose app language'}</CardDescription>
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
              {pt ? 'Plano e Assinatura' : 'Plan & Subscription'}
            </CardTitle>
            <CardDescription>{pt ? 'Gerencie seu plano de assinatura' : 'Manage your subscription plan'}</CardDescription>
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
                      {user?.plan === 'paid' 
                        ? (pt ? 'Plano PRO' : 'PRO Plan') 
                        : (pt ? 'Plano Gratuito' : 'Free Plan')}
                    </h3>
                    <Badge variant={user?.plan === 'paid' ? 'gradient' : 'muted'}>
                      {user?.plan === 'paid' 
                        ? (pt ? 'ATIVO' : 'ACTIVE') 
                        : 'FREE'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {user?.plan === 'paid' 
                      ? (pt ? 'Acesso completo a todas as funcionalidades' : 'Full access to all features')
                      : (pt ? '1 busca • 10 leads máximo' : '1 search • 10 leads max')}
                  </p>
                </div>
              </div>
              <Link to="/plans">
                <Button variant={user?.plan === 'free' ? 'gradientCTA' : 'outline'} size="lg">
                  <Crown className="w-4 h-4 mr-2" />
                  {user?.plan === 'free' 
                    ? (pt ? 'Fazer Upgrade' : 'Upgrade Now') 
                    : (pt ? 'Ver Planos' : 'View Plans')}
                </Button>
              </Link>
            </div>

            {/* Usage Stats */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">{pt ? 'Buscas Realizadas' : 'Searches Made'}</p>
                <p className="text-2xl font-bold">
                  {user?.searchesUsed || 0}
                  {user?.plan === 'free' && <span className="text-base font-normal text-muted-foreground"> / 1</span>}
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">{pt ? 'Leads Salvos' : 'Leads Saved'}</p>
                <p className="text-2xl font-bold">
                  {user?.leadsUsed || 0}
                  {user?.plan === 'free' && <span className="text-base font-normal text-muted-foreground"> / 10</span>}
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">{pt ? 'Status da Conta' : 'Account Status'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-lg font-medium">{pt ? 'Ativa' : 'Active'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google API Notice for Premium */}
        {user?.plan === 'paid' && (
          <Card className="lg:col-span-2 border-success/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <MapPin className="w-5 h-5" />
                {pt ? 'Google Places API' : 'Google Places API'}
              </CardTitle>
              <CardDescription>
                {pt 
                  ? 'Sua conta Premium utiliza a Google Places API para buscar leads reais e verificados com dados completos de contato.'
                  : 'Your Premium account uses Google Places API to fetch real, verified leads with complete contact data.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">{pt ? 'API configurada e ativa' : 'API configured and active'}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meta Lead Ads */}
        <div className="lg:col-span-2">
          <MetaLeadAdsConnection />
        </div>

        {/* Messaging Credentials */}
        <div className="lg:col-span-2">
          <MessagingCredentialsForm />
        </div>
      </div>
    </div>
  );
};

export default Settings;
