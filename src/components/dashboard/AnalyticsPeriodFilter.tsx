import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export type PeriodOption = '7d' | '30d' | '90d';

interface AnalyticsPeriodFilterProps {
  value: PeriodOption;
  onChange: (period: PeriodOption) => void;
}

const periodLabels: Record<PeriodOption, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
};

export const AnalyticsPeriodFilter: React.FC<AnalyticsPeriodFilterProps> = ({
  value,
  onChange,
}) => {
  const periods: PeriodOption[] = ['7d', '30d', '90d'];

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <div className="flex bg-muted rounded-lg p-0.5">
        {periods.map((period) => (
          <Button
            key={period}
            variant={value === period ? 'default' : 'ghost'}
            size="sm"
            className={`h-7 px-3 text-xs ${
              value === period
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-background/50'
            }`}
            onClick={() => onChange(period)}
          >
            {periodLabels[period]}
          </Button>
        ))}
      </div>
    </div>
  );
};
