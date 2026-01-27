import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PasswordStrength } from '@/hooks/usePasswordValidation';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  strength,
  showRequirements = true,
}) => {
  if (!strength.label) return null;

  const requirements = [
    { key: 'length', label: 'Mínimo 8 caracteres', met: strength.requirements.length },
    { key: 'uppercase', label: 'Uma letra maiúscula (A-Z)', met: strength.requirements.uppercase },
    { key: 'lowercase', label: 'Uma letra minúscula (a-z)', met: strength.requirements.lowercase },
    { key: 'number', label: 'Um número (0-9)', met: strength.requirements.number },
    { key: 'special', label: 'Caractere especial (!@#$...)', met: strength.requirements.special },
  ];

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-200',
                level <= strength.score ? strength.color : 'bg-muted'
              )}
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className={cn(
            'text-xs font-medium',
            strength.score <= 1 && 'text-destructive',
            strength.score === 2 && 'text-orange-500',
            strength.score === 3 && 'text-yellow-600',
            strength.score >= 4 && 'text-emerald-600'
          )}>
            {strength.label}
          </span>
        </div>
      </div>

      {/* Common password warning */}
      {!strength.requirements.notCommon && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>Esta senha está em listas de senhas vazadas. Escolha outra.</span>
        </div>
      )}

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="grid grid-cols-1 gap-1.5">
          {requirements.map((req) => (
            <div
              key={req.key}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                req.met ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
