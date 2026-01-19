import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Check } from 'lucide-react';

const benefits = [
  'Sem cartão de crédito',
  'Setup em 5 minutos',
  'Suporte 24/7'
];

export const CTASection: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-primary" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Comece agora mesmo</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Pronto para transformar sua
            <span className="block">prospecção de leads?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de empresas que já estão usando IA para 
            encontrar e converter mais clientes.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-white/90">
                <Check className="w-5 h-5 text-accent" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 px-10 py-7 text-lg font-semibold shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>

          {/* Trust Badge */}
          <p className="mt-8 text-white/60 text-sm">
            🔒 Seus dados estão seguros conosco. Criptografia de ponta a ponta.
          </p>
        </div>
      </div>
    </section>
  );
};
