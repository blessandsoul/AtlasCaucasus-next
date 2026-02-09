import type { AiGenerationStatus, AiGenerationType } from "@prisma/client";

export interface SafeAiGeneration {
  id: string;
  userId: string;
  type: AiGenerationType;
  templateId: string;
  prompt: string;
  userInputs: string;
  result: string | null;
  status: AiGenerationStatus;
  creditCost: number;
  errorMessage: string | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateResult {
  generation: SafeAiGeneration;
  text: string;
}

export interface TemplateField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

export interface AiTemplate {
  id: string;
  name: string;
  description: string;
  type: AiGenerationType;
  creditCost: number;
  fields: TemplateField[];
  systemPrompt: string;
  maxOutputTokens: number;
}
