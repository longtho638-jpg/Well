/**
 * AgentChat - Generative UI Chat Component
 *
 * Demonstrates Vercel AI SDK integration with Vibe Agent.
 * Features: Streaming responses, specialized agent system prompts, and structured output handling.
 * AGI mode: optional ReAct reasoning chain + tool call visualization.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useVibeChat } from '@/hooks/use-vibe-chat';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@ai-sdk/react';
import { AgentReasoningView, type ReasoningStep } from './AgentReasoningView';
import { AgentToolCallCard, type ToolCallData } from './AgentToolCallCard';

interface AgentChatProps {
  agentId: string;
  isAgiMode?: boolean;
}

export const AgentChat: React.FC<AgentChatProps> = ({ agentId, isAgiMode = false }) => {
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    status,
    agentName,
    agentFunction
  } = useVibeChat({ agentId });

  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // AGI mode: demo reasoning steps (populated from agent stream in production)
  const [reasoningSteps] = useState<ReasoningStep[]>([]);

  // AGI mode: demo tool calls (populated from agent stream in production)
  const [activeToolCalls] = useState<ToolCallData[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
              {agentName}
              {isAgiMode && (
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-purple-500/30 border border-purple-400/40 rounded text-purple-200 italic">
                  AGI
                </span>
              )}
            </h3>
            <p className="text-xs opacity-80 uppercase tracking-wider font-semibold">{agentFunction}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium uppercase tracking-tight">Active</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40"
            >
              <Bot className="w-12 h-12" />
              <p className="text-sm">Start a conversation with {agentName}</p>
            </motion.div>
          )}
          {messages.map((message: Message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-purple-600 border border-purple-100'
                }`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {message.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {status === 'streaming' && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="flex space-x-3 items-center opacity-50">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              </div>
              <span className="text-xs italic">{t('common.loading')}</span>
            </div>
          </div>
        )}
      </div>

      {/* AGI: Tool calls + Reasoning chain */}
      {isAgiMode && (activeToolCalls.length > 0 || reasoningSteps.length > 0) && (
        <div className="px-4 pb-2 bg-gray-50/50 border-t border-gray-100">
          {activeToolCalls.map((tc, i) => (
            <AgentToolCallCard key={i} toolCall={tc} />
          ))}
          <AgentReasoningView steps={reasoningSteps} />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white border-t border-gray-100 flex items-center space-x-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${agentName}...`}
          className="flex-1 px-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || status === 'streaming'}
          className="p-2.5 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
