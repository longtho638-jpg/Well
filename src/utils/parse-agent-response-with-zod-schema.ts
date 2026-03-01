/**
 * Utility to parse agent response text as structured JSON validated by a Zod schema.
 * Falls back gracefully to wrapping raw text when JSON extraction fails.
 */

import type { ZodSchema } from 'zod';

interface ParseAgentResponseResult<T> {
  data: T;
  isStructured: boolean;
}

/**
 * Parse agent response text as structured JSON with Zod validation.
 * Falls back to wrapping raw text if JSON parsing fails.
 */
export function parseAgentResponse<T>(
  text: string,
  schema: ZodSchema<T>
): ParseAgentResponseResult<T> {
  // Attempt 1: extract fenced JSON block or bare JSON object
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) ||
    text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const jsonStr = jsonMatch[1] ?? jsonMatch[0];
    try {
      const parsed: unknown = JSON.parse(jsonStr);
      const validated = schema.parse(parsed);
      return { data: validated, isStructured: true };
    } catch {
      // Fall through to soft fallback
    }
  }

  // Attempt 2: soft-parse wrapping raw text into schema-compatible shape
  const softResult = schema.safeParse({
    advice: text,
    suggestion: text,
    content: text,
    nextStep: text,
  });

  if (softResult.success) {
    return { data: softResult.data, isStructured: false };
  }

  // Last resort: cast raw text into T — caller must handle partial shape
  return { data: { advice: text } as T, isStructured: false };
}
