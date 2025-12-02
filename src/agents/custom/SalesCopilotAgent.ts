import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';
import { ObjectionType } from '@/types';

// Import templates from original copilotService
const OBJECTION_TEMPLATES = [
  {
    type: 'price' as ObjectionType,
    keywords: ['đắt', 'giá cao', 'expensive', 'costly', 'too much', 'quá đắt'],
    responses: [
      'Tôi hiểu lo ngại của bạn về giá cả. Tuy nhiên, hãy xem đây là khoản đầu tư cho sức khỏe dài hạn...',
      'Giá trị sản phẩm vượt xa mức giá. Với chất lượng này, bạn đang tiết kiệm chi phí y tế dài hạn.',
    ],
  },
  {
    type: 'skepticism' as ObjectionType,
    keywords: ['không tin', 'nghi ngờ', 'doubt', 'skeptical', 'scam', 'lừa đảo'],
    responses: [
      'Tôi hoàn toàn hiểu sự thận trọng của bạn. Có thể bạn muốn xem chứng nhận chất lượng hoặc phản hồi từ khách hàng khác?',
      'Đây là câu hỏi rất hay! Chúng tôi có đầy đủ giấy tờ chứng nhận và hàng ngàn khách hàng hài lòng.',
    ],
  },
  // Add more templates as needed
];

/**
 * Sales Copilot Agent - AI assistant for objection handling.
 */
export class SalesCopilotAgent extends BaseAgent {
  constructor() {
    const definition: AgentDefinition = {
      agent_name: 'Sales Copilot',
      business_function: 'Sales & Revenue',
      primary_objectives: [
        'Detect customer objections in real-time conversations',
        'Suggest appropriate responses to overcome objections',
        'Track objection patterns to improve sales training',
      ],
      inputs: [
        { source: 'customer_message', dataType: 'user_input' },
        { source: 'conversation_context', dataType: 'CRM' },
      ],
      tools_and_systems: ['Objection Template Database', 'CRM'],
      core_actions: [
        'detectObjection',
        'suggestResponse',
        'trackObjectionPatterns',
      ],
      outputs: [
        'objection_type',
        'suggested_response',
        'alternative_responses',
      ],
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
        {
          rule: 'Never make false claims about product efficacy',
          enforcement: 'hard',
        },
        {
          rule: 'Responses must respect customer concerns, not dismiss them',
          enforcement: 'hard',
        },
        {
          rule: 'No aggressive or pushy sales tactics',
          enforcement: 'hard',
        },
      ],
    };

    super(definition);
  }

  /**
   * Execute copilot actions.
   */
  async execute(input: { action: string; message?: string }): Promise<any> {
    const { action, message } = input;

    const canProceed = await this.checkPolicies(action, input);
    if (!canProceed) {
      return { error: 'Action blocked by policy' };
    }

    try {
      let output;

      switch (action) {
        case 'detectObjection':
          if (!message) throw new Error('Message required for objection detection');
          output = this.detectObjection(message);
          
          // Update KPI
          const detectKpi = this.definition.success_kpis.find(k => k.name === 'Objection Detection Accuracy');
          if (detectKpi) {
             detectKpi.current = (detectKpi.current || 0) + 1;
          }
          break;

        case 'suggestResponse':
          if (!message) throw new Error('Message required for response suggestion');
          const objectionType = this.detectObjection(message);
          output = this.getObjectionResponse(objectionType);
          
          // Update KPI
          const responseKpi = this.definition.success_kpis.find(k => k.name === 'Response Acceptance Rate');
          if (responseKpi) {
             responseKpi.current = (responseKpi.current || 0) + 1;
          }
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.log(action, input, output);
      return output;
    } catch (error) {
      const errorOutput = { error: error instanceof Error ? error.message : 'Unknown error' };
      this.log(action, input, errorOutput);
      return errorOutput;
    }
  }

  /**
   * Detect objection type from customer message.
   */
  private detectObjection(message: string): ObjectionType {
    const lowerMessage = message.toLowerCase();

    for (const template of OBJECTION_TEMPLATES) {
      if (template.keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return template.type;
      }
    }

    return 'general';
  }

  /**
   * Get suggested response for an objection type.
   */
  private getObjectionResponse(objectionType: ObjectionType): string {
    const template = OBJECTION_TEMPLATES.find((t) => t.type === objectionType);

    if (!template || template.responses.length === 0) {
      return 'Tôi hiểu quan ngại của bạn. Hãy để tôi giải thích thêm về sản phẩm này...';
    }

    // Return random response from templates
    const randomIndex = Math.floor(Math.random() * template.responses.length);
    return template.responses[randomIndex];
  }
}
