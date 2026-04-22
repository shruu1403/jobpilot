import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Ordered model fallback chain.
 * Fast-lite models first (high daily limits, low latency),
 * progressively heavier models as backup.
 */
const MODEL_PRIORITY = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
];

interface CallGeminiOptions {
  /** Route label for structured logging */
  label?: string;
  /** Max time in ms before aborting the request (default: 25000) */
  timeoutMs?: number;
}

/**
 * Centralized Gemini caller with:
 *  - Model fallback chain (429 / 404 → next model)
 *  - Per-request timeout via AbortController
 *  - Structured logging
 */
export async function callGemini(
  prompt: string,
  options: CallGeminiOptions = {}
): Promise<string> {
  const { label = "Gemini", timeoutMs = 25_000 } = options;
  let lastError: any;

  for (const modelName of MODEL_PRIORITY) {
    // Create a fresh abort controller per model attempt
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[${label}] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () =>
            reject(new Error(`[${label}] Timed out after ${timeoutMs}ms on ${modelName}`))
          );
        }),
      ]);

      clearTimeout(timer);
      const response = await result.response;
      console.log(`[${label}] ✓ Success with model: ${modelName}`);
      return response.text();
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;

      // Abort-based timeout → try next model
      if (err?.message?.includes("Timed out")) {
        console.warn(`[${label}] ${modelName} timed out. Trying next...`);
        continue;
      }

      const status = err?.status;

      // Rate limited (429), model not found (404), or high demand (503) → try next
      if (status === 429 || status === 404 || status === 503) {
        console.warn(`[${label}] ${modelName} failed (${status}). Trying next...`);
        continue;
      }

      // Other errors → fail immediately
      throw err;
    }
  }

  // All models exhausted
  const is429 = lastError?.status === 429 || lastError?.message?.includes("429");
  const is503 = lastError?.status === 503 || lastError?.message?.includes("503") || lastError?.message?.includes("high demand");

  if (is429) {
    throw new Error("AI rate limit reached. Please wait a minute and try again.");
  }
  if (is503) {
    throw new Error("AI service is currently under high demand. Please try again in a moment.");
  }

  throw lastError || new Error(`[${label}] All models failed.`);
}

/**
 * Safely extract JSON from a Gemini response string.
 * Handles responses wrapped in markdown code fences.
 */
export function extractJson<T = any>(text: string): T {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}") + 1;

  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    throw new Error("AI did not return valid JSON.");
  }

  return JSON.parse(cleaned.substring(jsonStart, jsonEnd));
}

/**
 * Safely extract a JSON array from a Gemini response string.
 */
export function extractJsonArray<T = any>(text: string): T[] {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const jsonStart = cleaned.indexOf("[");
  const jsonEnd = cleaned.lastIndexOf("]") + 1;

  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    throw new Error("AI did not return a valid JSON array.");
  }

  return JSON.parse(cleaned.substring(jsonStart, jsonEnd));
}
