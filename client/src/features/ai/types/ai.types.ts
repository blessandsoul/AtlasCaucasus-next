// AI Generation types matching backend API response

export type AiGenerationStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type AiGenerationType = 'TOUR_DESCRIPTION' | 'TOUR_ITINERARY' | 'MARKETING_COPY' | 'BLOG_CONTENT';
export type CreditTransactionType = 'INITIAL_GRANT' | 'GENERATION_DEBIT' | 'GENERATION_REFUND' | 'ADMIN_GRANT' | 'PURCHASE';

export interface TemplateFieldOption {
  value: string;
  label: string;
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  options?: TemplateFieldOption[];
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

export interface AiGeneration {
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
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRequest {
  templateId: string;
  inputs: Record<string, string>;
}

export interface GenerateResult {
  generation: AiGeneration;
  text: string;
}

export interface CreditBalance {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: CreditTransactionType;
  description: string | null;
  metadata: string | null;
  balanceAfter: number;
  createdAt: string;
}

export interface GenerationsResponse {
  items: AiGeneration[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreditHistoryResponse {
  items: CreditTransaction[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApplyToTourRequest {
  generationId: string;
  tourId: string;
  field: 'description' | 'summary' | 'itinerary';
}

// SSE event types
export interface SSEChunkEvent {
  type: 'chunk';
  text: string;
}

export interface SSEDoneEvent {
  type: 'done';
  generationId?: string;
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export type SSEEvent = SSEChunkEvent | SSEDoneEvent | SSEErrorEvent;
