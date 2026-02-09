'use client';

import { Map, Calendar, Megaphone, FileText, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AiGeneration } from '../types/ai.types';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  'tour-description': Map,
  'tour-itinerary': Calendar,
  'marketing-social': Megaphone,
  'blog-post': FileText,
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface GenerationHistoryItemProps {
  generation: AiGeneration;
  onView: (generation: AiGeneration) => void;
}

export function GenerationHistoryItem({
  generation,
  onView,
}: GenerationHistoryItemProps): React.ReactElement {
  const { t } = useTranslation();
  const Icon = TEMPLATE_ICONS[generation.templateId] || FileText;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(generation.createdAt));

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {t(`ai.template.${generation.templateId.replace(/-/g, '_')}`, generation.templateId)}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            <span className="text-border">|</span>
            <span className="tabular-nums">{generation.creditCost} {t('ai.credits', 'credits')}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn('text-xs', STATUS_STYLES[generation.status])}
        >
          {t(`ai.status.${generation.status.toLowerCase()}`, generation.status)}
        </Badge>
        {generation.status === 'COMPLETED' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(generation)}
            className="h-8 w-8 p-0 transition-colors duration-150 hover:text-primary"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">{t('ai.view_result', 'View result')}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
