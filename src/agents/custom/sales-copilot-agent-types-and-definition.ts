/**
 * SalesCopilotAgent — AgentDefinition config, exported result types,
 * and stateless objection detection helpers.
 * Extracted to keep SalesCopilotAgent.ts under 200 LOC.
 */

import type { AgentDefinition } from '@/types/agentic';
import type { ObjectionType, ObjectionTemplate } from '@/types';
import { OBJECTION_TEMPLATES } from '@/config/sales-templates';

export interface SalesCopilotResponse {
  response: string;
  objectionType?: ObjectionType;
  suggestion?: string;
}

export type SalesCopilotResult =
  | string
  | ObjectionType
  | SalesCopilotResponse
  | { error: string };

export const SALES_COPILOT_DEFINITION: AgentDefinition = {
  agent_name: 'Sales Copilot',
  business_function: 'Sales & Revenue',
  primary_objectives: [
    'Detect customer objections in real-time conversations',
    'Suggest appropriate responses to overcome objections',
    'Generate personalized sales scripts',
    'Provide coaching on sales conversations',
  ],
  inputs: [
    { source: 'customer_message', dataType: 'user_input' },
    { source: 'conversation_context', dataType: 'CRM' },
    { source: 'product_info', dataType: 'API' },
  ],
  tools_and_systems: ['Objection Template Database', 'CRM', 'Google Gemini API (via Edge Function)'],
  core_actions: [
    'detectObjection',
    'suggestResponse',
    'generateResponse',
    'generateSalesScript',
    'analyzeConversation',
  ],
  outputs: ['objection_type', 'suggested_response', 'sales_script', 'coaching_analysis'],
  success_kpis: [
    { name: 'Objection Detection Accuracy', target: 85, current: 0, unit: '%' },
    { name: 'Response Acceptance Rate', target: 70, current: 0, unit: '%' },
    { name: 'Conversion Rate Improvement', target: 15, current: 0, unit: '%' },
  ],
  risk_and_failure_modes: [
    'Misclassifying objection type',
    'Suggesting inappropriate responses',
    'Missing cultural nuances in Vietnamese',
  ],
  human_in_the_loop_points: [
    'Sales agent must review and adapt suggested responses',
    'All responses must be approved before sending to customer',
  ],
  policy_and_constraints: [
    { rule: 'Never make false claims about product efficacy', enforcement: 'hard' },
    { rule: 'Responses must respect customer concerns, not dismiss them', enforcement: 'hard' },
    { rule: 'No aggressive or pushy sales tactics', enforcement: 'hard' },
  ],
  visibility: 'all',
};

/** Stateless: detect objection type from message keywords. */
export function detectObjection(message: string): ObjectionType {
  const lowerMessage = message.toLowerCase();
  for (const template of OBJECTION_TEMPLATES) {
    if (template.keywords.length === 0) continue;
    if (template.keywords.some((kw) => lowerMessage.includes(kw.toLowerCase()))) {
      return template.type;
    }
  }
  return 'general';
}

/** Stateless: pick a random suggested response for an objection type. */
export function getObjectionResponse(objectionType: ObjectionType): string {
  const template = OBJECTION_TEMPLATES.find((t: ObjectionTemplate) => t.type === objectionType);
  if (!template || template.responses.length === 0) {
    return 'Tôi hiểu quan ngại của bạn. Hãy để tôi giải thích thêm về sản phẩm này...';
  }
  return template.responses[Math.floor(Math.random() * template.responses.length)];
}
