import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Package, ShoppingCart, Sparkles } from 'lucide-react';
import { useStore } from '@/store';
import { formatVND } from '@/utils/format';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  productRecommendation?: ProductRecommendation;
  timestamp: Date;
}

interface ProductRecommendation {
  comboName: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  totalPrice: number;
  reason: string;
}

// Mock AI Response Logic
const generateMockResponse = (userMessage: string): Message => {
  const lowerMessage = userMessage.toLowerCase();

  // Health symptom detection patterns
  const sleepIssues = /mất ngủ|khó ngủ|ngủ không ngon|insomnia/i.test(lowerMessage);
  const headache = /đau đầu|nhức đầu|headache/i.test(lowerMessage);
  const stress = /stress|căng thẳng|lo âu|anxiety/i.test(lowerMessage);
  const fatigue = /mệt mỏi|uể oải|tired|fatigue/i.test(lowerMessage);
  const immunity = /miễn dịch|hay ốm|sức đề kháng|immunity/i.test(lowerMessage);

  // Generate response based on symptoms
  if (sleepIssues || headache || stress) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Dựa trên các triệu chứng bạn mô tả (mất ngủ, đau đầu, căng thẳng), tôi khuyên dùng **Combo ANIMA Thư Giãn**. Combo này được thiết kế đặc biệt để cải thiện giấc ngủ và giảm căng thẳng thần kinh.',
      productRecommendation: {
        comboName: 'Combo ANIMA Thư Giấc',
        products: [
          { id: '1', name: 'ANIMA 119 - Viên Uống Thần Kinh', price: 15900000 },
          { id: '3', name: 'ANIMA Immune Boost', price: 890000 }
        ],
        totalPrice: 16790000,
        reason: 'ANIMA 119 giúp ổn định hệ thần kinh, cải thiện giấc ngủ. Immune Boost bổ sung năng lượng và tăng sức đề kháng.'
      },
      timestamp: new Date()
    };
  }

  if (fatigue || immunity) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Triệu chứng mệt mỏi và sức đề kháng kém có thể do cơ thể thiếu dinh dưỡng. Tôi gợi ý **Combo Năng Lượng & Miễn Dịch** để phục hồi sức khỏe.',
      productRecommendation: {
        comboName: 'Combo Năng Lượng & Miễn Dịch',
        products: [
          { id: '2', name: 'ANIMA Starter Kit', price: 4500000 },
          { id: '3', name: 'ANIMA Immune Boost', price: 890000 }
        ],
        totalPrice: 5390000,
        reason: 'Starter Kit cung cấp dinh dưỡng toàn diện, Immune Boost tăng cường miễn dịch và giảm mệt mỏi.'
      },
      timestamp: new Date()
    };
  }

  // Default greeting response
  if (/xin chào|hi|hello|chào/i.test(lowerMessage)) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Xin chào! Tôi là **WellNexus Health Coach** - trợ lý sức khỏe AI của bạn. 🌿\n\nHãy mô tả các triệu chứng hoặc vấn đề sức khỏe bạn đang gặp, tôi sẽ tư vấn sản phẩm phù hợp nhất.\n\n**Ví dụ:** "Tôi hay bị mất ngủ, đau đầu" hoặc "Tôi cảm thấy mệt mỏi, hay bị ốm".',
      timestamp: new Date()
    };
  }

  // Fallback response
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: 'Cảm ơn bạn đã chia sẻ. Để tư vấn chính xác hơn, bạn có thể mô tả cụ thể hơn các triệu chứng không?\n\n**Gợi ý:** Hãy cho tôi biết bạn đang gặp vấn đề gì (ví dụ: mất ngủ, đau đầu, mệt mỏi, hay bị ốm...)',
    timestamp: new Date()
  };
};

export default function HealthCoach() {
  const { simulateOrder } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Xin chào! Tôi là **WellNexus Health Coach** 🌿\n\nHãy chia sẻ với tôi về tình trạng sức khỏe hoặc triệu chứng bạn đang gặp phải. Tôi sẽ tư vấn combo sản phẩm phù hợp nhất cho bạn.\n\n**Ví dụ:** "Tôi hay bị mất ngủ và đau đầu" hoặc "Tôi thường xuyên cảm thấy mệt mỏi".',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate AI response
    const aiResponse = generateMockResponse(inputValue);
    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handleQuickOrder = (recommendation: ProductRecommendation) => {
    // Simulate ordering all products in the combo
    recommendation.products.forEach(product => {
      simulateOrder(product.id);
    });

    // Add confirmation message
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `✅ Đã tạo đơn hàng thành công!\n\n**${recommendation.comboName}** (${formatVND(recommendation.totalPrice)}) đã được thêm vào lịch sử giao dịch của bạn.\n\nBạn có thể kiểm tra tại trang **Ví Hoa Hồng**. Cảm ơn bạn đã tin dùng ANIMA! 🎉`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-amber-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-teal-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Health Coach AI</h1>
              <p className="text-teal-100 text-sm mt-1">
                Trợ lý sức khỏe thông minh - Tư vấn sản phẩm cá nhân hóa
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-b-2xl shadow-2xl">
          {/* Messages Area */}
          <div className="h-[600px] overflow-y-auto p-6 space-y-6">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-accent to-yellow-500'
                        : 'bg-gradient-to-br from-primary to-teal-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`flex-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-accent to-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                    </div>

                    {/* Product Recommendation Card */}
                    {message.productRecommendation && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 inline-block w-full max-w-md bg-white border-2 border-primary/20 rounded-xl p-5 shadow-lg"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-primary" />
                          <h3 className="font-bold text-lg text-primary">
                            {message.productRecommendation.comboName}
                          </h3>
                        </div>

                        <div className="space-y-2 mb-4">
                          {message.productRecommendation.products.map((product) => (
                            <div
                              key={product.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-700">{product.name}</span>
                              <span className="font-semibold text-primary">
                                {formatVND(product.price)}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                            <span className="font-bold text-gray-800">Tổng cộng:</span>
                            <span className="font-bold text-xl text-primary">
                              {formatVND(message.productRecommendation.totalPrice)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 italic">
                          {message.productRecommendation.reason}
                        </p>

                        <button
                          onClick={() => handleQuickOrder(message.productRecommendation!)}
                          className="w-full bg-gradient-to-r from-primary to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                          <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          Tạo đơn ngay
                        </button>
                      </motion.div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 mt-2">
                      {message.timestamp.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 p-4 rounded-2xl">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mô tả triệu chứng của bạn... (VD: Tôi hay bị mất ngủ, đau đầu)"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-primary to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Gửi
              </motion.button>
            </div>

            {/* Quick Suggestions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <p className="text-xs text-gray-500 w-full mb-1">Gợi ý câu hỏi:</p>
              {['Tôi hay bị mất ngủ', 'Tôi cảm thấy mệt mỏi', 'Tăng cường miễn dịch'].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          <p>
            💡 Health Coach AI sử dụng công nghệ phân tích triệu chứng để đề xuất sản phẩm
            phù hợp.
          </p>
          <p className="mt-1">
            Lưu ý: Đây là công cụ hỗ trợ, không thay thế tư vấn y tế chuyên nghiệp.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
