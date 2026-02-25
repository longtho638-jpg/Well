import { ObjectionTemplate } from '@/types';

export const OBJECTION_TEMPLATES: ObjectionTemplate[] = [
  {
    type: 'price',
    keywords: ['đắt', 'giá cao', 'expensive', 'costly', 'too much', 'quá đắt'],
    responses: [
      'Tôi hiểu lo ngại của bạn về giá cả. Tuy nhiên, hãy xem đây là khoản đầu tư cho sức khỏe dài hạn...',
      'Giá trị sản phẩm vượt xa mức giá. Với chất lượng này, bạn đang tiết kiệm chi phí y tế dài hạn.',
    ],
  },
  {
    type: 'skepticism',
    keywords: ['không tin', 'nghi ngờ', 'doubt', 'skeptical', 'scam', 'lừa đảo'],
    responses: [
      'Tôi hoàn toàn hiểu sự thận trọng của bạn. Có thể bạn muốn xem chứng nhận chất lượng hoặc phản hồi từ khách hàng khác?',
      'Đây là câu hỏi rất hay! Chúng tôi có đầy đủ giấy tờ chứng nhận và hàng ngàn khách hàng hài lòng.',
    ],
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
