/**
 * Agent Session Replay — Highlight.io Session Replay Pattern
 *
 * Maps highlight/highlight's session replay + error tracking to
 * agent execution replay. Records agent actions for debugging & audit.
 *
 * Highlight concepts mapped:
 * - Session: a user/agent interaction session with timeline
 * - Event: timestamped action within a session
 * - ErrorTracking: structured error capture with session context
 * - NetworkRecording: API call recording for replay
 * - SessionSearch: search across recorded sessions
 *
 * Pattern source: highlight/highlight sdk-js session recording
 */

// ─── Types ──────────────────────────────────────────────────

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

// ─── Session Recorder ───────────────────────────────────────

/**
 * Singleton session recorder for agent execution replay.
 * Mirrors highlight.io's H.init() + H.track() pattern.
 */
class AgentSessionReplay {
  private sessions = new Map<string, ReplaySession>();
  private activeSessionId: string | null = null;
  private maxSessions = 50;
  private eventCounter = 0;

  /** Start a new recording session */
  startSession(userId?: string, metadata?: Record<string, string>): string {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.sessions.set(sessionId, {
      sessionId,
      userId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      events: [],
      metadata: metadata ?? {},
      hasErrors: false,
      activeAgents: [],
    });

    this.activeSessionId = sessionId;
    this.enforceLimit();
    return sessionId;
  }

  /** End the current or specified session */
  endSession(sessionId?: string): void {
    const id = sessionId ?? this.activeSessionId;
    if (!id) return;
    const session = this.sessions.get(id);
    if (session) session.endedAt = new Date().toISOString();
    if (id === this.activeSessionId) this.activeSessionId = null;
  }

  /** Record an event in the active session (highlight H.track equivalent) */
  track(type: ReplayEventType, agentName: string, action: string, data?: unknown, durationMs?: number): ReplayEvent | null {
    const session = this.getActiveSession();
    if (!session) return null;

    const event: ReplayEvent = {
      id: `evt_${++this.eventCounter}`,
      type,
      timestamp: new Date().toISOString(),
      agentName,
      action,
      data: data ?? null,
      durationMs,
    };

    session.events.push(event);
    if (!session.activeAgents.includes(agentName)) {
      session.activeAgents.push(agentName);
    }

    return event;
  }

  /** Record an error (highlight H.consumeError equivalent) */
  trackError(agentName: string, error: Error | string, context?: unknown): ReplayEvent | null {
    const session = this.getActiveSession();
    if (!session) return null;

    const errorObj = error instanceof Error ? error : new Error(String(error));
    const event: ReplayEvent = {
      id: `evt_${++this.eventCounter}`,
      type: 'error',
      timestamp: new Date().toISOString(),
      agentName,
      action: 'error',
      data: context ?? null,
      error: { message: errorObj.message, stack: errorObj.stack },
    };

    session.events.push(event);
    session.hasErrors = true;
    if (!session.activeAgents.includes(agentName)) {
      session.activeAgents.push(agentName);
    }

    return event;
  }

  /** Get session by ID */
  getSession(sessionId: string): ReplaySession | undefined {
    return this.sessions.get(sessionId);
  }

  /** Get the active session */
  getActiveSession(): ReplaySession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) ?? null;
  }

  /** Search sessions with filters */
  search(filter: SessionSearchFilter): ReplaySession[] {
    return Array.from(this.sessions.values()).filter((s) => {
      if (filter.agentName && !s.activeAgents.includes(filter.agentName)) return false;
      if (filter.userId && s.userId !== filter.userId) return false;
      if (filter.hasErrors !== undefined && s.hasErrors !== filter.hasErrors) return false;
      if (filter.after && s.startedAt < filter.after) return false;
      if (filter.before && s.startedAt > filter.before) return false;
      if (filter.metadataKey && s.metadata[filter.metadataKey] !== filter.metadataValue) return false;
      return true;
    });
  }

  /** Get session timeline (events sorted by time) */
  getTimeline(sessionId: string): ReplayEvent[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return [...session.events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /** Get error sessions only */
  getErrorSessions(): ReplaySession[] {
    return Array.from(this.sessions.values()).filter((s) => s.hasErrors);
  }

  /** Get stats */
  getStats(): { totalSessions: number; activeSessions: number; errorSessions: number; totalEvents: number } {
    const sessions = Array.from(this.sessions.values());
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => !s.endedAt).length,
      errorSessions: sessions.filter((s) => s.hasErrors).length,
      totalEvents: sessions.reduce((sum, s) => sum + s.events.length, 0),
    };
  }

  /** Clear all sessions */
  clear(): void {
    this.sessions.clear();
    this.activeSessionId = null;
    this.eventCounter = 0;
  }

  private enforceLimit(): void {
    if (this.sessions.size <= this.maxSessions) return;
    const oldest = Array.from(this.sessions.keys())[0];
    if (oldest) this.sessions.delete(oldest);
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentSessionReplay = new AgentSessionReplay();
