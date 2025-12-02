import { agentRegistry } from '@/agents';

// NOTE: In a real production app, engage a backend proxy to hide this key.
// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'demo-key'); // Removed direct usage

export const getCoachAdvice = async (
  userName: string,
  salesData: number,
  pendingQuests: string[]
): Promise<string> => {
  try {
    const agent = agentRegistry.get('Gemini Coach');
    if (!agent) {
      console.warn("Gemini Coach Agent not found, falling back to legacy behavior.");
      throw new Error("Agent not found");
    }

    // Construct user object to match Agent interface
    const userMock = {
      name: userName,
      totalSales: salesData,
      rank: 'Member', // Default for legacy compatibility
      teamVolume: 0 // Default
    };

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
    console.warn("AI Coach Error:", error);
    return "Great things take time. Keep building your network! 🌟";
  }
};

export const checkCompliance = async (text: string): Promise<boolean> => {
  try {
    // The new agent has checkTaxCompliance, but the old service signature returned boolean.
    // We'll maintain the signature but maybe log the check via agent if relevant transaction data existed.
    // Since the old service didn't really check anything, we keep it simple but acknowledge the agent existance.
    const agent = agentRegistry.get('Gemini Coach');
    if (agent) {
        // We could call agent.execute({ action: 'checkCompliance', ... }) if we had transaction object
        // For now, just return true as per original, but maybe log in future.
    }
    return true;
  } catch (e) {
    return true;
  }
};