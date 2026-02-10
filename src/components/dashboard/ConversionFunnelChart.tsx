import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Loader2 } from 'lucide-react';
import { PeriodOption } from './AnalyticsPeriodFilter';

interface ConversionFunnelChartProps {
  period: PeriodOption;
}

interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

const periodDays: Record<PeriodOption, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ period }) => {
  const { language } = useApp();
  const isPt = language === 'pt-BR';
  const days = periodDays[period];

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversion-funnel', period, language],
    queryFn: async () => {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [pageViewsResult, profilesResult, leadsResult, messagesResult] = await Promise.all([
        supabase.from('page_views').select('session_id').gte('created_at', startDate),
        supabase.from('profiles').select('id').gte('created_at', startDate),
        supabase.from('leads').select('id').gte('created_at', startDate),
        supabase.from('message_logs').select('id').gte('sent_at', startDate),
      ]);

      if (pageViewsResult.error) throw pageViewsResult.error;
      if (profilesResult.error) throw profilesResult.error;
      if (leadsResult.error) throw leadsResult.error;
      if (messagesResult.error) throw messagesResult.error;

      const uniqueVisitors = new Set(
        pageViewsResult.data?.map(v => v.session_id).filter(Boolean)
      ).size;

      const signups = profilesResult.data?.length || 0;
      const leadsSaved = leadsResult.data?.length || 0;
      const messagesSent = messagesResult.data?.length || 0;

      const funnel: FunnelStep[] = [
        {
          label: isPt ? 'Visitantes' : 'Visitors',
          value: uniqueVisitors,
          percentage: 100,
          color: 'hsl(var(--primary))',
        },
        {
          label: isPt ? 'Cadastros' : 'Signups',
          value: signups,
          percentage: uniqueVisitors > 0 ? Math.round((signups / uniqueVisitors) * 100) : 0,
          color: 'hsl(var(--secondary))',
        },
        {
          label: isPt ? 'Leads Salvos' : 'Saved Leads',
          value: leadsSaved,
          percentage: signups > 0 ? Math.round((leadsSaved / signups) * 100) : 0,
          color: 'hsl(var(--accent))',
        },
        {
          label: isPt ? 'Mensagens Enviadas' : 'Messages Sent',
          value: messagesSent,
          percentage: leadsSaved > 0 ? Math.round((messagesSent / leadsSaved) * 100) : 0,
          color: 'hsl(var(--success))',
        },
      ];

      const overallConversion = uniqueVisitors > 0
        ? Math.round((messagesSent / uniqueVisitors) * 100 * 10) / 10
        : 0;

      return { funnel, overallConversion };
    },
    refetchInterval: 60000,
  });

  const titleText = isPt ? 'Funil de Conversão' : 'Conversion Funnel';
  const subtitleText = isPt ? 'Jornada do visitante até o envio de mensagem' : 'Visitor journey to message sending';
  const overallLabel = isPt ? 'Conversão Total (Visitante → Mensagem)' : 'Overall Conversion (Visitor → Message)';
  const errorText = isPt ? 'Erro ao carregar dados' : 'Error loading data';

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {titleText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{errorText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          {titleText}
        </CardTitle>
        <CardDescription>{subtitleText}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <svg viewBox="0 0 300 260" className="w-full max-w-[350px]" preserveAspectRatio="xMidYMid meet">
              {data?.funnel.map((step, index) => {
                const totalSteps = data.funnel.length;
                const yStart = index * 60;
                const yEnd = yStart + 48;

                const topWidthPct = 1 - (index * 0.22);
                const bottomWidthPct = 1 - ((index + 1) * 0.22);
                const cx = 150;
                const halfTop = (topWidthPct * 260) / 2;
                const halfBottom = (bottomWidthPct * 260) / 2;

                const points = `${cx - halfTop},${yStart} ${cx + halfTop},${yStart} ${cx + halfBottom},${yEnd} ${cx - halfBottom},${yEnd}`;

                const colorMap: Record<number, string> = {
                  0: 'hsl(var(--primary))',
                  1: 'hsl(210, 70%, 50%)',
                  2: 'hsl(160, 60%, 45%)',
                  3: 'hsl(140, 65%, 40%)',
                };

                return (
                  <React.Fragment key={step.label}>
                    <polygon
                      points={points}
                      fill={colorMap[index] || step.color}
                      opacity="0.9"
                    />
                    <text x={cx} y={yStart + 20} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
                      {step.label}
                    </text>
                    <text x={cx} y={yStart + 36} textAnchor="middle" fill="white" fontSize="14" fontWeight="700">
                      {step.value.toLocaleString(language)}
                    </text>
                    {index < totalSteps - 1 && (
                      <text x={cx} y={yEnd + 9} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9" fontWeight="500">
                        ↓ {data.funnel[index + 1].percentage}%
                      </text>
                    )}
                  </React.Fragment>
                );
              })}
            </svg>

            <div className="mt-4 pt-3 border-t border-border w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {overallLabel}
                </span>
                <span className="text-lg font-bold text-primary">
                  {data?.overallConversion}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
