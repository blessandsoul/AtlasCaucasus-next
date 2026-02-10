import type { TemplateField } from "../ai/ai.types.js";

/** Admin view of an AI template with source and override metadata. */
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
  /** 'disk' = original file-based template, 'override' = customized via admin dashboard */
  source: "disk" | "override";
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Body for PUT /admin/ai/templates/:id */
export interface UpdateTemplateInput {
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
