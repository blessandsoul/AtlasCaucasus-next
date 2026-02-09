'use client';

import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateCard } from './TemplateCard';
import type { AiTemplate } from '../types/ai.types';

interface TemplateGridProps {
  templates: AiTemplate[];
  isLoading: boolean;
  selectedTemplate: AiTemplate | null;
  onSelectTemplate: (template: AiTemplate) => void;
}

export function TemplateGrid({
  templates,
  isLoading,
  selectedTemplate,
  onSelectTemplate,
}: TemplateGridProps): React.ReactElement {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12 text-center">
        <p className="text-muted-foreground">
          {t('ai.no_templates', 'No templates available')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">
        {t('ai.select_template', 'Select a template')}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onSelect={onSelectTemplate}
          />
        ))}
      </div>
    </div>
  );
}
