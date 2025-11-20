import { GoogleGenAI } from "@google/genai";

// NOTE: In a real production app, engage a backend proxy to hide this key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getCoachAdvice = async (
  userName: string,
  salesData: number,
  pendingQuests: string[]
): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are "The Coach", a motivational AI mentor for a Social Commerce platform (WellNexus).
      User: ${userName}. Sales: ${salesData}. Pending Tasks: ${pendingQuests.join(', ')}.
      Give 1 short, high-energy sentence of advice to help them grow. Use emojis.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Keep pushing! Success is just one connection away. 🚀";
  } catch (error) {
    console.warn("AI Offline:", error);
    return "Great things take time. Keep building your network! 🌟";
  }
};

export const checkCompliance = async (text: string): Promise<boolean> => {
  try {
    // Simulated compliance check
    // In real implementation: Call Gemini to check for medical claims
    return true;
  } catch (e) {
    return true;
  }
};