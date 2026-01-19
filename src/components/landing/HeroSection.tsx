import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, TrendingUp } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <img 
              src="/logo.png" 
              alt="R3CF.ai Logo" 
              className="w-24 h-24 drop-shadow-2xl animate-float"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-white/90 text-sm mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Sparkles className="w-4 h-4 text-warning" />
            <span>Plataforma de Prospecção com IA</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Transforme sua
            <span className="block bg-gradient-to-r from-secondary via-accent to-secondary bg-clip-text text-transparent">
              Prospecção de Leads
            </span>
            com Inteligência Artificial
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            Descubra leads qualificados, automatize campanhas e aumente suas vendas 
            com a plataforma mais inteligente do mercado.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/signup">
              <Button size="lg" className="gradient-cta text-white border-0 px-8 py-6 text-lg font-semibold shadow-xl hover:scale-105 transition-transform">
                Começar Gratuitamente
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 py-6 text-lg">
                Já tenho conta
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-warning" />
                <span className="text-3xl md:text-4xl font-bold text-white">10x</span>
              </div>
              <p className="text-white/60 text-sm">Mais Rápido</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-3xl md:text-4xl font-bold text-white">85%</span>
              </div>
              <p className="text-white/60 text-sm">Taxa de Conversão</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                <span className="text-3xl md:text-4xl font-bold text-white">1M+</span>
              </div>
              <p className="text-white/60 text-sm">Leads Gerados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};
