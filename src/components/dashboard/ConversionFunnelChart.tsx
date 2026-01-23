import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Loader2, ArrowDown } from 'lucide-react';
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
  const days = periodDays[period];

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversion-funnel', period],
    queryFn: async () => {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all data in parallel
      const [pageViewsResult, profilesResult, leadsResult, messagesResult] = await Promise.all([
        // 1. Visitors (unique sessions from page_views)
        supabase
          .from('page_views')
          .select('session_id')
          .gte('created_at', startDate),
        
        // 2. Signups (profiles created in period)
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', startDate),
        
        // 3. Leads saved (leads created in period)
        supabase
          .from('leads')
          .select('id')
          .gte('created_at', startDate),
        
        // 4. Messages sent (message_logs in period)
        supabase
          .from('message_logs')
          .select('id')
          .gte('sent_at', startDate),
      ]);

      // Handle errors
      if (pageViewsResult.error) throw pageViewsResult.error;
      if (profilesResult.error) throw profilesResult.error;
      if (leadsResult.error) throw leadsResult.error;
      if (messagesResult.error) throw messagesResult.error;

      // Calculate unique visitors
      const uniqueVisitors = new Set(
        pageViewsResult.data?.map(v => v.session_id).filter(Boolean)
      ).size;

      const signups = profilesResult.data?.length || 0;
      const leadsSaved = leadsResult.data?.length || 0;
      const messagesSent = messagesResult.data?.length || 0;

      // Create funnel data
      const funnel: FunnelStep[] = [
        {
          label: 'Visitantes',
          value: uniqueVisitors,
          percentage: 100,
          color: 'hsl(var(--primary))',
        },
        {
          label: 'Cadastros',
          value: signups,
          percentage: uniqueVisitors > 0 ? Math.round((signups / uniqueVisitors) * 100) : 0,
          color: 'hsl(var(--secondary))',
        },
        {
          label: 'Leads Salvos',
          value: leadsSaved,
          percentage: signups > 0 ? Math.round((leadsSaved / signups) * 100) : 0,
          color: 'hsl(var(--accent))',
        },
        {
          label: 'Mensagens Enviadas',
          value: messagesSent,
          percentage: leadsSaved > 0 ? Math.round((messagesSent / leadsSaved) * 100) : 0,
          color: 'hsl(var(--success))',
        },
      ];

      // Calculate overall conversion
      const overallConversion = uniqueVisitors > 0 
        ? Math.round((messagesSent / uniqueVisitors) * 100 * 10) / 10 
        : 0;

      return { funnel, overallConversion };
    },
    refetchInterval: 60000,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Funil de Conversão
        </CardTitle>
        <CardDescription>
          Jornada do visitante até o envio de mensagem
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {data?.funnel.map((step, index) => {
              // Calculate width based on first step
              const widthPercentage = data.funnel[0].value > 0 
                ? Math.max((step.value / data.funnel[0].value) * 100, 15) 
                : 100;
              
              return (
                <div key={step.label} className="relative">
                  {/* Funnel Bar */}
                  <div
                    className="relative rounded-lg p-3 transition-all duration-500"
                    style={{
                      width: `${widthPercentage}%`,
                      background: step.color,
                      marginLeft: `${(100 - widthPercentage) / 2}%`,
                    }}
                  >
                    <div className="flex items-center justify-between text-white">
                      <span className="font-medium text-sm">{step.label}</span>
                      <span className="font-bold">{step.value}</span>
                    </div>
                  </div>
                  
                  {/* Arrow and Conversion Rate */}
                  {index < data.funnel.length - 1 && (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {data.funnel[index + 1].percentage}% conversão
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overall Conversion */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Conversão Total (Visitante → Mensagem)
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
