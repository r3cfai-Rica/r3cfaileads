import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Wrench } from 'lucide-react';
import PremiumCostCalculator from '@/components/help/PremiumCostCalculator';

export default function AdminTools() {
  const { user, language } = useApp();

  // Redirect non-admins
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wrench className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">
          {language === 'pt-BR' ? 'Ferramentas Admin' : 'Admin Tools'}
        </h1>
      </div>

      <p className="text-muted-foreground">
        {language === 'pt-BR' 
          ? 'Ferramentas exclusivas para gerenciamento e precificação.'
          : 'Exclusive tools for management and pricing.'}
      </p>

      {/* Premium Cost Calculator */}
      <PremiumCostCalculator />
    </div>
  );
}
