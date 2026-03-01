/**
 * Zod schema for structured GeminiCoach agent responses.
 * Validates advice, action items with priority, confidence score, related topics.
 */

import { z } from 'zod';

export const CoachResponseSchema = z.object({
  advice: z.string().describe('Lời khuyên sức khỏe chính'),
  actionItems: z
    .array(
      z.object({
        task: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
      })
    )
    .default([]),
  confidence: z.number().min(0).max(1).default(0.8),
  relatedTopics: z.array(z.string()).optional(),
});

export type CoachResponse = z.infer<typeof CoachResponseSchema>;
