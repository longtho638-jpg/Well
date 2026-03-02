/**
 * Agent Session Replay — Types (Highlight.io Session Replay Pattern)
 *
 * Extracted from agent-session-replay-highlight-pattern.ts.
 * Contains: ReplayEventType, ReplayEvent, ReplaySession, SessionSearchFilter.
 */

export type ReplayEventType = 'action' | 'error' | 'network' | 'state-change' | 'user-input' | 'agent-output';

/** Single recorded event in a session */
export interface ReplayEvent {
  id: string;
  type: ReplayEventType;
  timestamp: string;
  /** Agent that produced this event */
  agentName: string;
  /** Event description */
  action: string;
  /** Event payload */
  data: unknown;
  /** Duration in ms (for async actions) */
  durationMs?: number;
  /** Error info if type === 'error' */
  error?: { message: string; stack?: string };
}

/** A recorded session (highlight Session equivalent) */
export interface ReplaySession {
  sessionId: string;
  userId?: string;
  startedAt: string;
  endedAt: string | null;
  events: ReplayEvent[];
  /** Session metadata for search */
  metadata: Record<string, string>;
  /** Whether session has errors */
  hasErrors: boolean;
  /** Active agents in this session */
  activeAgents: string[];
}

/** Search filter for sessions */
export interface SessionSearchFilter {
  agentName?: string;
  userId?: string;
  hasErrors?: boolean;
  after?: string;
  before?: string;
  metadataKey?: string;
  metadataValue?: string;
}
