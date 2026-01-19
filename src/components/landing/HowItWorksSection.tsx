import React from 'react';
import { Search, Filter, Send, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Defina seu Nicho',
    description: 'Escolha o segmento de mercado e o perfil ideal de cliente que deseja prospectar.'
  },
  {
    number: '02',
    icon: Filter,
    title: 'IA Encontra Leads',
    description: 'Nossa inteligência artificial analisa e encontra os leads mais qualificados para você.'
  },
  {
    number: '03',
    icon: Send,
    title: 'Automatize Contato',
    description: 'Configure campanhas multi-canal e deixe a plataforma trabalhar por você.'
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Feche Mais Vendas',
    description: 'Acompanhe métricas, otimize sua abordagem e aumente suas conversões.'
  }
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-24 gradient-hero relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-4">
            Como Funciona
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            4 passos simples para
            <span className="block text-secondary"> revolucionar suas vendas</span>
          </h2>
          <p className="text-lg text-white/70">
            Comece a prospectar de forma inteligente em minutos.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
              )}
              
              <div className="text-center">
                {/* Number Badge */}
                <div className="relative inline-flex mb-6">
                  <div className="w-32 h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                    <step.icon className="w-12 h-12 text-secondary" />
                  </div>
                  <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {step.number}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
