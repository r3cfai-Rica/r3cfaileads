import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MousePointerClick, Eye, TrendingUp, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ConversionData {
  page: string;
  section: string;
  clicks: number;
  views: number;
  rate: number;
}

export const ConversionRateCard: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cta-conversion-rates'],
    queryFn: async () => {
      // Fetch clicks grouped by page/section
      const { data: clicks, error: clicksError } = await supabase
        .from('cta_clicks')
        .select('page, section')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (clicksError) throw clicksError;

      // Fetch page views
      const { data: views, error: viewsError } = await supabase
        .from('page_views')
        .select('page')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (viewsError) throw viewsError;

      // Group clicks by page/section
      const clicksMap = new Map<string, number>();
      clicks?.forEach((click) => {
        const key = `${click.page}|${click.section}`;
        clicksMap.set(key, (clicksMap.get(key) || 0) + 1);
      });

      // Group views by page
      const viewsMap = new Map<string, number>();
      views?.forEach((view) => {
        viewsMap.set(view.page, (viewsMap.get(view.page) || 0) + 1);
      });

      // Calculate conversion rates
      const conversions: ConversionData[] = [];
      clicksMap.forEach((clickCount, key) => {
        const [page, section] = key.split('|');
        const viewCount = viewsMap.get(page) || 1;
        conversions.push({
          page,
          section,
          clicks: clickCount,
          views: viewCount,
          rate: Math.round((clickCount / viewCount) * 100 * 10) / 10,
        });
      });

      // Sort by clicks descending
      conversions.sort((a, b) => b.clicks - a.clicks);

      // Get totals
      const totalClicks = clicks?.length || 0;
      const totalViews = views?.length || 0;
      const overallRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100 * 10) / 10 : 0;

      return {
        conversions: conversions.slice(0, 5),
        totalClicks,
        totalViews,
        overallRate,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-primary" />
            Conversão de CTAs
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
          <MousePointerClick className="w-5 h-5 text-primary" />
          Conversão de CTAs
        </CardTitle>
        <CardDescription>Taxa de cliques nos últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                  <Eye className="w-3 h-3" />
                  Views
                </div>
                <p className="text-2xl font-bold">{data?.totalViews || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                  <MousePointerClick className="w-3 h-3" />
                  Cliques
                </div>
                <p className="text-2xl font-bold">{data?.totalClicks || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Taxa
                </div>
                <p className="text-2xl font-bold text-primary">{data?.overallRate || 0}%</p>
              </div>
            </div>

            {/* By Section */}
            {data?.conversions && data.conversions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Por Seção</p>
                {data.conversions.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">
                        {item.section}
                        <span className="text-muted-foreground ml-1">({item.page})</span>
                      </span>
                      <span className="font-medium">{item.rate}%</span>
                    </div>
                    <Progress value={Math.min(item.rate, 100)} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <MousePointerClick className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Nenhum dado de conversão ainda</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
