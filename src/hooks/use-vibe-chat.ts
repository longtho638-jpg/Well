/**
 * useVibeChat - Vercel AI SDK useChat wrapper for Vibe Agent.
 *
 * This hook integrates Vercel AI's useChat with the Vibe Agent ecosystem,
 * allowing for standardized streaming, message management, and metrics.
 */

import { useChat } from 'ai/react';
import { agentRegistry } from '@/agents';
import { useTranslation } from '@/hooks';
import { useEffect, useMemo } from 'react';

export interface UseVibeChatOptions {
  agentId: string;
  initialMessages?: any[];
  onFinish?: (message: any) => void;
  onError?: (error: Error) => void;
}

export function useVibeChat(options: UseVibeChatOptions) {
  const { agentId, initialMessages, onFinish, onError } = options;
  const { t } = useTranslation();

  // Get agent definition from registry to use as system prompt or context
  const agent = useMemo(() => agentRegistry.get(agentId), [agentId]);

  const systemPrompt = useMemo(() => {
    if (!agent) return '';
    return `You are ${agent.definition.agent_name}, a specialized agent for ${agent.definition.business_function}.
Primary objectives: ${agent.definition.primary_objectives.join(', ')}.
Core actions: ${agent.definition.core_actions.join(', ')}.
Policy and constraints: ${agent.definition.policy_and_constraints.map(p => p.rule).join('; ')}.`;
  }, [agent]);

  const chat = useChat({
    api: '/api/chat', // Default Vercel AI SDK path, can be customized
    initialMessages,
    body: {
      agentId,
      system: systemPrompt,
    },
    onFinish,
    onError: (err) => {
      console.error(`[useVibeChat] Error in agent ${agentId}:`, err);
      onError?.(err);
    },
  });

  // Log agent activation
  useEffect(() => {
    if (agent) {
      console.log(`[useVibeChat] Activated ${agent.definition.agent_name}`);
    }
  }, [agent]);

  return {
    ...chat,
    agentName: agent?.definition.agent_name ?? t('common.unknown_agent'),
    agentFunction: agent?.definition.business_function,
  };
}
