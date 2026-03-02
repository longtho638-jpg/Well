/** useAgentChat — hook for agent SSE streaming conversations. */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { AgentMessage } from '@/types/agent-chat-types';
import {
  fetchAgentChatContent,
  generateMessageId,
  nowIso,
} from './use-agent-chat-sse-stream-parser';

export type { AgentMessage };

interface UseAgentChatOptions {
  agentId: string;
  systemPrompt?: string;
  initialMessages?: AgentMessage[];
  onFinish?: (message: AgentMessage) => void;
  onError?: (error: Error) => void;
}

interface UseAgentChatReturn {
  messages: AgentMessage[];
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: { preventDefault: () => void }) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  stop: () => void;
  reload: () => Promise<void>;
  clearMessages: () => void;
  append: (message: Omit<AgentMessage, 'id' | 'timestamp'>) => void;
}

export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
  const { agentId, systemPrompt, initialMessages = [], onFinish, onError } = options;

  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<AgentMessage | null>(null);

  const sendMessages = useCallback(
    async (history: AgentMessage[]) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      const assistantId = generateMessageId();
      const assistantPlaceholder: AgentMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        agentId,
        timestamp: nowIso(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantPlaceholder]);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token ?? '';

        const finalContent = await fetchAgentChatContent({
          agentId,
          systemPrompt,
          history,
          controller,
          accessToken,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
          onToken: (token) => {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + token } : m
              )
            );
          },
        });

        const finishedMessage: AgentMessage = {
          id: assistantId,
          role: 'assistant',
          content: finalContent,
          agentId,
          timestamp: nowIso(),
          isStreaming: false,
        };

        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? finishedMessage : m))
        );

        onFinish?.(finishedMessage);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // User stopped — mark streaming done, keep partial content
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            )
          );
          return;
        }

        const typedError = err instanceof Error ? err : new Error(String(err));
        setError(typedError);
        onError?.(typedError);

        // Remove placeholder on hard error
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [agentId, systemPrompt, onFinish, onError]
  );

  const handleSubmit = useCallback(
    async (e?: { preventDefault: () => void }) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      const userMessage: AgentMessage = {
        id: generateMessageId(),
        role: 'user',
        content: trimmed,
        agentId,
        timestamp: nowIso(),
      };

      lastUserMessageRef.current = userMessage;
      setInput('');

      const nextHistory = [...messages, userMessage];
      setMessages(nextHistory);

      await sendMessages(nextHistory);
    },
    [input, isLoading, agentId, messages, sendMessages]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const reload = useCallback(async () => {
    if (!lastUserMessageRef.current || isLoading) return;

    // Strip the last assistant message if present, re-send
    const lastAssistantIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
    const history =
      lastAssistantIdx !== -1
        ? messages.slice(0, messages.length - 1 - lastAssistantIdx + 1).filter(
            m => m.role !== 'assistant' || m.id !== messages[messages.length - 1 - lastAssistantIdx]?.id
          )
        : messages;

    await sendMessages(history);
  }, [isLoading, messages, sendMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    lastUserMessageRef.current = null;
  }, []);

  const append = useCallback(
    (message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
      const full: AgentMessage = {
        ...message,
        id: generateMessageId(),
        timestamp: nowIso(),
      };
      setMessages(prev => [...prev, full]);
    },
    []
  );

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
    clearMessages,
    append,
  };
}
