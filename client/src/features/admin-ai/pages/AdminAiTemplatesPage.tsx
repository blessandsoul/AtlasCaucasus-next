'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
import { AiTemplateList } from '../components/AiTemplateList';
import { AiTemplateEditor } from '../components/AiTemplateEditor';
import { useAdminAiTemplates, useAdminAiTemplate } from '../hooks/useAdminAiTemplates';
import type { AdminAiTemplate } from '../types/admin-ai.types';

export const AdminAiTemplatesPage = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: templates, isLoading } = useAdminAiTemplates();

  // Fetch fresh data for the template being edited
  const { data: editingTemplate } = useAdminAiTemplate(editingId ?? '');

  const handleEdit = (template: AdminAiTemplate): void => {
    setEditingId(template.id);
  };

  const handleBack = (): void => {
    setEditingId(null);
  };

  if (editingId && editingTemplate) {
    return <AiTemplateEditor template={editingTemplate} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">AI Templates</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize AI generation templates — edit prompts, tweak settings, and manage input fields.
        </p>
      </div>

      <AiTemplateList
        templates={templates}
        isLoading={isLoading}
        onEdit={handleEdit}
      />
    </div>
  );
};
