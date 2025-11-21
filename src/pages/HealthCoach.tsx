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

// Mock AI Response Logic
const generateMockResponse = (userMessage: string, t: (key: string) => string): Message => {
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
      content: t('healthCoach.sleepStressResponse'),
      productRecommendation: {
        comboName: t('healthCoach.comboRelaxation'),
        products: [
          { id: '1', name: 'ANIMA 119 - Viên Uống Thần Kinh', price: 15900000 },
          { id: '3', name: 'ANIMA Immune Boost', price: 890000 }
        ],
        totalPrice: 16790000,
        reason: t('healthCoach.reasonRelaxation')
      },
      timestamp: new Date()
    };
  }

  if (fatigue || immunity) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: t('healthCoach.fatigueResponse'),
      productRecommendation: {
        comboName: t('healthCoach.comboEnergy'),
        products: [
          { id: '2', name: 'ANIMA Starter Kit', price: 4500000 },
          { id: '3', name: 'ANIMA Immune Boost', price: 890000 }
        ],
        totalPrice: 5390000,
        reason: t('healthCoach.reasonEnergy')
      },
      timestamp: new Date()
    };
  }

  // Default greeting response
  if (/xin chào|hi|hello|chào/i.test(lowerMessage)) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: t('healthCoach.greetingResponse'),
      timestamp: new Date()
    };
  }

  // Fallback response
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: t('healthCoach.fallbackResponse'),
    timestamp: new Date()
  };
};

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
  const { simulateOrder } = useStore();
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
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate AI response
    const aiResponse = generateMockResponse(inputValue, t);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-teal-50/30 dark:via-slate-800/30 to-amber-50/20 dark:to-slate-800/20">
      {/* Main Container - 3 Column Layout */}
      <div className="h-screen flex">
        {/* LEFT SIDEBAR - Chat History */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-80 bg-white dark:bg-slate-800 backdrop-blur-xl border-r border-gray-200 dark:border-slate-700 flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Lịch Sử</h2>
                <p className="text-xs text-gray-600 dark:text-slate-400">Các cuộc hội thoại</p>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-primary to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group">
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
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                  selectedHistory === chat.id
                    ? 'bg-gradient-to-r from-primary/10 dark:from-primary/20 to-teal-600/10 dark:to-teal-600/20 border-2 border-primary/30 dark:border-primary/40 shadow-md'
                    : 'bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 border-2 border-transparent hover:border-gray-200 dark:hover:border-slate-500'
                }`}
              >
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm mb-1 line-clamp-1">
                  {chat.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-slate-400">
                    {chat.date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {chat.messageCount}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* CENTER - Main Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-primary to-teal-600 px-8 py-6 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  boxShadow: isTyping
                    ? ['0 0 0 0 rgba(0, 87, 90, 0.4)', '0 0 0 15px rgba(0, 87, 90, 0)']
                    : '0 0 0 0 rgba(0, 87, 90, 0)'
                }}
                transition={{ duration: 1.5, repeat: isTyping ? Infinity : 0 }}
                className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-xl"
              >
                <Stethoscope className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  {t('healthCoach.title')}
                  <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                </h1>
                <p className="text-teal-100 text-sm">
                  {isTyping ? 'Đang phân tích và tư vấn...' : t('healthCoach.subtitle')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-white/30">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-accent to-yellow-500'
                        : 'bg-gradient-to-br from-primary to-teal-600'
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
                    className={`flex-1 max-w-2xl ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`inline-block p-5 rounded-2xl shadow-lg backdrop-blur-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-accent to-yellow-500 text-white'
                          : 'bg-white/90 text-gray-800 border border-gray-100'
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
                        <div className="bg-gradient-to-br from-white to-teal-50/50 backdrop-blur-xl border-2 border-primary/30 rounded-2xl p-6 shadow-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-bold text-lg text-primary">
                              {message.productRecommendation.comboName}
                            </h3>
                          </div>

                          <div className="space-y-3 mb-4">
                            {message.productRecommendation.products.map((product) => (
                              <div
                                key={product.id}
                                className="flex justify-between items-center bg-white/80 rounded-xl p-3 border border-gray-100"
                              >
                                <div className="flex items-center gap-2">
                                  <Pill className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium text-gray-700">{product.name}</span>
                                </div>
                                <span className="font-bold text-primary">
                                  {formatVND(product.price)}
                                </span>
                              </div>
                            ))}
                            <div className="bg-gradient-to-r from-primary/10 to-teal-600/10 rounded-xl p-3 flex justify-between items-center border-2 border-primary/20">
                              <span className="font-bold text-gray-900">{t('healthCoach.totalLabel')}</span>
                              <span className="font-bold text-2xl text-primary">
                                {formatVND(message.productRecommendation.totalPrice)}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-4 italic bg-amber-50/50 p-3 rounded-lg border border-amber-200/50">
                            💡 {message.productRecommendation.reason}
                          </p>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleQuickOrder(message.productRecommendation!)}
                            className="w-full bg-gradient-to-r from-primary to-teal-600 text-white py-4 px-6 rounded-xl font-bold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
                          >
                            <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {t('healthCoach.orderNow')}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 justify-end">
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
                      '0 0 0 0 rgba(0, 87, 90, 0.7)',
                      '0 0 0 10px rgba(0, 87, 90, 0)'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-lg"
                >
                  <Bot className="w-6 h-6 text-white" />
                </motion.div>
                <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-3 h-3 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-3 h-3 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-3 h-3 bg-primary rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('healthCoach.placeholder')}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-200 dark:border-slate-600 focus:border-primary focus:outline-none transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-gradient-to-r from-primary to-teal-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  {t('healthCoach.send')}
                </motion.button>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <p className="text-xs text-gray-600 dark:text-slate-400 w-full mb-1 font-semibold">
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
                    className="text-sm bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-100 px-4 py-2 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm"
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
          className="w-96 bg-gradient-to-b from-white dark:from-slate-800 to-teal-50/30 dark:to-slate-900/30 backdrop-blur-xl border-l border-gray-200 dark:border-slate-700 p-6 space-y-6 overflow-y-auto"
        >
          {/* Patient Profile Card */}
          <div className="bg-white dark:bg-slate-800 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100">Hồ Sơ Khách Hàng</h3>
                <p className="text-xs text-gray-600 dark:text-slate-400">Thông tin tư vấn</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-600 dark:text-slate-400">Tuổi</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{MOCK_PATIENT.age} tuổi</span>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Vấn đề chính</p>
                <div className="flex flex-wrap gap-2">
                  {MOCK_PATIENT.mainConcerns.map((concern, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-200 font-medium"
                    >
                      {concern}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Lịch sử mua hàng</p>
                <div className="space-y-2">
                  {MOCK_PATIENT.purchaseHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-200"
                    >
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-600 dark:text-slate-400">Lần tư vấn gần nhất</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-slate-100">
                  {MOCK_PATIENT.lastVisit.toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Health Score Card */}
          <div className="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-accent" />
              <h3 className="font-bold text-lg">Điểm Sức Khỏe</h3>
            </div>

            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255,255,255,0.2)"
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
                    stroke="#FFBF00"
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
            <div className="bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100 dark:border-slate-700">
              <Activity className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">12</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">Tư vấn hoàn thành</p>
            </div>
            <div className="bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100 dark:border-slate-700">
              <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">+15%</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">Cải thiện sức khỏe</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-slate-700 backdrop-blur-sm rounded-xl p-4 border border-amber-200 dark:border-slate-600">
            <p className="text-xs text-amber-800 dark:text-slate-200 leading-relaxed">
              ⚠️ {t('healthCoach.disclaimerTech')} {t('healthCoach.disclaimerMedical')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
