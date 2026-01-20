import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from 'lucide-react';

export const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="bg-foreground text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="R3CF.ai Logo" className="w-10 h-10" />
              <span className="font-bold text-xl">R3CF.ai Leads Flow</span>
            </div>
            <p className="text-white/60 mb-6 leading-relaxed">
              Plataforma inteligente de prospecção de leads com IA para 
              automatizar vendas e gerenciar relacionamentos.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Produto</h4>
            <ul className="space-y-3">
              <li><Link to="/signup" className="text-white/60 hover:text-white transition-colors">Funcionalidades</Link></li>
              <li><Link to="/plans" className="text-white/60 hover:text-white transition-colors">Preços</Link></li>
              <li><Link to="/signup" className="text-white/60 hover:text-white transition-colors">Integrações</Link></li>
              <li><Link to="/signup" className="text-white/60 hover:text-white transition-colors">API</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Empresa</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/60">
                <Mail className="w-5 h-5" />
                <span>contato@r3cf.ai</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Phone className="w-5 h-5" />
                <span>+55 11 99999-9999</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <MapPin className="w-5 h-5" />
                <span>São Paulo, Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} R3CF.ai Leads Flow. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-white/40 hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
