// @deprecated — Use ai-provider.ts instead. This file is kept for reference.
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

let geminiClient: GoogleGenAI | null = null;

/**
 * Get the Gemini AI client (lazy singleton).
 * Throws if GEMINI_API_KEY is not configured.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    logger.info("Gemini AI client initialized");
  }

  return geminiClient;
}

/**
 * Check if Gemini AI is configured (API key present).
 */
export function isGeminiConfigured(): boolean {
  return !!env.GEMINI_API_KEY;
}
