'use client';

import { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { AiTemplate } from '../types/ai.types';

interface GenerationFormProps {
  template: AiTemplate;
  isGenerating: boolean;
  onGenerate: (inputs: Record<string, string>) => void;
  creditBalance: number;
}

export function GenerationForm({
  template,
  isGenerating,
  onGenerate,
  creditBalance,
}: GenerationFormProps): React.ReactElement {
  const { t } = useTranslation();

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const field of template.fields) {
      if (field.required) {
        shape[field.name] = z.string().min(1, t('ai.field_required', 'This field is required'));
      } else {
        shape[field.name] = z.string().optional().default('');
      }
    }
    return z.object(shape);
  }, [template.fields, t]);

  type FormData = z.infer<typeof schema>;

  const defaultValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of template.fields) {
      values[field.name] = field.defaultValue || '';
    }
    return values;
  }, [template.fields]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleFormSubmit = useCallback(
    (data: FormData) => {
      const inputs: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'string' && value.trim()) {
          inputs[key] = value.trim();
        }
      }
      onGenerate(inputs);
    },
    [onGenerate]
  );

  const insufficientCredits = creditBalance < template.creditCost;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t(`ai.template.${template.id.replace(/-/g, '_')}`, template.name)}
        </h3>
        <Badge variant="secondary" className="tabular-nums">
          {template.creditCost} {t('ai.credits', 'credits')}
        </Badge>
      </div>

      <div className="space-y-4">
        {template.fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name}>
              {t(`ai.field.${field.name}`, field.label)}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>

            {field.type === 'text' && (
              <Input
                id={field.name}
                placeholder={field.placeholder}
                disabled={isGenerating}
                {...register(field.name)}
                className={errors[field.name] ? 'border-destructive' : ''}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                id={field.name}
                placeholder={field.placeholder}
                disabled={isGenerating}
                rows={3}
                {...register(field.name)}
                className={errors[field.name] ? 'border-destructive' : ''}
              />
            )}

            {field.type === 'number' && (
              <Input
                id={field.name}
                type="number"
                placeholder={field.placeholder}
                disabled={isGenerating}
                {...register(field.name)}
                className={errors[field.name] ? 'border-destructive' : ''}
              />
            )}

            {field.type === 'select' && field.options && (
              <Select
                value={watch(field.name) || ''}
                onValueChange={(value) => setValue(field.name, value, { shouldValidate: true })}
                disabled={isGenerating}
              >
                <SelectTrigger
                  id={field.name}
                  className={errors[field.name] ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder={t('ai.select_option', 'Select an option')} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {errors[field.name] && (
              <p className="text-sm text-destructive">
                {errors[field.name]?.message as string}
              </p>
            )}
          </div>
        ))}
      </div>

      <Button
        type="submit"
        disabled={isGenerating || insufficientCredits}
        className="w-full transition-all duration-200 active:scale-[0.98]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('ai.generating', 'Generating...')}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {t('ai.generate', 'Generate')} ({template.creditCost} {t('ai.credits', 'credits')})
          </>
        )}
      </Button>

      {insufficientCredits && (
        <p className="text-center text-sm text-destructive">
          {t('ai.insufficient_credits', 'Not enough credits. You need {{cost}} but have {{balance}}.', {
            cost: template.creditCost,
            balance: creditBalance,
          })}
        </p>
      )}
    </form>
  );
}
