/**
 * SSE stream parser for agent chat responses.
 * Reads a ReadableStream of Uint8Array, decodes SSE data events,
 * and accumulates the full content string while calling onToken per token.
 */

export async function parseSSEStream(
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

export interface AgentChatOptions {
  agentId: string;
  systemPrompt?: string;
  initialMessages?: import('@/types/agent-chat-types').AgentMessage[];
  onFinish?: (message: import('@/types/agent-chat-types').AgentMessage) => void;
  onError?: (error: Error) => void;
}

/**
 * Fetch agent chat endpoint and stream/return full content string.
 * Accepts accessToken and supabaseUrl to avoid coupling to supabase singleton.
 */
export async function fetchAgentChatContent(params: {
  agentId: string;
  systemPrompt?: string;
  history: import('@/types/agent-chat-types').AgentMessage[];
  controller: AbortController;
  accessToken: string;
  supabaseUrl: string;
  onToken: (token: string) => void;
}): Promise<string> {
  const { agentId, systemPrompt, history, controller, accessToken, supabaseUrl, onToken } = params;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/agent-chat`,
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

  if (response.body) {
    return parseSSEStream(response.body, onToken, controller.signal);
  }

  // Non-streaming fallback
  const json = (await response.json()) as Record<string, unknown>;
  return (
    (json['content'] as string) ??
    (json['message'] as string) ??
    (json['text'] as string) ??
    ''
  );
}

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
