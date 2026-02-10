import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface AiProviderConfig {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens: number;
  temperature: number;
}

export interface AiProvider {
  /** Generate content in a single request, return the full text. */
  generateContent(config: AiProviderConfig): Promise<string>;

  /** Generate content as an async generator of text chunks. */
  generateContentStream(
    config: AiProviderConfig,
  ): AsyncGenerator<string, void, unknown>;
}

// ---------------------------------------------------------------------------
// Gemini adapter
// ---------------------------------------------------------------------------

function createGeminiProvider(): AiProvider {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  logger.info("Gemini AI provider initialized");

  return {
    async generateContent(config: AiProviderConfig): Promise<string> {
      const response = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: config.userPrompt,
        config: {
          systemInstruction: config.systemPrompt,
          maxOutputTokens: config.maxOutputTokens,
          temperature: config.temperature,
        },
      });
      return response.text ?? "";
    },

    async *generateContentStream(
      config: AiProviderConfig,
    ): AsyncGenerator<string, void, unknown> {
      const stream = await client.models.generateContentStream({
        model: env.GEMINI_MODEL,
        contents: config.userPrompt,
        config: {
          systemInstruction: config.systemPrompt,
          maxOutputTokens: config.maxOutputTokens,
          temperature: config.temperature,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text ?? "";
        if (text) {
          yield text;
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Groq adapter (OpenAI-compatible)
// ---------------------------------------------------------------------------

function createGroqProvider(): AiProvider {
  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const client = new Groq({ apiKey: env.GROQ_API_KEY });
  logger.info("Groq AI provider initialized");

  return {
    async generateContent(config: AiProviderConfig): Promise<string> {
      const completion = await client.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: config.userPrompt },
        ],
        max_tokens: config.maxOutputTokens,
        temperature: config.temperature,
        stream: false,
      });
      return completion.choices[0]?.message?.content ?? "";
    },

    async *generateContentStream(
      config: AiProviderConfig,
    ): AsyncGenerator<string, void, unknown> {
      const stream = await client.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: config.userPrompt },
        ],
        max_tokens: config.maxOutputTokens,
        temperature: config.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          yield text;
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// OpenRouter adapter (OpenAI-compatible)
// ---------------------------------------------------------------------------

function createOpenRouterProvider(): AiProvider {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
  logger.info("OpenRouter AI provider initialized");

  return {
    async generateContent(config: AiProviderConfig): Promise<string> {
      const completion = await client.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: config.userPrompt },
        ],
        max_tokens: config.maxOutputTokens,
        temperature: config.temperature,
        stream: false,
      });
      return completion.choices[0]?.message?.content ?? "";
    },

    async *generateContentStream(
      config: AiProviderConfig,
    ): AsyncGenerator<string, void, unknown> {
      const stream = await client.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: config.userPrompt },
        ],
        max_tokens: config.maxOutputTokens,
        temperature: config.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          yield text;
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Factory + helpers
// ---------------------------------------------------------------------------

let cachedProvider: AiProvider | null = null;
let cachedProviderType: string | null = null;

/**
 * Get the active AI provider (lazy singleton).
 * Reads `AI_PROVIDER` from env to determine which adapter to use.
 */
export function getAiProvider(): AiProvider {
  const providerType = env.AI_PROVIDER;

  if (cachedProvider && cachedProviderType === providerType) {
    return cachedProvider;
  }

  if (providerType === "groq") {
    cachedProvider = createGroqProvider();
  } else if (providerType === "openrouter") {
    cachedProvider = createOpenRouterProvider();
  } else {
    cachedProvider = createGeminiProvider();
  }

  cachedProviderType = providerType;
  return cachedProvider;
}

/**
 * Check if the active AI provider is configured (API key present).
 */
export function isAiConfigured(): boolean {
  if (env.AI_PROVIDER === "groq") {
    return !!env.GROQ_API_KEY;
  }
  if (env.AI_PROVIDER === "openrouter") {
    return !!env.OPENROUTER_API_KEY;
  }
  return !!env.GEMINI_API_KEY;
}

/**
 * Get the name of the active AI provider.
 * Useful for logging and future per-feature provider routing.
 */
export function getAiProviderName(): string {
  return env.AI_PROVIDER;
}
