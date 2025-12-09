import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Package,
  ShoppingCart,
  Sparkles,
  Clock,
  Heart,
  Activity,
  TrendingUp,
  MessageSquare,
  Stethoscope,
  Pill,
  History
} from 'lucide-react';
import { useStore } from '@/store';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';
import { useAgentOS } from '@/hooks/useAgentOS';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';

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

interface ChatHistory {
  id: string;
  title: string;
  date: Date;
  messageCount: number;
}

interface PatientProfile {
  age: number;
  mainConcerns: string[];
  purchaseHistory: string[];
  lastVisit: Date;
  healthScore: number;
}

// Mock data
const MOCK_CHAT_HISTORY: ChatHistory[] = [
  {
    id: '1',
    title: 'Tư vấn chứng mất ngủ',
    date: new Date(2025, 10, 18),
    messageCount: 12
  },
  {
    id: '2',
    title: 'Hỏi về tăng cường miễn dịch',
    date: new Date(2025, 10, 15),
    messageCount: 8
  },
  {
    id: '3',
    title: 'Stress công việc',
    date: new Date(2025, 10, 10),
    messageCount: 15
  }
];

const MOCK_PATIENT: PatientProfile = {
  age: 32,
  mainConcerns: ['Mất ngủ', 'Stress công việc', 'Mệt mỏi'],
  purchaseHistory: ['ANIMA 119', 'Immune Boost'],
  lastVisit: new Date(2025, 10, 15),
  healthScore: 68
};

export default function HealthCoach() {
  const t = useTranslation();
  const { user, simulateOrder } = useStore();
  const { executeAgent } = useAgentOS();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: t('healthCoach.greeting'),
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
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
    const userInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Execute GeminiCoachAgent
      const aiResponseText = await executeAgent('Gemini Coach', {
        action: 'getCoachAdvice',
        user: user,
        context: userInput
      });

      // Format AI response
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: typeof aiResponseText === 'string' ? aiResponseText : aiResponseText.error || 'Xin lỗi, đã có lỗi xảy ra.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('[HealthCoach] Agent execution error:', error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
      content: t('healthCoach.orderSuccess', {
        comboName: recommendation.comboName,
        totalPrice: formatVND(recommendation.totalPrice)
      }),
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
    <div className="min-h-screen bg-dark-ultra relative overflow-hidden">
      <ParticleBackground />
      <CursorGlow />

      {/* Main Container - 3 Column Layout */}
      <div className="h-screen flex relative z-10">
        {/* LEFT SIDEBAR - Chat History */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-80 glass-dark border-r border-white/10 flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Lịch Sử</h2>
                <p className="text-xs text-white/60">Các cuộc hội thoại</p>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group">
              <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Tạo Cuộc Hội Thoại Mới
            </button>
          </div>

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {MOCK_CHAT_HISTORY.map((chat) => (
              <motion.button
                key={chat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedHistory(chat.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${selectedHistory === chat.id
                  ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 border border-teal-500/50 shadow-md'
                  : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
              >
                <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                  {chat.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">
                    {chat.date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {chat.messageCount}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* CENTER - Main Chat Interface */}
        <div className="flex-1 flex flex-col glass-ultra border-x border-white/10">
          {/* Chat Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-teal-600/50 to-teal-500/50 backdrop-blur-xl px-8 py-6 shadow-lg border-b border-white/10"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  boxShadow: isTyping
                    ? ['0 0 0 0 rgba(20, 184, 166, 0.4)', '0 0 0 15px rgba(20, 184, 166, 0)']
                    : '0 0 0 0 rgba(20, 184, 166, 0)'
                }}
                transition={{ duration: 1.5, repeat: isTyping ? Infinity : 0 }}
                className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-xl border border-white/20"
              >
                <Stethoscope className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  {t('healthCoach.title')}
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                </h1>
                <p className="text-teal-200 text-sm">
                  {isTyping ? 'Đang phân tích và tư vấn...' : t('healthCoach.subtitle')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                  {/* Avatar */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${message.role === 'user'
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-br from-teal-500 to-teal-600'
                      }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-6 h-6 text-white" />
                    ) : (
                      <Bot className="w-6 h-6 text-white" />
                    )}
                  </motion.div>

                  {/* Message Content */}
                  <div
                    className={`flex-1 max-w-2xl ${message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`inline-block p-5 rounded-2xl shadow-lg backdrop-blur-sm ${message.role === 'user'
                        ? 'bg-gradient-to-br from-yellow-500/80 to-orange-500/80 text-white border border-yellow-400/30'
                        : 'bg-white/10 text-white border border-white/10'
                        }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                    </motion.div>

                    {/* Product Recommendation Card */}
                    {message.productRecommendation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 inline-block w-full max-w-lg"
                      >
                        <div className="bg-gradient-to-br from-teal-900/50 to-teal-800/50 backdrop-blur-xl border-2 border-teal-500/30 rounded-2xl p-6 shadow-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-bold text-lg text-teal-300">
                              {message.productRecommendation.comboName}
                            </h3>
                          </div>

                          <div className="space-y-3 mb-4">
                            {message.productRecommendation.products.map((product) => (
                              <div
                                key={product.id}
                                className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10"
                              >
                                <div className="flex items-center gap-2">
                                  <Pill className="w-4 h-4 text-teal-400" />
                                  <span className="text-sm font-medium text-white">{product.name}</span>
                                </div>
                                <span className="font-bold text-teal-300">
                                  {formatVND(product.price)}
                                </span>
                              </div>
                            ))}
                            <div className="bg-gradient-to-r from-teal-500/20 to-teal-600/20 rounded-xl p-3 flex justify-between items-center border-2 border-teal-500/30">
                              <span className="font-bold text-white">{t('healthCoach.totalLabel')}</span>
                              <span className="font-bold text-2xl text-teal-300">
                                {formatVND(message.productRecommendation.totalPrice)}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-yellow-200 mb-4 italic bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/30">
                            💡 {message.productRecommendation.reason}
                          </p>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleQuickOrder(message.productRecommendation!)}
                            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-4 px-6 rounded-xl font-bold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group border border-teal-400/30"
                          >
                            <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {t('healthCoach.orderNow')}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-white/40 mt-2 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-4"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(20, 184, 166, 0.7)',
                      '0 0 0 10px rgba(20, 184, 166, 0)'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg"
                >
                  <Bot className="w-6 h-6 text-white" />
                </motion.div>
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-white/10">
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-3 h-3 bg-teal-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-3 h-3 bg-teal-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-3 h-3 bg-teal-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 p-6 bg-slate-900/50 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('healthCoach.placeholder')}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-white/10 focus:border-teal-500 focus:outline-none transition-all duration-300 bg-white/5 text-white shadow-sm placeholder-white/30"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group border border-teal-400/30"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  {t('healthCoach.send')}
                </motion.button>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <p className="text-xs text-white/60 w-full mb-1 font-semibold">
                  💬 {t('healthCoach.quickSuggestionsLabel')}
                </p>
                {[
                  t('healthCoach.suggestions.sleep'),
                  t('healthCoach.suggestions.fatigue'),
                  t('healthCoach.suggestions.immunity')
                ].map((suggestion) => (
                  <motion.button
                    key={suggestion}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInputValue(suggestion)}
                    className="text-sm bg-white/5 border border-white/10 text-white px-4 py-2 rounded-full hover:bg-teal-600/50 hover:border-teal-500 transition-all duration-200 shadow-sm"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Patient Context */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-96 glass-dark border-l border-white/10 p-6 space-y-6 overflow-y-auto"
        >
          {/* Patient Profile Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Hồ Sơ Khách Hàng</h3>
                <p className="text-xs text-white/60">Thông tin tư vấn</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-sm text-white/60">Tuổi</span>
                <span className="font-bold text-white">{MOCK_PATIENT.age} tuổi</span>
              </div>

              <div>
                <p className="text-sm text-white/60 mb-2">Vấn đề chính</p>
                <div className="flex flex-wrap gap-2">
                  {MOCK_PATIENT.mainConcerns.map((concern, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-red-900/30 text-red-300 px-3 py-1.5 rounded-full border border-red-500/30 font-medium"
                    >
                      {concern}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-white/60 mb-2">Lịch sử mua hàng</p>
                <div className="space-y-2">
                  {MOCK_PATIENT.purchaseHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-green-900/30 p-2 rounded-lg border border-green-500/30"
                    >
                      <Package className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-medium text-green-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-white/10">
                <span className="text-sm text-white/60">Lần tư vấn gần nhất</span>
                <span className="text-xs font-semibold text-white">
                  {MOCK_PATIENT.lastVisit.toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Health Score Card */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 shadow-xl text-white border border-teal-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-yellow-400" />
              <h3 className="font-bold text-lg">Điểm Sức Khỏe</h3>
            </div>

            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: 352 }}
                    animate={{ strokeDashoffset: 352 - (352 * MOCK_PATIENT.healthScore) / 100 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#FBBF24"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="352"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold">{MOCK_PATIENT.healthScore}</span>
                </div>
              </div>
            </div>

            <p className="text-center text-teal-100 text-sm">
              Điểm số tốt! Tiếp tục duy trì lối sống lành mạnh.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/10">
              <Activity className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-xs text-white/60">Tư vấn hoàn thành</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/10">
              <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-white">+15%</p>
              <p className="text-xs text-white/60">Cải thiện sức khỏe</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-900/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
            <p className="text-xs text-yellow-200 leading-relaxed">
              ⚠️ {t('healthCoach.disclaimerTech')} {t('healthCoach.disclaimerMedical')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
