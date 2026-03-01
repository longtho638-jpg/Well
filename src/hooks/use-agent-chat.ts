/**
 * useAgentChat - Vercel AI SDK useChat-inspired hook for agent conversations.
 * Manages messages, SSE streaming, loading state, error, submit, abort, reload.
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { AgentMessage } from '@/types/agent-chat-types';

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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  onToken: (token: string) => void,
  signal: AbortSignal
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  try {
    while (true) {
      if (signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          try {
            const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
            const token =
              (parsed['content'] as string) ??
              (parsed['text'] as string) ??
              (parsed['delta'] as string) ??
              '';
            if (token) {
              fullContent += token;
              onToken(token);
            }
          } catch {
            // Non-JSON SSE line — skip
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullContent;
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

      const assistantId = generateId();
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

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ agentId, messages: history, systemPrompt }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Agent chat request failed: ${response.status} ${response.statusText}`);
        }

        let finalContent = '';

        if (response.body) {
          finalContent = await parseSSEStream(
            response.body,
            (token) => {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: m.content + token }
                    : m
                )
              );
            },
            controller.signal
          );
        } else {
          // Non-streaming fallback: parse JSON body
          const json = (await response.json()) as Record<string, unknown>;
          finalContent =
            (json['content'] as string) ??
            (json['message'] as string) ??
            (json['text'] as string) ??
            '';
        }

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
        id: generateId(),
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
        id: generateId(),
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
