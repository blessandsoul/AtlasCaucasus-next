'use client';

import { useTranslation } from 'react-i18next';
import { checkPasswordStrength } from '../schemas/validation';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const { t } = useTranslation();
  if (!password) return null;

  const { checks, strength, score } = checkPasswordStrength(password);

  const strengthColors: Record<string, string> = {
    weak: 'bg-destructive',
    medium: 'bg-warning',
    strong: 'bg-success',
  };

  const strengthText: Record<string, string> = {
    weak: t('auth.password_strength.weak'),
    medium: t('auth.password_strength.medium'),
    strong: t('auth.password_strength.strong'),
  };

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              level <= score ? strengthColors[strength] : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Strength label */}
      <p className="text-xs text-muted-foreground">
        {t('auth.password_strength.title')} <span className="font-medium">{strengthText[strength]}</span>
      </p>

      {/* Requirements checklist */}
      <div className="space-y-1 text-xs">
        <div className={cn('flex items-center gap-1', checks.length ? 'text-success' : 'text-muted-foreground')}>
          <span>{checks.length ? '✓' : '○'}</span>
          <span>{t('auth.password_requirements.length')}</span>
        </div>
        <div className={cn('flex items-center gap-1', checks.uppercase ? 'text-success' : 'text-muted-foreground')}>
          <span>{checks.uppercase ? '✓' : '○'}</span>
          <span>{t('auth.password_requirements.uppercase')}</span>
        </div>
        <div className={cn('flex items-center gap-1', checks.lowercase ? 'text-success' : 'text-muted-foreground')}>
          <span>{checks.lowercase ? '✓' : '○'}</span>
          <span>{t('auth.password_requirements.lowercase')}</span>
        </div>
        <div className={cn('flex items-center gap-1', checks.number ? 'text-success' : 'text-muted-foreground')}>
          <span>{checks.number ? '✓' : '○'}</span>
          <span>{t('auth.password_requirements.number')}</span>
        </div>
        <div className={cn('flex items-center gap-1', checks.special ? 'text-success' : 'text-muted-foreground')}>
          <span>{checks.special ? '✓' : '○'}</span>
          <span>{t('auth.password_requirements.special')}</span>
        </div>
      </div>
    </div>
  );
};
