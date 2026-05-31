import { env } from "./env";
import { logger } from "./logger";
import * as Sentry from "@sentry/nextjs";
import { generateText as aiGenerateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

export interface AIOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export class AIService {
  private static defaultModel = "gemini-1.5-flash";

  /**
   * Generates text content using the Gemini API.
   */
  static async generateText({
    prompt,
    systemInstruction,
    temperature = 0.7,
    maxTokens = 2048,
    jsonMode = false,
  }: AIOptions): Promise<string> {
    return Sentry.startSpan(
      {
        name: "AIService.generateContent",
        op: "ai.generate",
        attributes: {
          model: this.defaultModel,
          temperature,
          maxTokens,
          jsonMode,
        },
      },
      async () => {
        try {
          // Additional configs like json mode can be provided in system prompts or via specific schemas if needed
          // but for basic usage we let the sdk handle it.
          const { text } = await aiGenerateText({
            model: google(this.defaultModel),
            prompt,
            system: systemInstruction,
            temperature,
            maxOutputTokens: maxTokens,
          });

          return text;
        } catch (error) {
          logger.error({ error }, "Failed to generate text via AIService");
          throw error;
        }
      }
    );
  }

  /**
   * Helper to return structured JSON schema directly.
   */
  static async generateJSON<T>(options: AIOptions): Promise<T> {
    const text = await this.generateText({ ...options, jsonMode: true });
    return JSON.parse(text) as T;
  }
}
