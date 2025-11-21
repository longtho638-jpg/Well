import { GoogleGenerativeAI } from "@google/generative-ai";
import { ObjectionType, ObjectionTemplate } from "@/types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'demo-key');

// Objection handling templates
export const OBJECTION_TEMPLATES: ObjectionTemplate[] = [
  {
    type: 'price',
    keywords: ['expensive', 'costly', 'price', 'afford', 'cheap', 'giá', 'đắt', 'tiền'],
    responses: [
      "Tôi hiểu! Hãy xem đây là đầu tư vào sức khỏe dài hạn. Bạn đang trả cho chất lượng và kết quả bền vững.",
      "Chúng ta có chương trình trả góp linh hoạt. Bạn muốn tìm hiểu thêm không?",
      "So với chi phí điều trị và mất thời gian sau này, đây là khoản đầu tư thông minh đấy!"
    ]
  },
  {
    type: 'skepticism',
    keywords: ['scam', 'fake', 'trust', 'real', 'work', 'lừa', 'thật', 'tin', 'có hiệu quả'],
    responses: [
      "Tôi hoàn toàn hiểu! Đó là lý do chúng tôi có chính sách hoàn tiền 100% trong 30 ngày nếu không hài lòng.",
      "Có hơn 5000+ khách hàng đã tin tùng và có kết quả. Tôi có thể chia sẻ một số review thực tế?",
      "Sản phẩm có đầy đủ giấy chứng nhận từ Bộ Y Tế. Tôi gửi bạn xem nhé!"
    ]
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

// Detect objection type from user message
export function detectObjection(message: string): ObjectionType {
  const lowerMessage = message.toLowerCase();

  for (const template of OBJECTION_TEMPLATES) {
    if (template.keywords.length === 0) continue;

    for (const keyword of template.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return template.type;
      }
    }
  }

  return 'general';
}

// Get suggested response for objection
export function getSuggestedResponse(objectionType: ObjectionType): string {
  const template = OBJECTION_TEMPLATES.find(t => t.type === objectionType);
  if (!template || template.responses.length === 0) {
    return "Tôi hiểu quan điểm của bạn. Để tôi giải thích thêm!";
  }

  const randomIndex = Math.floor(Math.random() * template.responses.length);
  return template.responses[randomIndex];
}

// Generate AI-powered response using Gemini
export async function generateCopilotResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  productContext?: string
): Promise<{ response: string; objectionType?: ObjectionType; suggestion?: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Detect objection
    const objectionType = detectObjection(userMessage);
    const suggestion = getSuggestedResponse(objectionType);

    // Build context-aware prompt
    const contextPrompt = productContext
      ? `Product Context: ${productContext}\n\n`
      : '';

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      response: text || suggestion,
      objectionType,
      suggestion
    };
  } catch (error) {
    console.warn("Copilot AI Error:", error);

    // Fallback to template-based response
    const objectionType = detectObjection(userMessage);
    const suggestion = getSuggestedResponse(objectionType);

    return {
      response: suggestion,
      objectionType,
      suggestion
    };
  }
}

// Generate sales script for a product
export async function generateSalesScript(
  productName: string,
  productDescription: string,
  customerProfile?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Script đang được cập nhật...";
  } catch (error) {
    console.warn("Script Generation Error:", error);
    return `
🎯 **Kịch Bản Bán Hàng - ${productName}**

1️⃣ **Mở Đầu**
Chào bạn! Tôi là [tên] từ WellNexus. Tôi nhận thấy bạn quan tâm đến ${productName}. Đây là sản phẩm rất phù hợp cho người muốn [benefit].

2️⃣ **Xác Định Vấn Đề**
Bạn có đang gặp vấn đề với [pain point]? Nhiều khách hàng của tôi cũng từng như vậy.

3️⃣ **Giới Thiệu Giải Pháp**
${productName} được thiết kế đặc biệt để giải quyết chính xác vấn đề này. ${productDescription}

4️⃣ **Kết Thúc**
Hiện tại chúng tôi có chương trình ưu đãi đặc biệt. Bạn muốn tôi tư vấn chi tiết hơn không?
    `.trim();
  }
}

// Analyze conversation and provide coaching tips
export async function getCopilotCoaching(
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Phân tích đang được cập nhật...";
  } catch (error) {
    console.warn("Coaching Error:", error);
    return "✅ Tốt: Bạn đã lắng nghe khách hàng\n⚠️ Cải thiện: Hỏi thêm câu hỏi mở\n🎯 Tiếp theo: Đưa ra case study cụ thể";
  }
}
