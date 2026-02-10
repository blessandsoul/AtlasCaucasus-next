'use client';

import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TemplateField } from '../types/admin-ai.types';

interface FieldsEditorProps {
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
] as const;

const emptyField: TemplateField = {
  name: '',
  label: '',
  type: 'text',
  required: false,
};

export const FieldsEditor = ({ fields, onChange }: FieldsEditorProps) => {
  const addField = (): void => {
    onChange([...fields, { ...emptyField, name: `field_${fields.length + 1}` }]);
  };

  const removeField = (index: number): void => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof TemplateField, value: unknown): void => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };

    // Clear options if type is no longer select
    if (key === 'type' && value !== 'select') {
      delete updated[index].options;
    }
    // Initialize options when switching to select
    if (key === 'type' && value === 'select' && !updated[index].options) {
      updated[index].options = [{ value: '', label: '' }];
    }

    onChange(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down'): void => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const addOption = (fieldIndex: number): void => {
    const updated = [...fields];
    const options = [...(updated[fieldIndex].options ?? [])];
    options.push({ value: '', label: '' });
    updated[fieldIndex] = { ...updated[fieldIndex], options };
    onChange(updated);
  };

  const removeOption = (fieldIndex: number, optionIndex: number): void => {
    const updated = [...fields];
    const options = [...(updated[fieldIndex].options ?? [])];
    options.splice(optionIndex, 1);
    updated[fieldIndex] = { ...updated[fieldIndex], options };
    onChange(updated);
  };

  const updateOption = (
    fieldIndex: number,
    optionIndex: number,
    key: 'value' | 'label',
    val: string,
  ): void => {
    const updated = [...fields];
    const options = [...(updated[fieldIndex].options ?? [])];
    options[optionIndex] = { ...options[optionIndex], [key]: val };
    updated[fieldIndex] = { ...updated[fieldIndex], options };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Input Fields ({fields.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No fields yet. Add fields that users fill in when generating content.
        </p>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Field {index + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveField(index, 'up')}
                  disabled={index === 0}
                  className="h-7 w-7 p-0"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Field Name (key)</Label>
                <Input
                  value={field.name}
                  onChange={(e) => updateField(index, 'name', e.target.value)}
                  placeholder="e.g. tourTitle"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Label (display)</Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, 'label', e.target.value)}
                  placeholder="e.g. Tour Title"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Input Type</Label>
                <Select
                  value={field.type}
                  onValueChange={(val) => updateField(index, 'type', val)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>
                        {ft.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Placeholder</Label>
                <Input
                  value={field.placeholder ?? ''}
                  onChange={(e) => updateField(index, 'placeholder', e.target.value || undefined)}
                  placeholder="e.g. Enter tour title"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-end pb-0.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`required-${index}`}
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(index, 'required', !!checked)}
                  />
                  <Label htmlFor={`required-${index}`} className="text-xs cursor-pointer">
                    Required
                  </Label>
                </div>
              </div>
            </div>

            {field.type === 'select' && (
              <div className="space-y-2 rounded-md bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Options</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addOption(index)}
                    className="h-6 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Option
                  </Button>
                </div>
                {(field.options ?? []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <Input
                      value={opt.value}
                      onChange={(e) => updateOption(index, optIdx, 'value', e.target.value)}
                      placeholder="value"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={opt.label}
                      onChange={(e) => updateOption(index, optIdx, 'label', e.target.value)}
                      placeholder="Label"
                      className="h-7 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index, optIdx)}
                      className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {field.defaultValue !== undefined && (
              <div className="space-y-1.5">
                <Label className="text-xs">Default Value</Label>
                <Input
                  value={field.defaultValue ?? ''}
                  onChange={(e) => updateField(index, 'defaultValue', e.target.value || undefined)}
                  placeholder="Default value"
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
