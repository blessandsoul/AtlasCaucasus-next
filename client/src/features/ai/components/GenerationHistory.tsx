'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GenerationHistoryItem } from './GenerationHistoryItem';
import { useAiGenerations } from '../hooks/useAiStudio';
import type { AiGeneration } from '../types/ai.types';

interface GenerationHistoryProps {
  onViewGeneration: (generation: AiGeneration) => void;
}

export function GenerationHistory({ onViewGeneration }: GenerationHistoryProps): React.ReactElement {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAiGenerations({ page, limit: 10 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-muted-foreground">
          {t('ai.no_generations', 'No generations yet')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          {t('ai.no_generations_desc', 'Select a template and generate content to see it here.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((generation) => (
        <GenerationHistoryItem
          key={generation.id}
          generation={generation}
          onView={onViewGeneration}
        />
      ))}

      {data.pagination.totalPages > 1 && (
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
    </div>
  );
}
