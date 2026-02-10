'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdminAiTemplate } from '../types/admin-ai.types';

interface TemplateConfigFormProps {
  template: AdminAiTemplate;
  onChange: (field: string, value: string | number) => void;
}

export const TemplateConfigForm = ({ template, onChange }: TemplateConfigFormProps) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={template.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Template name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={template.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Brief description of what this template generates"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="creditCost">Credit Cost</Label>
          <Input
            id="creditCost"
            type="number"
            min={0}
            max={1000}
            value={template.creditCost}
            onChange={(e) => onChange('creditCost', Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Credits deducted per generation</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxOutputTokens">Max Output Tokens</Label>
          <Input
            id="maxOutputTokens"
            type="number"
            min={100}
            max={10000}
            step={100}
            value={template.maxOutputTokens}
            onChange={(e) => onChange('maxOutputTokens', Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Maximum length of AI response</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature: {template.temperature.toFixed(2)}</Label>
          <Input
            id="temperature"
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={template.temperature}
            onChange={(e) => onChange('temperature', Number(e.target.value))}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Lower = more focused, higher = more creative
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Generation Type</Label>
          <Input
            id="type"
            value={template.type}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Type is set by the system</p>
        </div>
      </div>
    </div>
  );
};
