import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface RobotRunsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  robotId: string;
  robotName: string;
  language: 'pt-BR' | 'en-US';
}

export const RobotRunsDialog: React.FC<RobotRunsDialogProps> = ({ open, onOpenChange, robotId, robotName, language }) => {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['robot-runs', robotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('robot_runs')
        .select('*')
        .eq('robot_id', robotId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const tt = language === 'pt-BR' ? {
    title: 'Histórico de Execuções',
    empty: 'Nenhuma execução registrada.',
    found: 'encontrados',
    saved: 'salvos',
  } : {
    title: 'Run History',
    empty: 'No runs recorded.',
    found: 'found',
    saved: 'saved',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tt.title}: {robotName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : runs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{tt.empty}</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run: any) => (
              <div key={run.id} className="p-3 rounded-lg border space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {run.status === 'success' && <Check className="w-4 h-4 text-success" />}
                    {run.status === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
                    {run.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    <Badge variant={run.status === 'success' ? 'default' : run.status === 'error' ? 'destructive' : 'secondary'}>
                      {run.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(run.started_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {run.leads_found} {tt.found} · {run.leads_saved} {tt.saved}
                </div>
                {run.error_message && (
                  <p className="text-xs text-destructive">{run.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
