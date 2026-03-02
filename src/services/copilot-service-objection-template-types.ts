/**
 * Copilot service — ObjectionTemplate type re-export, service response types,
 * and OBJECTION_TEMPLATES data. Extracted to keep copilotService.ts under 200 LOC.
 */

import type { ObjectionType, ObjectionTemplate } from '@/types';

export type { ObjectionType, ObjectionTemplate };

export interface CopilotGenerateResponseResult {
  response: string;
  objectionType?: ObjectionType;
  suggestion?: string;
}

export const OBJECTION_TEMPLATES: ObjectionTemplate[] = [
  {
    type: 'price',
    keywords: ['expensive', 'costly', 'price', 'afford', 'cheap', 'giá', 'đắt', 'tiền'],
    responses: [
      "Tôi hiểu! Hãy xem đây là đầu tư vào sức khỏe dài hạn. Bạn đang trả cho chất lượng và kết quả bền vững.",
      "Chúng ta có chương trình trả góp linh hoạt. Bạn muốn tìm hiểu thêm không?",
      "So với chi phí điều trị và mất thời gian sau này, đây là khoản đầu tư thông minh đấy!",
    ],
  },
  {
    type: 'skepticism',
    keywords: ['scam', 'fake', 'trust', 'real', 'work', 'lừa', 'thật', 'tin', 'có hiệu quả'],
    responses: [
      "Tôi hoàn toàn hiểu! Đó là lý do chúng tôi có chính sách hoàn tiền 100% trong 30 ngày nếu không hài lòng.",
      "Có hơn 5000+ khách hàng đã tin tùng và có kết quả. Tôi có thể chia sẻ một số review thực tế?",
      "Sản phẩm có đầy đủ giấy chứng nhận từ Bộ Y Tế. Tôi gửi bạn xem nhé!",
    ],
  },
  {
    type: 'competition',
    keywords: ['compare', 'competitor', 'other', 'better', 'alternative', 'so sánh', 'khác', 'tốt hơn'],
    responses: [
      "Điểm khác biệt của chúng tôi là công thức độc quyền và nguồn gốc tự nhiên 100%.",
      "Chúng tôi tập trung vào chất lượng và kết quả lâu dài, không chỉ giá rẻ nhất.",
      "Bạn đang xem xét sản phẩm nào? Tôi có thể giúp so sánh chi tiết!",
    ],
  },
  {
    type: 'timing',
    keywords: ['later', 'wait', 'think', 'time', 'busy', 'sau', 'đợi', 'suy nghĩ', 'bận'],
    responses: [
      "Tôi hiểu! Nhưng chương trình ưu đãi này sẽ kết thúc vào cuối tuần. Để tôi giữ slot cho bạn nhé?",
      "Không vấn đề gì! Tôi gửi bạn thông tin để tham khảo. Bạn có câu hỏi nào cần giải đáp không?",
      "Càng sớm bắt đầu, càng sớm thấy kết quả! Nhưng tôi respect quyết định của bạn.",
    ],
  },
  {
    type: 'need',
    keywords: ["don't need", 'not necessary', 'không cần', 'không thiết', 'không phải'],
    responses: [
      "Tôi hiểu! Nhiều khách hàng cũng nghĩ vậy ban đầu. Nhưng sau khi dùng thử, họ nhận ra lợi ích vượt mong đợi.",
      "Đây không phải 'cần thiết' mà là 'đáng giá'. Bạn muốn nghe câu chuyện của những người giống bạn không?",
      "Có thể bạn đang làm tốt rồi! Nhưng sản phẩm này giúp bạn đạt mức TỐT HƠN nữa.",
    ],
  },
  {
    type: 'general',
    keywords: [],
    responses: [
      "Tôi hoàn toàn hiểu quan điểm của bạn! Để tôi giải thích thêm về điều này.",
      "Đó là câu hỏi rất hay! Nhiều người cũng thắc mắc điều tương tự.",
      "Cảm ơn bạn đã chia sẻ! Hãy để tôi giúp bạn hiểu rõ hơn.",
    ],
  },
];
