'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Check, Copy, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AiGeneration } from '../types/ai.types';

interface GenerationDetailProps {
  generation: AiGeneration;
  onBack: () => void;
  onApplyToTour: (generationId: string) => void;
}

export function GenerationDetail({
  generation,
  onBack,
  onApplyToTour,
}: GenerationDetailProps): React.ReactElement {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!generation.result) return;
    try {
      await navigator.clipboard.writeText(generation.result);
      setCopied(true);
      toast.success(t('ai.copied', 'Copied to clipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('ai.copy_failed', 'Failed to copy'));
    }
  }, [generation.result, t]);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(generation.createdAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back', 'Back')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {t(`ai.template.${generation.templateId.replace(/-/g, '_')}`, generation.templateId)}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {generation.creditCost} {t('ai.credits', 'credits')}
        </Badge>
      </div>

      {generation.result && (
        <>
          <div className="rounded-xl border border-border/50 bg-muted/30 p-5">
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap leading-relaxed">
              {generation.result}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="transition-all duration-200 active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 text-green-500" />
                  {t('ai.copied', 'Copied')}
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  {t('ai.copy', 'Copy')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyToTour(generation.id)}
              className={cn(
                'transition-all duration-200 active:scale-[0.98]',
                'border-primary/30 text-primary hover:bg-primary/5'
              )}
            >
              <ArrowRight className="mr-1.5 h-4 w-4" />
              {t('ai.apply_to_tour', 'Apply to tour')}
            </Button>
          </div>
        </>
      )}

      {generation.status === 'FAILED' && generation.errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{generation.errorMessage}</p>
        </div>
      )}
    </div>
  );
}
