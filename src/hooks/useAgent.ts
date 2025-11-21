import { useState } from 'react';
import { getCoachAdvice, checkCompliance } from '../services/geminiService';
import { User } from '../types';

interface AgentState {
  advice: string | null;
  loading: boolean;
  error: string | null;
}

interface AgentActions {
  getAdvice: (user: User, pendingQuests: string[]) => Promise<void>;
  checkContentCompliance: (content: string) => Promise<boolean>;
  clearAdvice: () => void;
}

/**
 * Custom hook for AI agent interactions
 * Provides coaching advice and compliance checking
 */
export function useAgent(): AgentState & AgentActions {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get coaching advice from AI agent
   */
  const getAdvice = async (user: User, pendingQuests: string[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const coachAdvice = await getCoachAdvice(
        user.name,
        user.totalSales,
        pendingQuests
      );

      setAdvice(coachAdvice);
    } catch (err: any) {
      console.error('Error getting coach advice:', err);
      setError(err.message || 'Failed to get advice');
      setAdvice('Keep pushing forward! You\'re on the right track. 🚀');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check content for compliance with Vietnam regulations
   * Detects prohibited claims (medical, income guarantees, etc.)
   */
  const checkContentCompliance = async (content: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Prohibited keywords (Vietnam Decree 40/2018)
      const prohibitedKeywords = [
        'cure cancer',
        'guaranteed income',
        'get rich quick',
        'miracle cure',
        'medical claims',
        'chữa ung thư',
        'đảm bảo thu nhập',
        'giàu nhanh chóng',
      ];

      // Simple keyword check
      const hasProhibitedContent = prohibitedKeywords.some((keyword) =>
        content.toLowerCase().includes(keyword)
      );

      if (hasProhibitedContent) {
        return false;
      }

      // Call AI for deeper analysis
      const isCompliant = await checkCompliance(content);
      return isCompliant;
    } catch (err: any) {
      console.error('Error checking compliance:', err);
      setError(err.message || 'Failed to check compliance');
      // Default to compliant on error
      return true;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear advice
   */
  const clearAdvice = (): void => {
    setAdvice(null);
    setError(null);
  };

  return {
    advice,
    loading,
    error,
    getAdvice,
    checkContentCompliance,
    clearAdvice,
  };
}

/**
 * Agent roles and prompts
 * These define the behavior of different AI agents in the system
 */
export const AGENT_ROLES = {
  coach: {
    id: 'agent_coach',
    role: 'Onboarding Specialist',
    systemPrompt: `You are "The Coach", a supportive AI mentor for WellNexus, a Social Commerce platform in Vietnam.
Your goal is to help distributors succeed by providing actionable advice, motivation, and guidance.
Use a friendly, encouraging tone with appropriate emojis.
Focus on helping users:
- Complete their onboarding quests
- Make their first sales
- Build their network
- Understand the compensation plan
Keep responses concise (1-3 sentences) and action-oriented.`,
  },

  guardian: {
    id: 'agent_guardian',
    role: 'Compliance Officer',
    systemPrompt: `You are "The Guardian", a compliance AI for WellNexus in Vietnam.
Your role is to ensure all user content follows Vietnam regulations (Decree 40/2018, Law on Advertisement).
Strictly prohibit:
- False health/medical claims
- Income guarantees or "get rich quick" promises
- Pyramid scheme language
- Exaggerated product benefits
Respond with "COMPLIANT" or "NON_COMPLIANT: [reason]".`,
  },
};
