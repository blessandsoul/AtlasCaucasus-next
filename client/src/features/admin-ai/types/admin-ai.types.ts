export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

export interface AdminAiTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  creditCost: number;
  maxOutputTokens: number;
  temperature: number;
  topP: number | null;
  systemPrompt: string;
  fields: TemplateField[];
  isActive: boolean;
  source: 'disk' | 'override';
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAiTemplateRequest {
  name?: string;
  description?: string;
  creditCost?: number;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number | null;
  systemPrompt?: string;
  fields?: TemplateField[];
  isActive?: boolean;
}
