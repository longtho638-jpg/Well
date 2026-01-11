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
import { useAgentOS } from '@/hooks/useAgentOS';
import { generateSalesScript, getCopilotCoaching } from '@/services/copilotService';
import { CopilotMessage, ObjectionType } from '@/types';
import { useToast } from '@/components/ui/Toast';

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
  const { executeAgent } = useAgentOS();
  const { showToast } = useToast();
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
      // Agent-OS Integration
      // 1. Detect objection type
      const objectionType = await executeAgent('Sales Copilot', {
        action: 'detectObjection',
        message: messageText
      });

      // 2. Get suggested response
      const response = await executeAgent('Sales Copilot', {
        action: 'suggestResponse',
        message: messageText
      });

      const assistantMessage: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: (response as { message?: string })?.message || String(response) || 'Response received',
        timestamp: new Date().toISOString(),
        objectionType: (objectionType as { type?: ObjectionType })?.type as ObjectionType,
        suggestion: (response as { message?: string })?.message || String(response)
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
      showToast('Failed to process message', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!productContext) return;

    setIsLoading(true);
    try {
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
      showToast('Sales script generated', 'success');
    } catch (error) {
      showToast('Failed to generate script', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCoaching = async () => {
    setIsLoading(true);
    setShowCoaching(true);

    try {
      const conversationHistory = messages
        .filter(m => m.role !== 'assistant' || !m.content.includes('Xin chào'))
        .map(m => ({ role: m.role, content: m.content }));

      const tips = await getCopilotCoaching(conversationHistory);
      setCoaching(tips);
      showToast('Coaching tips ready', 'success');
    } catch (error) {
      showToast('Failed to get coaching', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copySuggestion = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuggestion(messageId);
    setTimeout(() => setCopiedSuggestion(null), 2000);
    showToast('Copied to clipboard', 'success');
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
    <div className="flex flex-col h-[600px] bg-zinc-50 dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-zinc-900 to-black" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

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
                className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-700"
              >
                <Bot className="w-7 h-7 text-emerald-400" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-md -z-10"
              />
            </div>

            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-lg">
                The Copilot
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </motion.div>
              </h3>
              <p className="text-xs text-zinc-400">AI Sales Assistant • Powered by Gemini</p>
            </div>
          </div>

          <div className="flex gap-2">
            {productContext && (
              <button
                onClick={handleGenerateScript}
                disabled={isLoading}
                className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50"
                title="Generate sales script"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Script
              </button>
            )}
            <button
              onClick={handleGetCoaching}
              disabled={isLoading || messages.length < 3}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-zinc-700 hover:border-zinc-600 disabled:opacity-50"
              title="Get coaching tips"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Coach
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm'}`}
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
                          <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>

                    {/* Loading Indicator */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start mt-2"
                      >
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3">
                          <div className="flex gap-2">
                            <motion.div
                              className="w-2 h-2 bg-emerald-500 rounded-full"
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
                        className="space-y-2 mt-3"
                      >
                        <p className="text-zinc-400 text-xs font-medium">💡 Gợi ý câu hỏi:</p>
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
                                className="relative group overflow-hidden rounded-xl p-3 text-left transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
                              >
                                <div className={`absolute inset-0 bg-gradient-to-br ${chip.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
                                    Gợi ý {index + 1}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors line-clamp-2">
                                  {chip.text}
                                </p>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>

      {/* Coaching Panel */}
      <AnimatePresence>
        {showCoaching && coaching && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-800 bg-blue-500/10 backdrop-blur-xl p-4"
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
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập câu phản đối của khách hàng..."
            className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
