import { ObjectionType, ObjectionTemplate } from "@/types";
import { aiLogger } from "@/utils/logger";
import { ServiceError } from "@/utils/errors";
import { agentRegistry } from "@/agents";
import type { SalesCopilotResult } from "@/agents/custom/SalesCopilotAgent";

// Kept for backward compatibility if needed, though ideally accessed via agent
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
/**
 * Analyze user message to detect sales objection type
 * @param message - User input text
 * @returns ObjectionType - Detected category (price, trust, etc.)
 */
export function detectObjection(message: string): ObjectionType {
  // Use agent if available
  const agent = agentRegistry.get('Sales Copilot');
  if (agent) {
    // We can't use await here because the function is synchronous
    // So we fallback to local logic or change signature.
    // Given the task is to wrapper, but signature change might break UI.
    // For synchronous methods, we'll keep local logic OR execute synchronously if possible (Agent execute is async).
    // Let's keep the local logic for synchronous functions to avoid breaking changes,
    // but ideally we should update the UI to handle async.
    // For this refactoring, we'll just keep the local logic duplicated in service for safety
    // or refactor to async if we can confirm usage.
    // Looking at usage in UI might be helpful. Assuming we must keep signature:
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

  // Fallback (same logic)
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
/**
 * Retrieve a template response for a specific objection type
 * @param objectionType - Category of objection
 * @returns string - Suggested response text
 */
export function getSuggestedResponse(objectionType: ObjectionType): string {
  const template = OBJECTION_TEMPLATES.find(t => t.type === objectionType);
  if (!template || template.responses.length === 0) {
    return "Tôi hiểu quan điểm của bạn. Để tôi giải thích thêm!";
  }

  const randomIndex = Math.floor(Math.random() * template.responses.length);
  return template.responses[randomIndex];
}

// Generate AI-powered response using Gemini
/**
 * Generate context-aware response using AI Agent
 * @param userMessage - Current message from user
 * @param conversationHistory - Chat history
 * @param productContext - Optional context about current product
 * @returns Promise with response text and metadata
 */
export async function generateCopilotResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  productContext?: string
): Promise<{ response: string; objectionType?: ObjectionType; suggestion?: string }> {
  try {
    const agent = agentRegistry.get('Sales Copilot');
    if (!agent) {
       throw new ServiceError("Sales Copilot Agent not found");
    }

    const result = await agent.execute({
      action: 'generateResponse',
      message: userMessage,
      history: conversationHistory,
      productContext
    }) as SalesCopilotResult;

    if (result && typeof result === 'object' && 'response' in result && !('error' in result)) {
       return result;
    }

    // Fallback if agent returns error structure
    let errorMessage = "Agent execution failed";
    if (result && typeof result === 'object' && 'error' in result) {
        errorMessage = (result as { error: string }).error;
    }
    throw new Error(errorMessage);

  } catch (error) {
    aiLogger.warn('Copilot Service Error', error);

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
/**
 * Create a tailored sales script for a specific product
 * @param productName - Name of product
 * @param productDescription - Details/Benefits
 * @param customerProfile - Optional target audience info
 * @returns Promise<string> Markdown formatted script
 */
export async function generateSalesScript(
  productName: string,
  productDescription: string,
  customerProfile?: string
): Promise<string> {
  try {
    const agent = agentRegistry.get('Sales Copilot');
    if (!agent) throw new ServiceError("Sales Copilot Agent not found");

    const result = await agent.execute({
      action: 'generateSalesScript',
      productName,
      productDescription,
      customerProfile
    }) as SalesCopilotResult;

    if (typeof result === 'string') return result;
    if (result && typeof result === 'object' && 'error' in result) throw new Error(result.error);
    return "Script đang được cập nhật...";

  } catch (error) {
    aiLogger.warn('Script Generation Error', error);
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
/**
 * Analyze chat history to provide coaching feedback
 * @param conversationHistory - Array of chat messages
 * @returns Promise<string> Coaching feedback text
 */
export async function getCopilotCoaching(
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const agent = agentRegistry.get('Sales Copilot');
    if (!agent) throw new ServiceError("Sales Copilot Agent not found");

    const result = await agent.execute({
      action: 'analyzeConversation',
      history: conversationHistory
    }) as SalesCopilotResult;

    if (typeof result === 'string') return result;
    if (result && typeof result === 'object' && 'error' in result) throw new Error(result.error);
    return "Phân tích đang được cập nhật...";

  } catch (error) {
    aiLogger.warn('Coaching Error', error);
    return "✅ Tốt: Bạn đã lắng nghe khách hàng\n⚠️ Cải thiện: Hỏi thêm câu hỏi mở\n🎯 Tiếp theo: Đưa ra case study cụ thể";
  }
}
