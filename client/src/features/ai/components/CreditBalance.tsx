'use client';

import { Coins, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCreditBalance } from '../hooks/useAiStudio';

interface CreditBalanceProps {
  onViewHistory: () => void;
}

export function CreditBalance({ onViewHistory }: CreditBalanceProps): React.ReactElement {
  const { t } = useTranslation();
  const { data: balance, isLoading } = useCreditBalance();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Coins className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {t('ai.credits', 'Credits')}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {balance?.balance ?? 0}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onViewHistory}
        className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <History className="mr-1.5 h-4 w-4" />
        {t('ai.credit_history', 'History')}
      </Button>
    </div>
  );
}
