/**
 * WellNexus Health Coach (Max Level)
 * 
 * Production-ready AI Health Consultation Interface.
 * Refactored into a modular architecture for better performance and maintainability.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Stethoscope, Send, Bot } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useHealthCoach } from '@/hooks/useHealthCoach';

// Modular Components
import { ChatSidebar } from '@/components/health/ChatSidebar';
import { ContextSidebar } from '@/components/health/ContextSidebar';
import { ChatMessage } from '@/components/health/ChatMessage';

export default function HealthCoach() {
  const { t } = useTranslation();
  const {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    selectedHistory,
    setSelectedHistory,
    messagesEndRef,
    handleSendMessage,
    handleQuickOrder
  } = useHealthCoach();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 flex overflow-hidden">
      {/* Left Column: Chat History */}
      <ChatSidebar
        selectedId={selectedHistory}
        onSelect={setSelectedHistory}
      />

      {/* Center Column: Main Chat Interface */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-8 py-6 shadow-lg z-10"
        >
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                boxShadow: isTyping
                  ? ['0 0 0 0 rgba(0, 87, 90, 0.4)', '0 0 0 15px rgba(0, 87, 90, 0)']
                  : '0 0 0 0 rgba(0, 87, 90, 0)'
              }}
              transition={{ duration: 1.5, repeat: isTyping ? Infinity : 0 }}
              className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-xl border border-zinc-200 dark:border-zinc-700"
            >
              <Stethoscope className="w-8 h-8 text-[#00575A] dark:text-teal-400" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {t('healthCoach.title')}
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                {isTyping ? 'Đang phân tích và tư vấn...' : t('healthCoach.subtitle')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50 dark:bg-zinc-950/50">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                index={index}
                onQuickOrder={handleQuickOrder}
              />
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
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-700">
                <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="bg-white dark:bg-zinc-900 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-2">
                  {[0, 0.2, 0.4].map((delay) => (
                    <motion.div
                      key={delay}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay }}
                      className="w-2.5 h-2.5 bg-emerald-500/60 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/80 backdrop-blur-xl z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('healthCoach.placeholder')}
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 focus:border-[#00575A] focus:outline-none transition-all duration-300 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm placeholder-zinc-400 dark:placeholder-zinc-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-[#00575A] to-teal-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
              >
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                {t('healthCoach.send')}
              </motion.button>
            </div>

            {/* Quick Suggestions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-500 w-full mb-1 font-semibold">
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
                  className="text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 px-4 py-2 rounded-full hover:bg-[#00575A] hover:text-white hover:border-[#00575A] transition-all duration-200 shadow-sm"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Patient Context */}
      <ContextSidebar />
    </div>
  );
}
