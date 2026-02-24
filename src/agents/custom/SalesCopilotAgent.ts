import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';
import { ObjectionType } from '@/types';
import { aiLogger } from '@/utils/logger';
import { supabase } from '@/lib/supabase';
import { OBJECTION_TEMPLATES } from '@/config/sales-templates';
import { SALES_PROMPTS } from '@/config/sales-prompts';

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
    return this.executeWithRecovery(
      async () => {
        const { data, error } = await supabase.functions.invoke('gemini-chat', {
            body: { prompt, history, modelName }
        });

        if (error) {
            throw new Error(`Gemini Edge Function Error: ${error.message}`);
        }

        if (!data || !data.text) {
             if (data && data.error) throw new Error(data.error);
             throw new Error('Gemini Edge Function returned empty response');
        }

        return data.text;
      },
      { actionName: 'callGemini', maxAttempts: 2 }
    );
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

        const prompt = SALES_PROMPTS.GENERATE_RESPONSE(contextPrompt, historyText, userMessage, objectionType);

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
        const prompt = SALES_PROMPTS.GENERATE_SCRIPT(productName, productDescription, customerProfile);

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

        const prompt = SALES_PROMPTS.COACHING_TIPS(historyText);

        const text = await this.callGemini(prompt);
        return text || "Phân tích đang được cập nhật...";
    } catch (error) {
        aiLogger.warn('SalesCopilotAgent Coaching Error', error);
        return "Lỗi phân tích hội thoại.";
    }
  }
}
