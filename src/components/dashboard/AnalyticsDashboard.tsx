import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { AnalyticsPeriodFilter, PeriodOption } from './AnalyticsPeriodFilter';
import { VisitorTrendChart } from './VisitorTrendChart';
import { ConversionFunnelChart } from './ConversionFunnelChart';
import { ConversionRateCard } from './ConversionRateCard';
import { BarChart3 } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { user, language } = useApp();
  const [period, setPeriod] = useState<PeriodOption>('30d');

  const isPt = language === 'pt-BR';

  // Only show to admins
  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {isPt ? 'Analytics da Plataforma' : 'Platform Analytics'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isPt ? 'Métricas de visitantes e conversão' : 'Visitor and conversion metrics'}
            </p>
          </div>
        </div>
        <AnalyticsPeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <VisitorTrendChart period={period} />
        <ConversionFunnelChart period={period} />
      </div>

      {/* CTA Conversion - Full Width */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ConversionRateCard />
        </div>
        <div className="lg:col-span-2">
          <div className="h-full min-h-[200px] rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{isPt ? 'Mais métricas em breve' : 'More metrics coming soon'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
