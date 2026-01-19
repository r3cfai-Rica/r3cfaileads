import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingAssistant } from '@/components/chat/FloatingAssistant';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, authLoading } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Carregando…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <img src="/logo.png" alt="R3CF.ai Logo" className="ml-2 w-8 h-8" />
        <span className="ml-2 font-bold text-lg text-primary">R3CF.ai Leads Flow</span>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'lg:block',
        mobileMenuOpen ? 'block' : 'hidden'
      )}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          'pt-14 lg:pt-0',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Floating AI Assistant */}
      <FloatingAssistant />
    </div>
  );
};
