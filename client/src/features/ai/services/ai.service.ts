import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { store } from '@/store';
import type {
  AiTemplate,
  AiGeneration,
  GenerateRequest,
  GenerateResult,
  GenerationsResponse,
  CreditBalance,
  CreditHistoryResponse,
  ApplyToTourRequest,
  SSEEvent,
} from '../types/ai.types';

interface GenerationsParams {
  page?: number;
  limit?: number;
}

interface CreditHistoryParams {
  page?: number;
  limit?: number;
}

class AiService {
  async getTemplates(): Promise<AiTemplate[]> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: AiTemplate[];
    }>(API_ENDPOINTS.AI.TEMPLATES);

    return response.data.data;
  }

  async generate(data: GenerateRequest): Promise<GenerateResult> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: GenerateResult;
    }>(API_ENDPOINTS.AI.GENERATE, data);

    return response.data.data;
  }

  async generateStream(
    data: GenerateRequest,
    onChunk: (text: string) => void,
    onDone: (generationId?: string) => void,
    onError: (message: string) => void
  ): Promise<void> {
    const token = store.getState().auth.tokens?.accessToken;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

    const response = await fetch(`${baseUrl}${API_ENDPOINTS.AI.GENERATE_STREAM}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.error?.message || `Generation failed (${response.status})`;
      onError(message);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('Streaming not supported');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let receivedDone = false;

    const processLine = (line: string): void => {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) return;

      const jsonStr = trimmed.slice(6);
      try {
        const event: SSEEvent = JSON.parse(jsonStr);
        if (event.type === 'chunk') {
          onChunk(event.text);
        } else if (event.type === 'done') {
          receivedDone = true;
          onDone(event.generationId);
        } else if (event.type === 'error') {
          onError(event.message);
        }
      } catch {
        // Skip malformed JSON lines
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          processLine(line);
        }
      }

      // Flush remaining buffer and decoder after stream ends
      buffer += decoder.decode();
      if (buffer.trim()) {
        processLine(buffer);
      }

      // If we never received a done event, call onDone to signal completion
      if (!receivedDone) {
        onDone(undefined);
      }
    } catch {
      // Stream closed (e.g. connection ended) — if we already got the done event,
      // this is expected and not an error worth surfacing
      if (!receivedDone) {
        onError('Connection lost during generation');
      }
    } finally {
      reader.releaseLock();
    }
  }

  async getGenerations(params: GenerationsParams = {}): Promise<GenerationsResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: GenerationsResponse;
    }>(API_ENDPOINTS.AI.GENERATIONS, { params });

    return response.data.data;
  }

  async getGeneration(id: string): Promise<AiGeneration> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: AiGeneration;
    }>(API_ENDPOINTS.AI.GENERATION(id));

    return response.data.data;
  }

  async applyToTour(data: ApplyToTourRequest): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AI.APPLY_TO_TOUR, data);
  }

  async getBalance(): Promise<CreditBalance> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: CreditBalance;
    }>(API_ENDPOINTS.CREDITS.BALANCE);

    return response.data.data;
  }

  async getCreditHistory(params: CreditHistoryParams = {}): Promise<CreditHistoryResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: CreditHistoryResponse;
    }>(API_ENDPOINTS.CREDITS.HISTORY, { params });

    return response.data.data;
  }
}

export const aiService = new AiService();
