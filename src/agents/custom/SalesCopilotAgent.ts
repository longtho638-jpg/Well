import { BaseAgent } from '../core/BaseAgent';
import { ObjectionType } from '@/types';
import { aiLogger } from '@/utils/logger';
import { supabase } from '@/lib/supabase';
import { SALES_PROMPTS } from '@/config/sales-prompts';
import {
  SalesCopilotResponse,
  SalesCopilotResult,
  SALES_COPILOT_DEFINITION,
  detectObjection,
  getObjectionResponse,
} from './sales-copilot-agent-types-and-definition';

export type { SalesCopilotResponse, SalesCopilotResult };

/**
 * Sales Copilot Agent - AI assistant for objection handling.
 */
export class SalesCopilotAgent extends BaseAgent {

  constructor() {
    super(SALES_COPILOT_DEFINITION);
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
          output = detectObjection(message);
          break;

        case 'suggestResponse': {
          // Template-based suggestion
          if (!message) throw new Error('Message required for response suggestion');
          const type = detectObjection(message);
          output = getObjectionResponse(type);
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
   * Generate AI-powered response using Gemini
   */
  private async generateCopilotResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    productContext?: string
  ): Promise<{ response: string; objectionType?: ObjectionType; suggestion?: string }> {
    const objectionType = detectObjection(userMessage);
    const suggestion = getObjectionResponse(objectionType);

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
