'use client';

import { Map, Calendar, Megaphone, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AiTemplate } from '../types/ai.types';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  'tour-description': Map,
  'tour-itinerary': Calendar,
  'marketing-social': Megaphone,
  'blog-post': FileText,
};

const TEMPLATE_COLORS: Record<string, string> = {
  'tour-description': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'tour-itinerary': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'marketing-social': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'blog-post': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

interface TemplateCardProps {
  template: AiTemplate;
  isSelected: boolean;
  onSelect: (template: AiTemplate) => void;
}

export function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps): React.ReactElement {
  const { t } = useTranslation();
  const Icon = TEMPLATE_ICONS[template.id] || FileText;
  const colorClass = TEMPLATE_COLORS[template.id] || 'bg-primary/10 text-primary';

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className={cn(
        'group flex w-full flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all duration-300',
        'hover:shadow-md hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border/50 bg-card shadow-sm hover:border-primary/30'
      )}
    >
      <div className="flex w-full items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {template.creditCost} {t('ai.credits', 'credits')}
        </Badge>
      </div>
      <div>
        <h3 className="font-semibold leading-tight">
          {t(`ai.template.${template.id.replace(/-/g, '_')}`, template.name)}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {t(`ai.template.${template.id.replace(/-/g, '_')}_desc`, template.description)}
        </p>
      </div>
    </button>
  );
}
