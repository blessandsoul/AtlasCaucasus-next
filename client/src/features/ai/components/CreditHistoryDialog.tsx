'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCreditHistory } from '../hooks/useAiStudio';

interface CreditHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditHistoryDialog({
  open,
  onOpenChange,
}: CreditHistoryDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCreditHistory({ page, limit: 10 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('ai.credit_history', 'Credit history')}</DialogTitle>
          <DialogDescription>
            {t('ai.credit_history_desc', 'View your credit transaction history.')}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))
          ) : !data || data.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('ai.no_credit_history', 'No transactions yet.')}
            </p>
          ) : (
            data.items.map((tx) => {
              const isPositive = tx.amount > 0;
              const formattedDate = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(tx.createdAt));

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        isPositive
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      )}
                    >
                      {isPositive ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.description || t(`ai.tx_type.${tx.type.toLowerCase()}`, tx.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {isPositive ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t('ai.balance_after', 'Bal: {{balance}}', { balance: tx.balanceAfter })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination.hasPreviousPage}
              onClick={() => setPage((p) => p - 1)}
              className="transition-all duration-200 active:scale-[0.98]"
            >
              {t('common.previous', 'Previous')}
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              {page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="transition-all duration-200 active:scale-[0.98]"
            >
              {t('common.next', 'Next')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
