import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';
import { ObjectionType, ObjectionTemplate } from '@/types';
import { aiLogger } from '@/utils/logger';
import { supabase } from '@/lib/supabase';

// Import templates from original copilotService
const OBJECTION_TEMPLATES: ObjectionTemplate[] = [
  {
    type: 'price',
    keywords: ['đắt', 'giá cao', 'expensive', 'costly', 'too much', 'quá đắt'],
    responses: [
      'Tôi hiểu lo ngại của bạn về giá cả. Tuy nhiên, hãy xem đây là khoản đầu tư cho sức khỏe dài hạn...',
      'Giá trị sản phẩm vượt xa mức giá. Với chất lượng này, bạn đang tiết kiệm chi phí y tế dài hạn.',
    ],
  },
  {
    type: 'skepticism',
    keywords: ['không tin', 'nghi ngờ', 'doubt', 'skeptical', 'scam', 'lừa đảo'],
    responses: [
      'Tôi hoàn toàn hiểu sự thận trọng của bạn. Có thể bạn muốn xem chứng nhận chất lượng hoặc phản hồi từ khách hàng khác?',
      'Đây là câu hỏi rất hay! Chúng tôi có đầy đủ giấy tờ chứng nhận và hàng ngàn khách hàng hài lòng.',
    ],
  },
  {
    type: 'competition',
    keywords: ['compare', 'competitor', 'other', 'better', 'alternative', 'so sánh', 'khác', 'tốt hơn'],
    responses: [
      "Điểm khác biệt của chúng tôi là công thức độc quyền và nguồn gốc tự nhiên 100%.",
      "Chúng tôi tập trung vào chất lượng và kết quả lâu dài, không chỉ giá rẻ nhất.",
      "Bạn đang xem xét sản phẩm nào? Tôi có thể giúp so sánh chi tiết!"
    ]
  },
  {
    type: 'timing',
    keywords: ['later', 'wait', 'think', 'time', 'busy', 'sau', 'đợi', 'suy nghĩ', 'bận'],
    responses: [
      "Tôi hiểu! Nhưng chương trình ưu đãi này sẽ kết thúc vào cuối tuần. Để tôi giữ slot cho bạn nhé?",
      "Không vấn đề gì! Tôi gửi bạn thông tin để tham khảo. Bạn có câu hỏi nào cần giải đáp không?",
      "Càng sớm bắt đầu, càng sớm thấy kết quả! Nhưng tôi respect quyết định của bạn."
    ]
  },
  {
    type: 'need',
    keywords: ["don't need", 'not necessary', 'không cần', 'không thiết', 'không phải'],
    responses: [
      "Tôi hiểu! Nhiều khách hàng cũng nghĩ vậy ban đầu. Nhưng sau khi dùng thử, họ nhận ra lợi ích vượt mong đợi.",
      "Đây không phải 'cần thiết' mà là 'đáng giá'. Bạn muốn nghe câu chuyện của những người giống bạn không?",
      "Có thể bạn đang làm tốt rồi! Nhưng sản phẩm này giúp bạn đạt mức TỐT HƠN nữa."
    ]
  },
  {
    type: 'general',
    keywords: [],
    responses: [
      "Tôi hoàn toàn hiểu quan điểm của bạn! Để tôi giải thích thêm về điều này.",
      "Đó là câu hỏi rất hay! Nhiều người cũng thắc mắc điều tương tự.",
      "Cảm ơn bạn đã chia sẻ! Hãy để tôi giúp bạn hiểu rõ hơn."
    ]
  }
];

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
        'Generate personalized sales scripts',
        'Provide coaching on sales conversations'
      ],
      inputs: [
        { source: 'customer_message', dataType: 'user_input' },
        { source: 'conversation_context', dataType: 'CRM' },
        { source: 'product_info', dataType: 'API' }
      ],
      tools_and_systems: ['Objection Template Database', 'CRM', 'Google Gemini API (via Edge Function)'],
      core_actions: [
        'detectObjection',
        'suggestResponse',
        'generateResponse',
        'generateSalesScript',
        'analyzeConversation'
      ],
      outputs: [
        'objection_type',
        'suggested_response',
        'sales_script',
        'coaching_analysis'
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
      visibility: 'all'
    };

    super(definition);
  }

  /**
   * Helper to call Gemini Edge Function
   */
  private async callGemini(prompt: string, history: Array<{ role: string; content: string }> = [], modelName: string = 'gemini-pro'): Promise<string> {
    try {
        const { data, error } = await supabase.functions.invoke('gemini-chat', {
            body: { prompt, history, modelName }
        });

        if (error) {
            aiLogger.warn('Gemini Edge Function returned error', error);
            throw new Error(`Gemini Edge Function Error: ${error.message}`);
        }

        if (!data || !data.text) {
             if (data && data.error) throw new Error(data.error);
             aiLogger.warn('Gemini Edge Function returned empty response');
             throw new Error('Gemini Edge Function returned empty response');
        }

        return data.text;
    } catch (err) {
        aiLogger.error('Call Gemini Failed', err);
        throw err;
    }
  }

  /**
   * Execute copilot actions.
   */
  async execute(input: {
    action: string;
    message?: string;
    history?: Array<{ role: string; content: string }>;
    productContext?: string;
    productName?: string;
    productDescription?: string;
    customerProfile?: string;
  }): Promise<SalesCopilotResult> {
    const { action, message, history, productContext, productName, productDescription, customerProfile } = input;

    const canProceed = await this.checkPolicies(action, input);
    if (!canProceed) {
      return { error: 'Action blocked by policy' };
    }

    try {
      let output: SalesCopilotResult;

      switch (action) {
        case 'detectObjection':
          if (!message) throw new Error('Message required for objection detection');
          output = this.detectObjection(message);
          break;

        case 'suggestResponse': {
          // Template-based suggestion
          if (!message) throw new Error('Message required for response suggestion');
          const type = this.detectObjection(message);
          output = this.getObjectionResponse(type);
          break;
        }

        case 'generateResponse':
          // AI-based response generation
          if (!message) throw new Error('Message required for response generation');
          output = await this.generateCopilotResponse(message, history || [], productContext);
          break;

        case 'generateSalesScript':
          if (!productName || !productDescription) throw new Error('Product name and description required');
          output = await this.generateSalesScript(productName, productDescription, customerProfile);
          break;

        case 'analyzeConversation':
          if (!history || history.length === 0) throw new Error('Conversation history required');
          output = await this.getCopilotCoaching(history);
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
      if (template.keywords.length === 0) continue;
      if (template.keywords.some((keyword) => lowerMessage.includes(keyword.toLowerCase()))) {
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

  /**
   * Generate AI-powered response using Gemini
   */
  private async generateCopilotResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    productContext?: string
  ): Promise<{ response: string; objectionType?: ObjectionType; suggestion?: string }> {
    const objectionType = this.detectObjection(userMessage);
    const suggestion = this.getObjectionResponse(objectionType);

    try {
        const contextPrompt = productContext ? `Product Context: ${productContext}\n\n` : '';
        const historyText = conversationHistory
          .map(msg => `${msg.role === 'user' ? 'Customer' : 'Sales Rep'}: ${msg.content}`)
          .join('\n');

        const prompt = `
    You are "The Copilot" - an AI sales assistant for WellNexus, a Vietnamese social commerce platform.

    ${contextPrompt}

    Conversation History:
    ${historyText}

    Latest Customer Message: "${userMessage}"

    Detected Objection Type: ${objectionType}

    Your task:
    1. Address the customer's concern professionally and empathetically
    2. Use Vietnamese language naturally (mix with English if appropriate for product names)
    3. Keep response concise (2-3 sentences max)
    4. Focus on building trust and providing value
    5. If it's a sales objection, gently overcome it without being pushy
    6. End with a question to keep the conversation flowing

    Generate a natural, persuasive response:
        `.trim();

        // Note: For gemini-chat function, we pass the prompt directly. The history parameter in callGemini
        // is for chat mode, but here we are constructing the history in the prompt for better control
        // or we could use the history parameter.
        // The implementation in gemini-chat handles history if provided.
        // Let's rely on the prompt construction here as it includes context and instructions.

        const text = await this.callGemini(prompt);

        return {
          response: text || suggestion,
          objectionType,
          suggestion
        };
    } catch (error) {
        aiLogger.warn('SalesCopilotAgent AI Error', error);
        return { response: suggestion, objectionType, suggestion };
    }
  }

  /**
   * Generate sales script for a product
   */
  private async generateSalesScript(
    productName: string,
    productDescription: string,
    customerProfile?: string
  ): Promise<string> {
    try {
        const prompt = `
    Create a professional sales script in Vietnamese for:

    Product: ${productName}
    Description: ${productDescription}
    ${customerProfile ? `Customer Profile: ${customerProfile}` : ''}

    Generate a 4-step sales script:
    1. Opening (grab attention)
    2. Problem identification
    3. Solution presentation
    4. Closing (call to action)

    Keep it conversational, natural, and persuasive. Use Vietnamese primarily.
        `.trim();

        const text = await this.callGemini(prompt);
        return text || "Script đang được cập nhật...";
    } catch (error) {
        aiLogger.warn('SalesCopilotAgent Script Error', error);
        return "Lỗi tạo kịch bản. Vui lòng thử lại sau.";
    }
  }

  /**
   * Analyze conversation and provide coaching tips
   */
  private async getCopilotCoaching(
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
        const historyText = conversationHistory
          .map(msg => `${msg.role === 'user' ? 'Customer' : 'You'}: ${msg.content}`)
          .join('\n');

        const prompt = `
    Analyze this sales conversation and provide coaching tips:

    ${historyText}

    As a sales coach, provide:
    1. What went well (1 point)
    2. What could be improved (1 point)
    3. Next step suggestion (1 point)

    Keep it brief, actionable, and encouraging. Use Vietnamese.
        `.trim();

        const text = await this.callGemini(prompt);
        return text || "Phân tích đang được cập nhật...";
    } catch (error) {
        aiLogger.warn('SalesCopilotAgent Coaching Error', error);
        return "Lỗi phân tích hội thoại.";
    }
  }
}
