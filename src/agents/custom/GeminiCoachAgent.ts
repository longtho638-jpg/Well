import { BaseAgent } from '../core/BaseAgent';
import { User } from '@/types';
import { agentLogger } from '@/utils/logger';
import { supabase } from '@/lib/supabase';
import {
  CoachResult,
  ComplianceTransaction,
  GEMINI_COACH_DEFINITION,
  buildCoachingPrompt,
  buildCompliancePrompt,
  getFallbackCoachingAdvice,
  getFallbackResponse,
} from './gemini-coach-agent-definition-and-prompts';

export type { CoachResult };

/**
 * AI Business Coach Agent powered by Google Gemini.
 * Provides personalized coaching and tax compliance checking.
 */
export class GeminiCoachAgent extends BaseAgent {

  constructor() {
    super(GEMINI_COACH_DEFINITION);
  }

  /**
   * Main execution method - routes to specific actions.
   */
  async execute(input: { action: string; user?: User; context?: string; transaction?: ComplianceTransaction }): Promise<CoachResult> {
    const { action, user, context, transaction } = input;

    // Policy check
    const canProceed = await this.checkPolicies(action, input);
    if (!canProceed) {
      return { error: 'Action blocked by policy', fallback: getFallbackResponse(action), action };
    }

    try {
      let output: string;

      switch (action) {
        case 'getCoachAdvice': {
          if (!user) throw new Error('User required for coaching advice');
          output = await this.getCoachAdvice(user, context);

          // Update KPIs
          const kpi = this.definition.success_kpis.find(k => k.name === 'User Satisfaction');
          if (kpi) {
            kpi.current = (kpi.current || 0) + 1;
          }
          break;
        }

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
        fallback: getFallbackResponse(action),
      };

      this.log(action, input, errorOutput, false);

      return errorOutput;
    }
  }

  /**
   * Helper to call Gemini Edge Function
   */
  private async callGemini(prompt: string, modelName: string = 'gemini-2.0-flash-exp'): Promise<string> {
    return this.executeWithRecovery(
      async () => {
        const { data, error } = await supabase.functions.invoke('gemini-chat', {
            body: { prompt, modelName }
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
   * Generate personalized coaching advice for a user.
   */
  private async getCoachAdvice(user: User, context?: string): Promise<string> {
    try {
      const prompt = buildCoachingPrompt(user, context);
      return await this.callGemini(prompt);
    } catch (error) {
      agentLogger.error('GeminiCoachAgent API Error', error);
      return getFallbackCoachingAdvice(user);
    }
  }

  /**
   * Check tax compliance for a transaction.
   */
  private async checkCompliance(transaction: ComplianceTransaction): Promise<string> {
    try {
      const prompt = buildCompliancePrompt(transaction);
      return await this.callGemini(prompt);
    } catch (error) {
      agentLogger.error('GeminiCoachAgent Compliance Check Error', error);
      return 'Unable to verify compliance at this time.';
    }
  }
}
