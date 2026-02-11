'use client';

import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreditBalance } from './CreditBalance';
import { TemplateGrid } from './TemplateGrid';
import { GenerationForm } from './GenerationForm';
import { StreamingOutput } from './StreamingOutput';
import { GenerationHistory } from './GenerationHistory';
import { GenerationDetail } from './GenerationDetail';
import { ApplyToTourDialog } from './ApplyToTourDialog';
import { CreditHistoryDialog } from './CreditHistoryDialog';
import { useAiTemplates, useCreditBalance } from '../hooks/useAiStudio';
import { aiService } from '../services/ai.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { AiTemplate, AiGeneration } from '../types/ai.types';

export function AiStudioPage(): React.ReactElement {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedTemplate, setSelectedTemplate] = useState<AiTemplate | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [viewingGeneration, setViewingGeneration] = useState<AiGeneration | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyGenerationId, setApplyGenerationId] = useState('');
  const [creditHistoryOpen, setCreditHistoryOpen] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useAiTemplates();
  const { data: balance, refetch: refetchBalance } = useCreditBalance();

  const handleSelectTemplate = useCallback((template: AiTemplate) => {
    setSelectedTemplate(template);
    setStreamedText('');
    setCurrentGenerationId(null);
  }, []);

  const handleGenerate = useCallback(
    async (inputs: Record<string, string>) => {
      if (!selectedTemplate) return;

      setStreamedText('');
      setIsStreaming(true);
      setCurrentGenerationId(null);

      try {
        await aiService.generateStream(
          { templateId: selectedTemplate.id, inputs },
          (chunk) => {
            setStreamedText((prev) => prev + chunk);
          },
          (generationId) => {
            setIsStreaming(false);
            if (generationId) {
              setCurrentGenerationId(generationId);
            }
            refetchBalance();
          },
          (message) => {
            setIsStreaming(false);
            toast.error(message);
            refetchBalance();
          }
        );
      } catch (error) {
        setIsStreaming(false);
        toast.error(getErrorMessage(error));
        refetchBalance();
      }
    },
    [selectedTemplate, refetchBalance]
  );

  const handleApplyToTour = useCallback((generationId: string) => {
    setApplyGenerationId(generationId);
    setApplyDialogOpen(true);
  }, []);

  const handleStreamApplyToTour = useCallback(() => {
    if (currentGenerationId) {
      handleApplyToTour(currentGenerationId);
    }
  }, [currentGenerationId, handleApplyToTour]);

  const handleViewGeneration = useCallback((generation: AiGeneration) => {
    setViewingGeneration(generation);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setViewingGeneration(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">
              {t('ai.studio_title', 'AI Studio')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('ai.studio_description', 'Generate professional content for your tours and listings')}
            </p>
          </div>
        </div>
      </div>

      {/* Credit Balance */}
      <CreditBalance onViewHistory={() => setCreditHistoryOpen(true)} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">
            {t('ai.templates', 'Generate')}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t('ai.history', 'History')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="space-y-6">
            {/* Template Selection */}
            <TemplateGrid
              templates={templates || []}
              isLoading={templatesLoading}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
            />

            {/* Generation Form + Output */}
            {selectedTemplate && (
              <div className="space-y-6 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                <GenerationForm
                  key={selectedTemplate.id}
                  template={selectedTemplate}
                  isGenerating={isStreaming}
                  onGenerate={handleGenerate}
                  creditBalance={balance?.balance ?? 0}
                />

                <StreamingOutput
                  text={streamedText}
                  isStreaming={isStreaming}
                  onApplyToTour={handleStreamApplyToTour}
                  generationId={currentGenerationId}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          {viewingGeneration ? (
            <GenerationDetail
              generation={viewingGeneration}
              onBack={handleBackFromDetail}
              onApplyToTour={handleApplyToTour}
            />
          ) : (
            <GenerationHistory onViewGeneration={handleViewGeneration} />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ApplyToTourDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        generationId={applyGenerationId}
      />

      <CreditHistoryDialog
        open={creditHistoryOpen}
        onOpenChange={setCreditHistoryOpen}
      />
    </div>
  );
}
