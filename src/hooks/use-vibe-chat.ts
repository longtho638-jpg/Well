/**
 * useVibeChat - Vercel AI SDK useChat wrapper for Vibe Agent.
 *
 * Integrates Vercel AI's useChat with the Vibe Agent ecosystem
 * for standardized streaming, message management, and metrics.
 */

import { useChat, type Message } from '@ai-sdk/react';
import { agentRegistry } from '@/agents';
import { useTranslation } from '@/hooks';
import { useEffect, useMemo } from 'react';

export interface UseVibeChatOptions {
  agentId: string;
  initialMessages?: Message[];
  onFinish?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export function useVibeChat(options: UseVibeChatOptions) {
  const { agentId, initialMessages, onFinish, onError } = options;
  const { t } = useTranslation();

  const agent = useMemo(() => agentRegistry.get(agentId), [agentId]);

  const systemPrompt = useMemo(() => {
    if (!agent) return '';
    return `You are ${agent.definition.agent_name}, a specialized agent for ${agent.definition.business_function}.
Primary objectives: ${agent.definition.primary_objectives.join(', ')}.
Core actions: ${agent.definition.core_actions.join(', ')}.
Policy and constraints: ${agent.definition.policy_and_constraints.map(p => p.rule).join('; ')}.`;
  }, [agent]);

  const chat = useChat({
    api: '/api/chat',
    initialMessages,
    body: {
      agentId,
      system: systemPrompt,
    },
    onFinish: onFinish ? (message: Message) => onFinish(message) : undefined,
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  useEffect(() => {
    if (agent) {
      // Agent activated — no-op in production
    }
  }, [agent]);

  return {
    ...chat,
    agentName: agent?.definition.agent_name ?? t('common.unknown_agent'),
    agentFunction: agent?.definition.business_function,
  };
}
