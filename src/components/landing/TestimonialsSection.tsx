import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Silva',
    role: 'CEO, TechStart',
    avatar: 'CS',
    content: 'O R3CF.ai revolucionou nossa prospecção. Aumentamos em 300% o número de leads qualificados em apenas 2 meses.',
    rating: 5
  },
  {
    name: 'Ana Rodrigues',
    role: 'Diretora Comercial, InnovaCorp',
    avatar: 'AR',
    content: 'A automação de campanhas economiza horas do meu time. A IA realmente entende o perfil ideal de cliente.',
    rating: 5
  },
  {
    name: 'Pedro Santos',
    role: 'Founder, DigitalFlow',
    avatar: 'PS',
    content: 'Finalmente uma ferramenta que integra prospecção, CRM e automação em um só lugar. Simplesmente essencial.',
    rating: 5
  }
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            O que nossos clientes
            <span className="text-gradient"> estão dizendo</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Empresas de todos os tamanhos estão transformando seus resultados.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className="border-border/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              <CardContent className="p-8">
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
