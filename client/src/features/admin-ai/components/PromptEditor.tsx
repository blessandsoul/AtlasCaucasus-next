'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const PromptEditor = ({ value, onChange }: PromptEditorProps) => {
  const lineCount = value.split('\n').length;
  const charCount = value.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {lineCount} lines &middot; {charCount.toLocaleString()} chars
        </span>
      </div>
      <Textarea
        id="systemPrompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter the system prompt that defines the AI's personality and behavior..."
        rows={20}
        className="resize-y font-mono text-sm leading-relaxed"
      />
      <p className="text-xs text-muted-foreground">
        This prompt defines the AI&apos;s personality, tone, and output format. Users never see this.
      </p>
    </div>
  );
};
