import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square } from 'lucide-react';
import type { AgentMessage } from '@/types/agent-chat-types';
import { useAgentChat } from '@/hooks/use-agent-chat';
import { TypingIndicator } from './typing-indicator';
import { ChatInput } from './chat-input-with-submit';
import { StreamingMessage } from './streaming-message-bubble';

interface AgentChatPanelProps {
  agentId: string;
  agentName: string;
  agentIcon?: React.ReactNode;
  systemPrompt?: string;
  className?: string;
}

export function AgentChatPanel({
  agentId,
  agentName,
  agentIcon,
  systemPrompt,
  className = '',
}: AgentChatPanelProps) {
  const { messages, input, setInput, handleSubmit, isLoading, error, stop } =
    useAgentChat({ agentId, systemPrompt });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const visibleMessages = messages.filter(
    (m): m is AgentMessage & { role: 'user' | 'assistant' } =>
      m.role === 'user' || m.role === 'assistant'
  );

  return (
    <div
      className={[
        'flex flex-col bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden',
        'h-[500px]',
        className,
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5 flex-shrink-0">
        {agentIcon && (
          <span className="text-emerald-400 flex-shrink-0">{agentIcon}</span>
        )}
        <span className="text-sm font-semibold text-white">{agentName}</span>
        <span
          className={[
            'ml-auto w-2 h-2 rounded-full',
            isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400',
          ].join(' ')}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <AnimatePresence initial={false}>
          {visibleMessages.length === 0 && !isLoading && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-600 text-xs mt-8"
            >
              Start a conversation with {agentName}
            </motion.p>
          )}

          {visibleMessages.map(msg => (
            <StreamingMessage
              key={msg.id}
              content={msg.content}
              role={msg.role}
              isStreaming={msg.isStreaming}
              timestamp={msg.timestamp}
              agentId={msg.agentId}
            />
          ))}
        </AnimatePresence>

        {isLoading && visibleMessages[visibleMessages.length - 1]?.role !== 'assistant' && (
          <TypingIndicator />
        )}

        {error && (
          <p className="text-xs text-red-400 px-4 py-2 bg-red-400/10 rounded-lg border border-red-400/20">
            {error.message}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Stop button */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="stop-btn"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex justify-center pb-1"
          >
            <button
              onClick={stop}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors duration-200"
            >
              <Square className="w-3 h-3" />
              Stop generating
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-white/10 flex-shrink-0">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={isLoading}
          placeholder={`Message ${agentName}...`}
        />
      </div>
    </div>
  );
}
