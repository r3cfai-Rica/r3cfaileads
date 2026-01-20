import React from 'react';
import { 
  Search, 
  Users, 
  Mail, 
  BarChart3, 
  Bot, 
  Zap,
  Target,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: 'Prospecção Inteligente',
    description: 'Encontre leads qualificados automaticamente usando IA avançada que analisa padrões de mercado.',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    icon: Bot,
    title: 'Assistente IA',
    description: 'Chatbot integrado que ajuda a criar mensagens personalizadas e estratégias de abordagem.',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10'
  },
  {
    icon: Users,
    title: 'CRM Completo',
    description: 'Gerencie todos os seus leads e relacionamentos em um só lugar com pipeline visual.',
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  },
  {
    icon: Mail,
    title: 'Multi-Canal',
    description: 'Envie mensagens por Email, SMS e WhatsApp diretamente da plataforma.',
    color: 'text-info',
    bgColor: 'bg-info/10'
  },
  {
    icon: Target,
    title: 'Campanhas Automatizadas',
    description: 'Crie sequências de follow-up que rodam automaticamente para nutrir seus leads.',
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Dashboards com métricas em tempo real para acompanhar sua performance.',
    color: 'text-success',
    bgColor: 'bg-success/10'
  },
  {
    icon: Zap,
    title: 'Automações',
    description: 'Configure gatilhos e ações automáticas para escalar suas operações.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10'
  },
  {
    icon: MessageSquare,
    title: 'CTAs Personalizados',
    description: 'Gere chamadas para ação otimizadas por IA para cada tipo de cliente.',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  }
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Tudo que você precisa para{' '}
            <span className="text-primary">prospectar melhor</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Uma plataforma completa com ferramentas poderosas para transformar 
            sua estratégia de vendas.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
