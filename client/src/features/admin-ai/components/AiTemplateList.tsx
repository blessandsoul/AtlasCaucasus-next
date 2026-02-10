'use client';

import { Bot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AiTemplateCard } from './AiTemplateCard';
import { useToggleAiTemplate } from '../hooks/useAdminAiTemplates';
import type { AdminAiTemplate } from '../types/admin-ai.types';

interface AiTemplateListProps {
  templates: AdminAiTemplate[] | undefined;
  isLoading: boolean;
  onEdit: (template: AdminAiTemplate) => void;
}

export const AiTemplateList = ({ templates, isLoading, onEdit }: AiTemplateListProps) => {
  const { mutate: toggleTemplate, isPending: isToggling } = useToggleAiTemplate();

  const handleToggle = (id: string, isActive: boolean): void => {
    toggleTemplate({ id, isActive });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
        <Bot className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No AI templates found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <AiTemplateCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onToggle={handleToggle}
          isToggling={isToggling}
        />
      ))}
    </div>
  );
};
