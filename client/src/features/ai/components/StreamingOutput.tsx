'use client';

import { useState, useCallback } from 'react';
import { Check, Copy, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StreamingOutputProps {
  text: string;
  isStreaming: boolean;
  onApplyToTour: () => void;
  generationId: string | null;
}

export function StreamingOutput({
  text,
  isStreaming,
  onApplyToTour,
  generationId,
}: StreamingOutputProps): React.ReactElement {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t('ai.copied', 'Copied to clipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('ai.copy_failed', 'Failed to copy'));
    }
  }, [text, t]);

  if (!text && !isStreaming) return <></>;

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl border border-border/50 bg-muted/30 p-5">
        <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap leading-relaxed">
          {text}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-primary" />
          )}
        </div>
      </div>

      {!isStreaming && text && (
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

          {generationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={onApplyToTour}
              className={cn(
                'transition-all duration-200 active:scale-[0.98]',
                'border-primary/30 text-primary hover:bg-primary/5'
              )}
            >
              <ArrowRight className="mr-1.5 h-4 w-4" />
              {t('ai.apply_to_tour', 'Apply to tour')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
