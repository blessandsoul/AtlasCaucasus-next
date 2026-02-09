'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { X, ArrowRight, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CompareItem } from '@/hooks/useCompareSelection';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';

interface FloatingCompareBarProps {
  selectedItems: CompareItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const FloatingCompareBar = ({
  selectedItems,
  onRemove,
  onClear,
}: FloatingCompareBarProps): ReactNode => {
  const router = useRouter();
  const { t } = useTranslation();
  const count = selectedItems.length;
  const canCompare = count >= 2;

  const handleCompare = (): void => {
    const ids = selectedItems.map((item) => item.id).join(',');
    router.push(`${ROUTES.EXPLORE.GUIDES_COMPARE}?ids=${ids}`);
  };

  if (count === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300"
      role="toolbar"
      aria-label={t('compare_guides.title')}
    >
      <div className="bg-card/95 border border-border/50 rounded-2xl shadow-xl backdrop-blur-md p-4">
        {/* Selected Guide Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-muted rounded-xl pl-2 pr-1 py-1.5"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                {item.label}
              </span>
              <button
                onClick={() => onRemove(item.id)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors shrink-0"
                aria-label={`${t('compare.remove')} ${item.label}`}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5"
            aria-label={t('compare.clear_all')}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t('compare.clear_all')}</span>
          </button>

          <div className="flex items-center gap-3">
            {!canCompare && (
              <span className="text-xs text-muted-foreground">
                {t('compare.select_at_least_2')}
              </span>
            )}
            <Button
              onClick={handleCompare}
              disabled={!canCompare}
              className={cn(
                "rounded-xl px-5 h-11 text-sm font-semibold gap-2",
                canCompare && "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              )}
            >
              {t('compare.compare_button')} {count > 1 ? `(${count})` : ''}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
