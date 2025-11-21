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
  Check
} from 'lucide-react';
import { generateCopilotResponse, generateSalesScript, getCopilotCoaching } from '@/services/copilotService';
import { CopilotMessage, ObjectionType } from '@/types';

interface TheCopilotProps {
  productContext?: string;
  userName?: string;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
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
        userMessage.content,
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
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              The Copilot
              <Sparkles className="w-4 h-4 text-accent" />
            </h3>
            <p className="text-xs text-white/80">AI Sales Assistant</p>
          </div>
        </div>

        <div className="flex gap-2">
          {productContext && (
            <button
              onClick={handleGenerateScript}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg flex items-center gap-1 transition-colors"
              title="Generate sales script"
            >
              <MessageSquare className="w-3 h-3" />
              Script
            </button>
          )}
          <button
            onClick={handleGetCoaching}
            disabled={isLoading || messages.length < 3}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
            title="Get coaching tips"
          >
            <TrendingUp className="w-3 h-3" />
            Coach
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {/* Objection badge for user messages */}
                {message.role === 'user' && message.objectionType && (
                  <div className="mb-2">
                    {getObjectionBadge(message.objectionType)}
                  </div>
                )}

                {/* Message content */}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>

                {/* Suggested response for assistant messages */}
                {message.role === 'assistant' && message.suggestion && message.objectionType !== 'general' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2 text-xs">
                      <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-500 mb-1 font-medium">Gợi ý nhanh:</p>
                        <p className="text-gray-700 italic">{message.suggestion}</p>
                      </div>
                      <button
                        onClick={() => copySuggestion(message.suggestion!, message.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy suggestion"
                      >
                        {copiedSuggestion === message.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
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

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
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
            className="border-t border-gray-200 bg-blue-50 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-blue-900 mb-2">💡 Coaching Tips</h4>
                <div className="text-sm text-blue-800 whitespace-pre-wrap">{coaching}</div>
              </div>
              <button
                onClick={() => setShowCoaching(false)}
                className="text-blue-400 hover:text-blue-600 text-xs"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập câu phản đối của khách hàng..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
