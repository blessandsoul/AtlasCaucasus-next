'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TemplateConfigForm } from './TemplateConfigForm';
import { PromptEditor } from './PromptEditor';
import { FieldsEditor } from './FieldsEditor';
import { useUpdateAiTemplate, useResetAiTemplate } from '../hooks/useAdminAiTemplates';
import type { AdminAiTemplate, TemplateField, UpdateAiTemplateRequest } from '../types/admin-ai.types';

interface AiTemplateEditorProps {
  template: AdminAiTemplate;
  onBack: () => void;
}

export const AiTemplateEditor = ({ template, onBack }: AiTemplateEditorProps) => {
  const [draft, setDraft] = useState<AdminAiTemplate>({ ...template });
  const [activeTab, setActiveTab] = useState('config');
  const { mutate: updateTemplate, isPending: isSaving } = useUpdateAiTemplate();
  const { mutate: resetTemplate, isPending: isResetting } = useResetAiTemplate();

  const handleConfigChange = useCallback((field: string, value: string | number) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePromptChange = useCallback((value: string) => {
    setDraft((prev) => ({ ...prev, systemPrompt: value }));
  }, []);

  const handleFieldsChange = useCallback((fields: TemplateField[]) => {
    setDraft((prev) => ({ ...prev, fields }));
  }, []);

  const handleSave = (): void => {
    const changes: UpdateAiTemplateRequest = {};

    if (draft.name !== template.name) changes.name = draft.name;
    if (draft.description !== template.description) changes.description = draft.description;
    if (draft.creditCost !== template.creditCost) changes.creditCost = draft.creditCost;
    if (draft.maxOutputTokens !== template.maxOutputTokens) changes.maxOutputTokens = draft.maxOutputTokens;
    if (draft.temperature !== template.temperature) changes.temperature = draft.temperature;
    if (draft.systemPrompt !== template.systemPrompt) changes.systemPrompt = draft.systemPrompt;
    if (JSON.stringify(draft.fields) !== JSON.stringify(template.fields)) changes.fields = draft.fields;

    if (Object.keys(changes).length === 0) {
      onBack();
      return;
    }

    updateTemplate(
      { id: template.id, data: changes },
      { onSuccess: () => onBack() },
    );
  };

  const handleReset = (): void => {
    resetTemplate(template.id, {
      onSuccess: () => onBack(),
    });
  };

  const hasChanges =
    draft.name !== template.name ||
    draft.description !== template.description ||
    draft.creditCost !== template.creditCost ||
    draft.maxOutputTokens !== template.maxOutputTokens ||
    draft.temperature !== template.temperature ||
    draft.systemPrompt !== template.systemPrompt ||
    JSON.stringify(draft.fields) !== JSON.stringify(template.fields);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{template.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground">{template.id}</span>
              {template.source === 'override' && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Customized
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {template.source === 'override' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isResetting}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will discard all your customizations and revert &ldquo;{template.name}&rdquo; to
                    its original settings, including the system prompt, configuration, and fields. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    Reset to Defaults
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="fields">Fields ({draft.fields.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <TemplateConfigForm template={draft} onChange={handleConfigChange} />
        </TabsContent>

        <TabsContent value="prompt" className="mt-6">
          <PromptEditor value={draft.systemPrompt} onChange={handlePromptChange} />
        </TabsContent>

        <TabsContent value="fields" className="mt-6">
          <FieldsEditor fields={draft.fields} onChange={handleFieldsChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
