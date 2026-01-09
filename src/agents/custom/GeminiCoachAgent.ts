import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';
import { User } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Business Coach Agent powered by Google Gemini.
 * Provides personalized coaching and tax compliance checking.
 */
export class GeminiCoachAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const definition: AgentDefinition = {
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
        'Google Gemini API (gemini-2.0-flash)',
        'User Store',
        'Transaction Database',
      ],
      core_actions: [
        'generateCoachingAdvice',
        'checkTaxCompliance',
        'analyzePerformance',
        'suggestNextSteps',
      ],
      outputs: [
        'coaching_message',
        'compliance_report',
        'performance_analysis',
      ],
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
        {
          rule: 'Advice must be in Vietnamese for Vietnam market',
          enforcement: 'soft',
        },
      ],
      visibility: 'all'
    };

    super(definition);

    // Initialize Gemini API
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Only warn in development - production uses fallback by design
    if (!apiKey && import.meta.env.DEV) {
      console.debug('[GeminiCoachAgent] No API key - using fallback responses');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Main execution method - routes to specific actions.
   */
  async execute(input: { action: string; user?: User; context?: string; transaction?: any }): Promise<any> {
    const { action, user, context, transaction } = input;

    // Policy check
    const canProceed = await this.checkPolicies(action, input);
    if (!canProceed) {
      return { error: 'Action blocked by policy', action };
    }

    try {
      let output;

      switch (action) {
        case 'getCoachAdvice':
          if (!user) throw new Error('User required for coaching advice');
          output = await this.getCoachAdvice(user, context);

          // Update KPIs
          const kpi = this.definition.success_kpis.find(k => k.name === 'User Satisfaction');
          if (kpi) {
            kpi.current = (kpi.current || 0) + 1;
          }
          break;

        case 'checkCompliance':
          if (!transaction) throw new Error('Transaction required for compliance check');
          output = await this.checkCompliance(transaction);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Log successful execution
      this.log(action, input, output, false);

      return output;
    } catch (error) {
      const errorOutput = {
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: this.getFallbackResponse(action),
      };

      this.log(action, input, errorOutput, false);

      return errorOutput;
    }
  }

  /**
   * Generate personalized coaching advice for a user.
   */
  private async getCoachAdvice(user: User, context?: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Fallback if no API key
    if (!apiKey) {
      return this.getFallbackCoachingAdvice(user);
    }

    try {
      const prompt = this.buildCoachingPrompt(user, context);
      const result = await this.model.generateContent(prompt);
      const advice = result.response.text();

      return advice;
    } catch (error) {
      console.error('[GeminiCoachAgent] API Error:', error);
      return this.getFallbackCoachingAdvice(user);
    }
  }

  /**
   * Check tax compliance for a transaction.
   */
  private async checkCompliance(transaction: any): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return 'Compliance check unavailable without API key.';
    }

    try {
      const prompt = `You are a tax compliance expert for Vietnam.
Transaction: ${transaction.amount} VND, Type: ${transaction.type}
Reference: Vietnam Circular 111/2013/TT-BTC (10% PIT on income > 2M VND/month)

Check if this transaction complies with Vietnam tax law. Be concise (2-3 sentences).`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('[GeminiCoachAgent] Compliance Check Error:', error);
      return 'Unable to verify compliance at this time.';
    }
  }

  /**
   * Build the coaching prompt for Gemini API.
   */
  private buildCoachingPrompt(user: User, context?: string): string {
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

  /**
   * Fallback coaching advice when API is unavailable.
   */
  private getFallbackCoachingAdvice(user: User): string {
    const advice = [
      `Chào ${user.name}! Bạn đang làm rất tốt với doanh số ${user.totalSales.toLocaleString('vi-VN')} VND.`,
      '',
      '💡 **3 gợi ý để cải thiện:**',
      '1. **Tăng tần suất tiếp cận khách hàng**: Hãy thử liên hệ ít nhất 5 khách hàng tiềm năng mỗi ngày.',
      '2. **Chia sẻ câu chuyện thành công**: Khách hàng tin tưởng vào những trải nghiệm thực tế. Hãy chia sẻ case study của bạn.',
      `3. **Đào tạo đội nhóm**: Team volume hiện tại của bạn là ${user.teamVolume.toLocaleString('vi-VN')} VND. Hỗ trợ downline sẽ giúp bạn tăng trưởng nhanh hơn.`,
      '',
      'Tiếp tục phát huy! 🚀',
    ].join('\n');

    return advice;
  }

  /**
   * Generic fallback response for any action.
   */
  private getFallbackResponse(action: string): string {
    return `[Gemini Coach Agent] Unable to complete action: ${action}. Please try again later.`;
  }
}
