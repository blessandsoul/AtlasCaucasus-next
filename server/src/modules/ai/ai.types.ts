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

// ---------------------------------------------------------------------------
// Extended template definition (per-function configuration)
// ---------------------------------------------------------------------------

/** Per-template AI model configuration overrides. */
export interface AiModelConfig {
  /** Temperature for generation. Default: 0.7 */
  temperature?: number;
  /** Top-P sampling. Provider-dependent. */
  topP?: number;
}

/** Validates raw AI output. Returns cleaned string or throws on invalid output. */
export type OutputValidator = (rawOutput: string) => string;

/** Post-processes validated output before returning to the user. */
export type OutputPostProcessor = (validatedOutput: string) => string;

/** Custom prompt builder. Receives template fields and user inputs, returns the user prompt string. */
export type PromptBuilder = (
  fields: TemplateField[],
  userInputs: Record<string, string>,
) => string;

/**
 * Full template definition including per-function hooks.
 * Each template folder exports one of these. The registry converts
 * them to plain AiTemplate for the public API.
 */
export interface AiTemplateDefinition {
  id: string;
  name: string;
  description: string;
  type: AiGenerationType;
  creditCost: number;
  maxOutputTokens: number;
  fields: TemplateField[];
  systemPrompt: string;
  modelConfig?: AiModelConfig;
  validateOutput?: OutputValidator;
  postProcessOutput?: OutputPostProcessor;
  buildPrompt?: PromptBuilder;
}
