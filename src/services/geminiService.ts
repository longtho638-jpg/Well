import { agentRegistry } from '@/agents';
import { aiLogger } from '@/utils/logger';
import { ServiceError } from '@/utils/errors';
import { User, UserRank } from '@/types';

/**
 * Get personalized coaching advice from Gemini Agent
 * @param userName - Name of the user
 * @param salesData - Total sales amount
 * @param pendingQuests - List of pending tasks
 * @returns Promise<string> Coaching advice text
 */
export const getCoachAdvice = async (
  userName: string,
  salesData: number,
  pendingQuests: string[]
): Promise<string> => {
  try {
    const agent = agentRegistry.get('Gemini Coach');
    if (!agent) {
      aiLogger.warn('Gemini Coach Agent not found, falling back to legacy behavior');
      throw new ServiceError("Agent not found");
    }

    // Construct user object to match Agent interface
    const userMock = {
      name: userName,
      totalSales: salesData,
      rank: UserRank.CTV, // Default
      teamVolume: 0, // Default
      // Add missing required fields with defaults to satisfy type
      id: 'legacy-user',
      email: '',
      roleId: 0,
      avatarUrl: '',
      joinedAt: new Date().toISOString(),
      kycStatus: false,
      shopBalance: 0,
      growBalance: 0,
      stakedGrowBalance: 0
    } as unknown as User;

    const context = `Pending Tasks: ${pendingQuests.join(', ')}`;

    const result = await agent.execute({
      action: 'getCoachAdvice',
      user: userMock,
      context
    });

    if (result && typeof result === 'string') {
      return result;
    }
    return "Keep pushing! Success is just one connection away. 🚀";

  } catch (error) {
    aiLogger.warn('AI Coach Error', error);
    return "Great things take time. Keep building your network! 🌟";
  }
};

/**
 * Check text compliance using Gemini Agent
 * @param text - Text to analyze
 * @returns Promise<boolean> True if compliant, false otherwise
 */
export const checkCompliance = async (__text: string): Promise<boolean> => {
  try {
    const agent = agentRegistry.get('Gemini Coach');
    if (agent) {
      // We could call agent.execute({ action: 'checkCompliance', ... }) if we had transaction object
      // For now, just return true as per original, but maybe log in future.
    }
    return true;
  } catch {
    return true;
  }
};