import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-background/95 backdrop-blur-lg border-b border-border shadow-sm' 
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="R3CF.ai Logo" className="w-10 h-10" />
            <span className={cn(
              'font-bold text-lg transition-colors',
              isScrolled ? 'text-foreground' : 'text-white'
            )}>
              R3CF.ai
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isScrolled ? 'text-muted-foreground' : 'text-white/80 hover:text-white'
              )}
            >
              Funcionalidades
            </a>
            <a 
              href="#how-it-works" 
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isScrolled ? 'text-muted-foreground' : 'text-white/80 hover:text-white'
              )}
            >
              Como Funciona
            </a>
            <Link 
              to="/plans" 
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isScrolled ? 'text-muted-foreground' : 'text-white/80 hover:text-white'
              )}
            >
              Preços
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button 
                variant="ghost" 
                className={cn(
                  'transition-colors',
                  isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:bg-white/10'
                )}
              >
                Entrar
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="gradient-cta text-white border-0 hover:opacity-90">
                Começar Grátis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={cn('w-6 h-6', isScrolled ? 'text-foreground' : 'text-white')} />
            ) : (
              <Menu className={cn('w-6 h-6', isScrolled ? 'text-foreground' : 'text-white')} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 bg-background/95 backdrop-blur-lg animate-fade-in">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-foreground/80 hover:text-primary px-4 py-2">
                Funcionalidades
              </a>
              <a href="#how-it-works" className="text-foreground/80 hover:text-primary px-4 py-2">
                Como Funciona
              </a>
              <Link to="/plans" className="text-foreground/80 hover:text-primary px-4 py-2">
                Preços
              </Link>
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border/50">
                <Link to="/login">
                  <Button variant="outline" className="w-full">Entrar</Button>
                </Link>
                <Link to="/signup">
                  <Button className="w-full gradient-cta text-white border-0">Começar Grátis</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
