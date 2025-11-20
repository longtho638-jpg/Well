import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
// Ideally, API_KEY should be strictly in env variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getCoachAdvice = async (
  userName: string,
  salesData: number,
  pendingQuests: string[]
): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    
    const prompt = `
      You are "The Coach", a motivational and strategic AI mentor for a Social Commerce platform in Vietnam called WellNexus.
      User: ${userName}
      Current Sales: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(salesData)}
      Pending Quests: ${pendingQuests.join(', ')}

      Give a short, high-energy advice (max 2 sentences) to help them achieve their goals. 
      Focus on "Trust" and "Growth". Use emojis.
      If sales are low, encourage sharing. If high, encourage team building.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Keep pushing! Success is just one connection away. 🚀";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The Coach is currently offline, but believes in you! 🌟";
  }
};

export const checkCompliance = async (text: string): Promise<boolean> => {
  // "The Guardian" - Mock implementation via AI
  // Returns TRUE if the content is compliant, FALSE if it violates policies (e.g., false medical claims)
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Analyze the following text for a health product listing in Vietnam. 
      Does it contain words implying "cure", "treatment", or false medical promises which are illegal for supplements?
      Text: "${text}"
      Return ONLY "SAFE" or "FLAGGED".
    `;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    
    const result = response.text?.trim().toUpperCase();
    return result === "SAFE";
  } catch (e) {
    return true; // Fail open for MVP
  }
};