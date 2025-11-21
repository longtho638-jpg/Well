import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Copy,
  Check,
  Zap,
  Users,
  DollarSign,
} from 'lucide-react';
import { generateCopilotResponse, generateSalesScript, getCopilotCoaching } from '@/services/copilotService';
import { CopilotMessage, ObjectionType } from '@/types';

interface TheCopilotProps {
  productContext?: string;
  userName?: string;
}

// Typing Effect Hook
const useTypingEffect = (text: string, speed: number = 20) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!text) return;

    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;

    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isTyping };
};

// Typing Text Component
const TypingText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 20 }) => {
  const { displayedText, isTyping } = useTypingEffect(text, speed);

  return (
    <span>
      {displayedText}
      {isTyping && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>|</motion.span>}
    </span>
  );
};

export default function TheCopilot({ productContext, userName = "Bạn" }: TheCopilotProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Xin chào ${userName}! 👋 Tôi là **The Copilot** - trợ lý bán hàng AI của bạn.\n\nTôi sẽ giúp bạn:\n✅ Xử lý từ chối khách hàng\n✅ Gợi ý câu trả lời thông minh\n✅ Tạo kịch bản bán hàng\n\nHãy thử nhập một câu phản đối của khách hàng, ví dụ: "Sản phẩm này đắt quá!"`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCoaching, setShowCoaching] = useState(false);
  const [coaching, setCoaching] = useState('');
  const [copiedSuggestion, setCopiedSuggestion] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestion Chips
  const suggestionChips = [
    { icon: DollarSign, text: "Giá sản phẩm đắt quá!", color: "from-orange-500 to-red-500" },
    { icon: AlertCircle, text: "Tôi chưa tin tưởng sản phẩm này", color: "from-red-500 to-pink-500" },
    { icon: Users, text: "Sản phẩm bên X rẻ hơn", color: "from-purple-500 to-indigo-500" },
    { icon: Zap, text: "Viết kịch bản bán hàng cho tôi", color: "from-cyan-500 to-blue-500" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const messageText = customText || input.trim();
    if (!messageText || isLoading) return;

    setShowSuggestions(false);

    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { response, objectionType, suggestion } = await generateCopilotResponse(
        messageText,
        conversationHistory,
        productContext
      );

      const assistantMessage: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        objectionType,
        suggestion
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Copilot error:', error);
      const errorMessage: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại!',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!productContext) return;

    setIsLoading(true);
    const script = await generateSalesScript(
      'Sản phẩm hiện tại',
      productContext
    );

    const scriptMessage: CopilotMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: script,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, scriptMessage]);
    setIsLoading(false);
  };

  const handleGetCoaching = async () => {
    setIsLoading(true);
    setShowCoaching(true);

    const conversationHistory = messages
      .filter(m => m.role !== 'assistant' || !m.content.includes('Xin chào'))
      .map(m => ({ role: m.role, content: m.content }));

    const tips = await getCopilotCoaching(conversationHistory);
    setCoaching(tips);
    setIsLoading(false);
  };

  const copySuggestion = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuggestion(messageId);
    setTimeout(() => setCopiedSuggestion(null), 2000);
  };

  const getObjectionBadge = (type?: ObjectionType) => {
    if (!type) return null;

    const badges: Record<ObjectionType, { label: string; color: string }> = {
      price: { label: 'Giá cả', color: 'bg-orange-100 text-orange-700' },
      skepticism: { label: 'Nghi ngờ', color: 'bg-red-100 text-red-700' },
      competition: { label: 'Đối thủ', color: 'bg-purple-100 text-purple-700' },
      timing: { label: 'Thời điểm', color: 'bg-blue-100 text-blue-700' },
      need: { label: 'Nhu cầu', color: 'bg-green-100 text-green-700' },
      general: { label: 'Chung', color: 'bg-gray-100 text-gray-700' }
    };

    const badge = badges[type];
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-br from-[#0A0E27] via-[#1A1F3A] to-[#0A0E27] rounded-3xl shadow-2xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

        {/* Content */}
        <div className="relative p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AI Avatar with Breathing Animation */}
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 20px rgba(255, 191, 0, 0.3)',
                    '0 0 30px rgba(255, 191, 0, 0.5)',
                    '0 0 20px rgba(255, 191, 0, 0.3)',
                  ]
                }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="w-12 h-12 bg-gradient-to-br from-accent to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Bot className="w-7 h-7 text-primary" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute inset-0 bg-accent rounded-2xl blur-md -z-10"
              />
            </div>

            <div>
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                The Copilot
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                </motion.div>
              </h3>
              <p className="text-xs text-white/80">AI Sales Assistant • Powered by Gemini</p>
            </div>
          </div>

          <div className="flex gap-2">
            {productContext && (
              <button
                onClick={handleGenerateScript}
                disabled={isLoading}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-white/20 hover:border-white/40 disabled:opacity-50"
                title="Generate sales script"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Script
              </button>
            )}
            <button
              onClick={handleGetCoaching}
              disabled={isLoading || messages.length < 3}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-white/20 hover:border-white/40 disabled:opacity-50"
              title="Get coaching tips"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Coach
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0A0E27]/50 to-[#1A1F3A]/50">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30'
                    : 'bg-white/10 backdrop-blur-xl border border-white/20 text-gray-100'
                }`}
              >
                {/* Objection badge for user messages */}
                {message.role === 'user' && message.objectionType && (
                  <div className="mb-2">
                    {getObjectionBadge(message.objectionType)}
                  </div>
                )}

                {/* Message content with typing effect for last assistant message */}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.role === 'assistant' && index === messages.length - 1 && !isLoading ? (
                    <TypingText text={message.content} speed={15} />
                  ) : (
                    message.content
                  )}
                </div>

                {/* Suggested response for assistant messages */}
                {message.role === 'assistant' && message.suggestion && message.objectionType !== 'general' && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-start gap-2 text-xs">
                      <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-400 mb-1 font-medium">Gợi ý nhanh:</p>
                        <p className="text-gray-300 italic">{message.suggestion}</p>
                      </div>
                      <button
                        onClick={() => copySuggestion(message.suggestion!, message.id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy suggestion"
                      >
                        {copiedSuggestion === message.id ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-xs opacity-50 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3">
              <div className="flex gap-2">
                <motion.div
                  className="w-2 h-2 bg-accent rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-accent rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                />
                <motion.div
                  className="w-2 h-2 bg-accent rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggestion Chips */}
        {showSuggestions && messages.length <= 1 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-gray-400 text-xs font-medium">💡 Gợi ý câu hỏi:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestionChips.map((chip, index) => {
                const Icon = chip.icon;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(chip.text)}
                    className={`relative group overflow-hidden rounded-xl p-3 text-left transition-all`}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${chip.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className={`absolute inset-0 bg-gradient-to-r ${chip.color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`} />

                    {/* Content */}
                    <div className="relative flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${chip.color} bg-opacity-20`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors flex-1">
                        {chip.text}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Coaching Panel */}
      <AnimatePresence>
        {showCoaching && coaching && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-blue-500/10 backdrop-blur-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-blue-300 mb-2">💡 Coaching Tips</h4>
                <div className="text-sm text-blue-200 whitespace-pre-wrap">{coaching}</div>
              </div>
              <button
                onClick={() => setShowCoaching(false)}
                className="text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 bg-gradient-to-r from-[#0A0E27] to-[#1A1F3A] border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập câu phản đối của khách hàng..."
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm text-white placeholder-gray-400 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
