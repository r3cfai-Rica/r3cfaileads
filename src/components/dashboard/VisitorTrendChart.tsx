import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2, Users } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PeriodOption } from './AnalyticsPeriodFilter';

interface VisitorTrendChartProps {
  period: PeriodOption;
}

interface DailyData {
  date: string;
  visitors: number;
  sessions: number;
}

const periodDays: Record<PeriodOption, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const VisitorTrendChart: React.FC<VisitorTrendChartProps> = ({ period }) => {
  const days = periodDays[period];

  const { data, isLoading, error } = useQuery({
    queryKey: ['visitor-trends', period],
    queryFn: async () => {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { data: pageViews, error } = await supabase
        .from('page_views')
        .select('created_at, session_id')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group by date
      const dailyMap = new Map<string, { visitors: Set<string>; sessions: number }>();
      
      // Initialize all days in the period
      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        dailyMap.set(dateKey, { visitors: new Set(), sessions: 0 });
      }

      // Count unique sessions per day
      pageViews?.forEach((view) => {
        const dateKey = new Date(view.created_at).toISOString().split('T')[0];
        const dayData = dailyMap.get(dateKey);
        if (dayData) {
          if (view.session_id) {
            dayData.visitors.add(view.session_id);
          }
          dayData.sessions++;
        }
      });

      // Convert to array
      const result: DailyData[] = [];
      dailyMap.forEach((value, key) => {
        result.push({
          date: key,
          visitors: value.visitors.size,
          sessions: value.sessions,
        });
      });

      // Sort by date
      result.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate totals
      const totalVisitors = new Set(pageViews?.map(v => v.session_id).filter(Boolean)).size;
      const totalSessions = pageViews?.length || 0;

      return {
        chartData: result,
        totalVisitors,
        totalSessions,
      };
    },
    refetchInterval: 60000,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tendência de Visitantes
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
          <TrendingUp className="w-5 h-5 text-primary" />
          Tendência de Visitantes
        </CardTitle>
        <CardDescription>Visitantes únicos por dia</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                  <Users className="w-3 h-3" />
                  Visitantes Únicos
                </div>
                <p className="text-xl font-bold">{data?.totalVisitors || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Total de Views
                </div>
                <p className="text-xl font-bold">{data?.totalSessions || 0}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData || []}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatDate}
                    interval={Math.floor((data?.chartData?.length || 7) / 5)}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value: number) => [value, 'Visitantes']}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorVisitors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
