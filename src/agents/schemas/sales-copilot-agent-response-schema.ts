/**
 * Zod schema for structured SalesCopilot agent responses.
 * Validates sales suggestions, objection handling, next steps, product recommendations.
 */

import { z } from 'zod';

export const CopilotResponseSchema = z.object({
  suggestion: z.string().describe('Gợi ý bán hàng'),
  objectionHandler: z.string().optional(),
  nextStep: z.string(),
  productRecommendations: z.array(z.string()).optional(),
});

export type CopilotResponse = z.infer<typeof CopilotResponseSchema>;
