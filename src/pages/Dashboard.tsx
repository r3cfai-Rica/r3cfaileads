import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FolderKanban,
  Send,
  TrendingUp,
  Search,
  Megaphone,
  ArrowRight,
  Zap,
  Clock,
  Target,
} from 'lucide-react';
import { ConversionRateCard } from '@/components/dashboard/ConversionRateCard';

export const Dashboard: React.FC = () => {
  const { t, user, leads, folders, messageLogs, canSearch, remainingSearches, remainingLeads } = useApp();

  const stats = [
    {
      label: t.dashboard.totalLeads,
      value: leads.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: t.dashboard.activeNiches,
      value: folders.length,
      icon: FolderKanban,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: t.dashboard.campaignsSent,
      value: messageLogs.filter(m => m.status === 'sent').length,
      icon: Send,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: t.dashboard.responseRate,
      value: messageLogs.length > 0
        ? `${Math.round((messageLogs.filter(m => m.status === 'replied').length / messageLogs.length) * 100)}%`
        : '0%',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const quickActions = [
    {
      label: t.dashboard.newSearch,
      icon: Search,
      path: '/prospecting',
      variant: 'gradient' as const,
    },
    {
      label: t.dashboard.createCampaign,
      icon: Megaphone,
      path: '/campaigns',
      variant: 'secondary' as const,
    },
    {
      label: t.dashboard.viewCRM,
      icon: FolderKanban,
      path: '/crm',
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {t.dashboard.welcome}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString(user?.email.includes('en') ? 'en-US' : 'pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={user?.plan === 'paid' ? 'gradient' : 'muted'} className="px-3 py-1">
            {user?.plan === 'paid' ? 'PRO' : 'FREE'}
          </Badge>
          {user?.plan === 'free' && (
            <Link to="/plans">
              <Button variant="gradientCTA" size="sm" className="gap-2">
                <Zap className="w-4 h-4" />
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Plan Limits Alert */}
      {user?.plan === 'free' && (
        <Card variant="highlight" className="border-warning/30 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium">Plano Gratuito</p>
                  <p className="text-sm text-muted-foreground">
                    {remainingSearches} busca(s) • {remainingLeads} leads restantes
                  </p>
                </div>
              </div>
              <Link to="/plans">
                <Button variant="warning" size="sm" className="gap-2">
                  Fazer Upgrade <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} variant="stat" className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t.dashboard.quickActions}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.path}>
              <Card variant="interactive" className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <action.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{action.label}</p>
                      <p className="text-sm text-muted-foreground">Clique para acessar</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversion Rate Card */}
        <ConversionRateCard />

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leads Recentes
            </CardTitle>
            <CardDescription>Últimos leads adicionados ao CRM</CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length > 0 ? (
              <ul className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <li key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.position || lead.location}</p>
                    </div>
                    <Badge variant={lead.status as any}>{lead.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum lead ainda</p>
                <Link to="/prospecting">
                  <Button variant="link" className="mt-2">
                    Iniciar Prospecção
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              {t.dashboard.recentActivity}
            </CardTitle>
            <CardDescription>Últimas mensagens enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            {messageLogs.length > 0 ? (
              <ul className="space-y-3">
                {messageLogs.slice(0, 5).map((log) => (
                  <li key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant={log.channel === 'whatsapp' ? 'success' : log.channel === 'email' ? 'info' : 'warning'}>
                        {log.channel}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{log.leadName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.status === 'sent' ? 'success' : log.status === 'replied' ? 'info' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma mensagem enviada</p>
                <Link to="/messaging">
                  <Button variant="link" className="mt-2">
                    Enviar Mensagem
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
