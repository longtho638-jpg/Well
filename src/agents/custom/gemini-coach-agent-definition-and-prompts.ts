/**
 * GeminiCoachAgent — AgentDefinition config, prompt builders, and fallback responses.
 * Extracted to keep GeminiCoachAgent.ts under 200 LOC.
 */

import type { AgentDefinition } from '@/types/agentic';
import type { User } from '@/types';

export type CoachResult = string | { error: string; fallback: string; action?: string };

export interface ComplianceTransaction {
  amount: number;
  type: string;
}

export const GEMINI_COACH_DEFINITION: AgentDefinition = {
  agent_name: 'Gemini Coach',
  business_function: 'Customer Success & Support',
  primary_objectives: [
    'Provide personalized business coaching based on user performance',
    'Analyze sales data and suggest actionable improvements',
    'Detect potential tax compliance issues',
    'Guide users toward next rank progression',
  ],
  inputs: [
    { source: 'user_profile', dataType: 'CRM' },
    { source: 'transaction_history', dataType: 'API' },
    { source: 'user_context', dataType: 'user_input' },
  ],
  tools_and_systems: [
    'Google Gemini API (via Edge Function)',
    'User Store',
    'Transaction Database',
  ],
  core_actions: [
    'generateCoachingAdvice',
    'checkTaxCompliance',
    'analyzePerformance',
    'suggestNextSteps',
  ],
  outputs: ['coaching_message', 'compliance_report', 'performance_analysis'],
  success_kpis: [
    { name: 'User Satisfaction', target: 85, current: 0, unit: '%' },
    { name: 'Advice Relevance', target: 90, current: 0, unit: '%' },
    { name: 'Compliance Detection Rate', target: 95, current: 0, unit: '%' },
  ],
  risk_and_failure_modes: [
    'AI hallucination (providing incorrect financial advice)',
    'API rate limits exceeded',
    'Outdated tax law knowledge',
    'Biased recommendations',
  ],
  human_in_the_loop_points: [
    'Critical tax compliance warnings must be reviewed by compliance officer',
    'High-value financial advice (>50M VND impact) requires approval',
  ],
  policy_and_constraints: [
    {
      rule: 'No specific investment advice or financial product recommendations',
      enforcement: 'hard',
      notes: 'We are not licensed financial advisors',
    },
    {
      rule: 'Never promise specific tax outcomes or guarantee compliance',
      enforcement: 'hard',
      notes: 'Tax law is complex and subject to interpretation',
    },
    {
      rule: 'Always cite Vietnam Circular 111/2013/TT-BTC when discussing tax',
      enforcement: 'soft',
      notes: 'Helps users understand legal basis',
    },
    { rule: 'Advice must be in Vietnamese for Vietnam market', enforcement: 'soft' },
  ],
  visibility: 'all',
};

export function buildCoachingPrompt(user: User, context?: string): string {
  return `Bạn là coach kinh doanh chuyên nghiệp cho ${user.name} (${user.rank}) tại WellNexus.

Dữ liệu hiện tại:
- Doanh số cá nhân: ${user.totalSales.toLocaleString('vi-VN')} VND
- Team volume: ${user.teamVolume.toLocaleString('vi-VN')} VND
- Rank hiện tại: ${user.rank}

${context ? `Bối cảnh: ${context}` : 'Bối cảnh: Tư vấn chung'}

Hãy đưa ra 2-3 lời khuyên cụ thể, khả thi để cải thiện hiệu suất kinh doanh.
Tập trung vào:
1. Cách tăng doanh số
2. Phát triển đội nhóm
3. Tiến đến rank tiếp theo

Trả lời bằng tiếng Việt, giọng điệu thân thiện và động viên.`;
}

export function buildCompliancePrompt(transaction: ComplianceTransaction): string {
  return `You are a tax compliance expert for Vietnam.
Transaction: ${transaction.amount} VND, Type: ${transaction.type}
Reference: Vietnam Circular 111/2013/TT-BTC (10% PIT on income > 2M VND/month)

Check if this transaction complies with Vietnam tax law. Be concise (2-3 sentences).`;
}

export function getFallbackCoachingAdvice(user: User): string {
  return [
    `Chào ${user.name}! Bạn đang làm rất tốt với doanh số ${user.totalSales.toLocaleString('vi-VN')} VND.`,
    '',
    '💡 **3 gợi ý để cải thiện:**',
    '1. **Tăng tần suất tiếp cận khách hàng**: Hãy thử liên hệ ít nhất 5 khách hàng tiềm năng mỗi ngày.',
    '2. **Chia sẻ câu chuyện thành công**: Khách hàng tin tưởng vào những trải nghiệm thực tế. Hãy chia sẻ case study của bạn.',
    `3. **Đào tạo đội nhóm**: Team volume hiện tại của bạn là ${user.teamVolume.toLocaleString('vi-VN')} VND. Hỗ trợ downline sẽ giúp bạn tăng trưởng nhanh hơn.`,
    '',
    'Tiếp tục phát huy! 🚀',
  ].join('\n');
}

export function getFallbackResponse(action: string): string {
  return `[Gemini Coach Agent] Unable to complete action: ${action}. Please try again later.`;
}
