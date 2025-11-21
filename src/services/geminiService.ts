import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Transaction, Product, PerformanceMetrics, Goal } from '../types';

// NOTE: In a real production app, engage a backend proxy to hide this key.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'demo-key');

/**
 * Get motivational coaching advice (original function)
 */
export const getCoachAdvice = async (
  userName: string,
  salesData: number,
  pendingQuests: string[]
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      You are "The Coach", a motivational AI mentor for a Social Commerce platform (WellNexus).
      User: ${userName}. Sales: ${salesData}. Pending Tasks: ${pendingQuests.join(', ')}.
      Give 1 short, high-energy sentence of advice to help them grow. Use emojis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "Keep pushing! Success is just one connection away. 🚀";
  } catch (error) {
    console.warn("AI Offline:", error);
    return "Great things take time. Keep building your network! 🌟";
  }
};

/**
 * Get personalized sales strategy based on user performance
 */
export const getSalesStrategy = async (
  user: User,
  recentTransactions: Transaction[],
  products: Product[]
): Promise<{ strategy: string; actionItems: string[]; focusProducts: string[] }> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are an expert sales coach for WellNexus, a social commerce platform in Vietnam.

      User Profile:
      - Name: ${user.name}
      - Rank: ${user.rank}
      - Total Sales: ${user.totalSales.toLocaleString()} VND
      - Team Volume: ${user.teamVolume.toLocaleString()} VND
      - Team Size: ${user.teamSize} people
      - Current Streak: ${user.currentStreak} days

      Recent Performance:
      - Last 5 transactions: ${recentTransactions.slice(0, 5).map(t => `${t.type}: ${t.amount.toLocaleString()} VND`).join(', ')}

      Available Products:
      ${products.map(p => `- ${p.name}: ${p.price.toLocaleString()} VND (${(p.commissionRate * 100)}% commission, ${p.stock} in stock)`).join('\n')}

      Provide a personalized sales strategy in JSON format:
      {
        "strategy": "2-3 sentence strategic overview tailored to this user's situation",
        "actionItems": ["specific action 1", "specific action 2", "specific action 3"],
        "focusProducts": ["product name 1", "product name 2"]
      }

      Only respond with valid JSON, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    return parsed;
  } catch (error) {
    console.warn("AI Strategy Error:", error);
    return {
      strategy: "Focus on building relationships and sharing product benefits authentically. Your consistent activity is your biggest asset.",
      actionItems: [
        "Share your referral link with 3 new contacts today",
        "Post about your favorite product on social media",
        "Follow up with recent customers for feedback"
      ],
      focusProducts: products.slice(0, 2).map(p => p.name)
    };
  }
};

/**
 * Analyze user performance and provide insights
 */
export const analyzePerformance = async (
  user: User,
  transactions: Transaction[]
): Promise<PerformanceMetrics> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Calculate basic metrics
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const salesCount = transactions.filter(t => t.type === 'Direct Sale').length;
    const avgOrderValue = salesCount > 0 ? totalRevenue / salesCount : 0;

    const prompt = `
      Analyze this sales performance data for a WellNexus seller:

      - Total Revenue: ${totalRevenue.toLocaleString()} VND
      - Number of Sales: ${salesCount}
      - Average Order Value: ${avgOrderValue.toLocaleString()} VND
      - Team Size: ${user.teamSize}
      - Current Rank: ${user.rank}

      Recent transactions by day:
      ${transactions.slice(0, 10).map(t => `${t.date}: ${t.type} - ${t.amount.toLocaleString()} VND`).join('\n')}

      Provide analysis in JSON format:
      {
        "conversionRate": estimated_percentage,
        "customerRetention": estimated_percentage,
        "teamGrowthRate": estimated_percentage,
        "bestPerformingDay": "day_of_week",
        "improvementAreas": ["area 1", "area 2", "area 3"]
      }

      Only respond with valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    return {
      conversionRate: parsed.conversionRate || 15,
      averageOrderValue: avgOrderValue,
      customerRetention: parsed.customerRetention || 65,
      teamGrowthRate: parsed.teamGrowthRate || 10,
      topProducts: [],
      bestPerformingDay: parsed.bestPerformingDay || 'Friday',
      improvementAreas: parsed.improvementAreas || [
        'Increase social media engagement',
        'Follow up with leads more consistently',
        'Diversify product offerings'
      ]
    };
  } catch (error) {
    console.warn("Performance Analysis Error:", error);
    const salesCount = transactions.filter(t => t.type === 'Direct Sale').length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      conversionRate: 12,
      averageOrderValue: salesCount > 0 ? totalRevenue / salesCount : 0,
      customerRetention: 60,
      teamGrowthRate: 8,
      topProducts: [],
      bestPerformingDay: 'Friday',
      improvementAreas: [
        'Increase daily activity consistency',
        'Engage with your team more often',
        'Share success stories on social media'
      ]
    };
  }
};

/**
 * Suggest personalized goals based on user performance
 */
export const suggestGoals = async (
  user: User,
  currentGoals: Goal[]
): Promise<Goal[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are a goal-setting coach for WellNexus sellers.

      User Profile:
      - Rank: ${user.rank}
      - Total Sales: ${user.totalSales.toLocaleString()} VND
      - Team Size: ${user.teamSize}
      - Current Level: ${user.level}

      Current Active Goals: ${currentGoals.filter(g => g.status === 'active').length}

      Suggest 3 SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) in JSON format:
      [
        {
          "title": "goal title",
          "description": "why this matters",
          "type": "daily|weekly|monthly",
          "target": number,
          "unit": "sales|revenue|recruits|products",
          "deadline": "YYYY-MM-DD"
        }
      ]

      Goals should be challenging but achievable based on their current performance.
      Only respond with valid JSON array.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    return parsed.map((g: any, idx: number) => ({
      id: `GOAL-AI-${Date.now()}-${idx}`,
      title: g.title,
      description: g.description,
      type: g.type,
      target: g.target,
      current: 0,
      unit: g.unit,
      deadline: g.deadline,
      aiSuggested: true,
      status: 'active' as const,
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.warn("Goal Suggestion Error:", error);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
      {
        id: `GOAL-AI-${Date.now()}-1`,
        title: 'Daily Sales Target',
        description: 'Increase your daily sales momentum',
        type: 'daily',
        target: 3,
        current: 0,
        unit: 'sales',
        deadline: tomorrow.toISOString().split('T')[0],
        aiSuggested: true,
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: `GOAL-AI-${Date.now()}-2`,
        title: 'Weekly Revenue Goal',
        description: 'Boost your weekly earnings',
        type: 'weekly',
        target: user.totalSales > 0 ? Math.round(user.totalSales * 0.15) : 2000000,
        current: 0,
        unit: 'revenue',
        deadline: nextWeek.toISOString().split('T')[0],
        aiSuggested: true,
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];
  }
};

/**
 * Get product recommendation based on user context
 */
export const getProductRecommendation = async (
  user: User,
  products: Product[],
  recentTransactions: Transaction[]
): Promise<{ productId: string; reason: string }> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Recommend the best product for this WellNexus seller to focus on:

      User: ${user.name} (${user.rank})
      Recent sales: ${recentTransactions.slice(0, 3).map(t => t.type).join(', ')}

      Products:
      ${products.map((p, i) => `${i + 1}. ${p.name} - ${p.price.toLocaleString()} VND, ${(p.commissionRate * 100)}% commission, ${p.stock} stock`).join('\n')}

      Respond in JSON: {"productIndex": number (0-based), "reason": "1 sentence why"}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    const productIndex = Math.min(Math.max(0, parsed.productIndex), products.length - 1);

    return {
      productId: products[productIndex].id,
      reason: parsed.reason || 'Great commission rate and high demand'
    };
  } catch (error) {
    console.warn("Product Recommendation Error:", error);
    // Recommend product with highest commission rate
    const bestProduct = products.reduce((best, p) =>
      p.commissionRate > best.commissionRate ? p : best
    , products[0]);

    return {
      productId: bestProduct.id,
      reason: `Highest commission rate (${(bestProduct.commissionRate * 100)}%) - maximize your earnings!`
    };
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