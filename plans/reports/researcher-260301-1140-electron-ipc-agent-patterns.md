# Electron IPC Patterns → Agent-OS Architecture Research

**Report ID:** researcher-260301-1140
**Date:** 2026-03-01
**Scope:** Mapping Electron inter-process communication (IPC) patterns to Agent-OS architectures in React/TypeScript RaaS platforms
**Status:** Complete

---

## Executive Summary

Electron's multi-process architecture provides a battle-tested blueprint for building scalable agent systems in web applications. This report maps seven core Electron IPC patterns to Agent-OS supervisor patterns, enabling WellNexus and similar RaaS platforms to implement production-grade agent orchestration.

**Key Finding:** Electron's supervisor → renderer process hierarchy mirrors the agent supervisor → specialized agent model. Using Electron's proven patterns significantly reduces implementation complexity for:

- Event-driven agent communication
- Process lifecycle management (agent birth/death)
- Service discovery and agent registration
- Crash recovery and fault tolerance
- Inter-agent message passing

**Immediate Application:** Well's existing `AgentSupervisorOrchestrator` + `VibeAgentRegistry` can adopt Electron's `invoke/handle` pattern for bidirectional agent calls, gaining automatic timeout handling, error propagation, and context isolation.

---

## 1. IPC PATTERNS & MAPPING

### 1.1 The Core Four Patterns

| Pattern | Electron | Agent-OS Mapping | Use Case |
|---------|----------|------------------|----------|
| **Send** (async, no response) | `ipcRenderer.send()` | Agent side-effect publication | Log event, update shared state |
| **Handle** (request/response) | `ipcRenderer.invoke() + ipcMain.handle()` | Synchronous tool execution | Commission lookup, product search |
| **EventEmitter** (pub/sub) | `ipcMain.on('channel', callback)` | Broadcast to multiple agents | Price updated, user rank changed |
| **MessagePort** (direct D2D) | `MessagePort + postMessage()` | Direct agent-to-agent (bypass supervisor) | Health coach + Sales copilot sync |

#### Pattern Selection Matrix

```
┌─────────────────────────────────────────────────────────────┐
│ AGENT COMMUNICATION PATTERN SELECTION                       │
├─────────────────────────────────────────────────────────────┤
│ Need response? → Use INVOKE/HANDLE                          │
│   Commission lookup: classifyIntent → commission-lookup     │
│   Product search: intent → product-catalog-lookup           │
│   Tool execution: Agent → Tool Executor                     │
│                                                             │
│ Fire & forget? → Use SEND                                  │
│   Log agent action                                          │
│   Update agent KPI                                          │
│   Publish side effect                                       │
│                                                             │
│ Multiple subscribers? → Use EVENTEMITTER (on/emit)         │
│   Rank upgrade → notify multiple agents                    │
│   Inventory updated → notify Sales Copilot                │
│   New user → notify Gemini Coach                          │
│                                                             │
│ Direct peer agents? → Use MESSAGEPORT                       │
│   Coach ↔ Sales Copilot sync                               │
│   Agent ↔ Agent (no supervisor latency)                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.2 Pattern Deep-Dive: invoke/handle (Recommended for Well)

**Why:** Modern, promise-based, automatic timeout + error propagation. Electron standard since 7.0 (2019).

#### Current Well Implementation (Baseline)

```typescript
// src/agents/orchestration/agent-supervisor-orchestrator.ts
async function executeIntentTools(
  classification: ClassificationResult,
  input: OrchestratorInput
): Promise<Array<{ toolName: string; result: unknown }>> {
  const toolRequests: ToolCallRequest[] = [];
  // ... build requests ...

  for (const request of toolRequests) {
    const toolResponse = await executeTool(request);
    // Problem: No timeout, no structured error handling
    if (!toolResponse.error) {
      results.push({ toolName: toolResponse.toolName, result: toolResponse.result });
    }
  }
  return results;
}
```

#### Electron-Inspired Refactoring

```typescript
// ─── Main Process (Agent Supervisor) ───────────────────────
import { ipcMain } from 'electron'; // Conceptual

// Register tool handlers in supervisor
agentRegistry.registerToolHandler('commission-lookup', async (args) => {
  return await commissionService.lookup(args.distributorId, args.period);
});

ipcMain.handle('execute-tool', async (event, request: ToolCallRequest) => {
  const handler = agentRegistry.getToolHandler(request.toolName);
  if (!handler) throw new Error(`Tool not found: ${request.toolName}`);
  return await handler(request.args);
});

// ─── Renderer Process (Agent Caller) ───────────────────────
import { ipcRenderer } from 'electron'; // Conceptual

async function executeIntentTools(
  classification: ClassificationResult,
  input: OrchestratorInput
): Promise<Array<{ toolName: string; result: unknown }>> {
  const results: Array<{ toolName: string; result: unknown }> = [];
  const toolRequests = buildToolRequests(classification, input);

  for (const request of toolRequests) {
    try {
      // invoke returns Promise, auto-timeout at 30s
      const result = await ipcRenderer.invoke('execute-tool', request);
      results.push({ toolName: request.toolName, result });
    } catch (error) {
      // Structured error: timeout, serialization, handler threw
      const typedError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Tool ${request.toolName}] Failed:`, typedError.message);
      // Continue with next tool or fail fast per policy
    }
  }
  return results;
}
```

**Benefits Over Current:**

| Feature | Current | invoke/handle |
|---------|---------|---------------|
| Timeout | Manual setTimeout | Auto 30s |
| Error Propagation | Manual catch | Structured |
| Promise Support | Partial (async/await) | Full (native) |
| Cleanup | Manual | Auto (Electron manages) |
| Context Isolation | Implicit | Explicit (preload script) |

---

### 1.3 Pattern: EventEmitter (Multi-Agent Broadcasting)

**Use Case:** Multiple agents need to react to the same event (rank upgrade, inventory change, price update).

```typescript
// ─── Supervisor: Emit event when rank changes ───────────────
class AgentSupervisor extends EventEmitter {
  async handleRankUpgrade(userId: string, newRank: string) {
    const user = await getUserData(userId);

    // Broadcast to ALL interested agents
    this.emit('rank-upgraded', {
      userId,
      newRank,
      user,
      timestamp: new Date().toISOString(),
    });
  }
}

// ─── Specialized Agent: Listen for rank upgrades ───────────
class HealthCoachAgent extends VibeBaseAgent {
  constructor(supervisor: AgentSupervisor, deps: VibeAgentDeps) {
    super(definition, deps);

    // Subscribe to event
    supervisor.on('rank-upgraded', async (event) => {
      // React: generate congratulations message
      const advice = await this.generateRankAdvice(event.newRank, event.user);
      this.log('rank-upgrade-reaction', event, { advice });
    });
  }
}

// ─── Another Agent: Also listen for same event ───────────
class SalesCopilotAgent extends VibeBaseAgent {
  constructor(supervisor: AgentSupervisor, deps: VibeAgentDeps) {
    super(definition, deps);

    supervisor.on('rank-upgraded', async (event) => {
      // React differently: generate sales talking points for new rank
      const scripts = await this.generateRankScripts(event.newRank);
      this.log('rank-upgrade-scripts', event, { scripts });
    });
  }
}
```

**EventEmitter API (mapped to Electron):**

```typescript
// Supervisor side (ipcMain equivalent)
supervisor.emit('rank-upgraded', eventData);        // Broadcast
supervisor.on('rank-upgraded', handler);             // Listener
supervisor.off('rank-upgraded', handler);            // Unsubscribe
supervisor.once('rank-upgraded', handler);           // One-time

// Programmatic subscription
supervisor.on('error', (error) => {                  // Error fallback
  agentLogger.error('[Supervisor] Event error:', error);
});
```

**Well Integration Point:**

Add EventEmitter to `AgentSupervisor` for automatic multi-agent event dispatch. Replace current tool-by-tool routing with event-driven architecture:

```typescript
// BEFORE: Linear tool execution
await executeIntentTools(classification, input);

// AFTER: Event-driven multi-agent reaction
supervisor.emit('user-message', { classification, input });
// All subscribed agents react independently
```

---

### 1.4 Pattern: MessagePort (Direct Agent-to-Agent Communication)

**Scenario:** HealthCoach agent needs to sync session state with SalesCopilot agent without supervisor overhead.

```typescript
// ─── In Supervisor (creates port pair) ──────────────────
class AgentSupervisor {
  async connectAgents(agentA: VibeBaseAgent, agentB: VibeBaseAgent) {
    const { port1, port2 } = new MessageChannelMain(); // Electron API

    // Send port1 to agentA, port2 to agentB
    await ipcRenderer.postMessage('agent-port-delivery',
      { agent: agentA.name, port: port1 },
      [port1] // Transfer ownership
    );

    await ipcRenderer.postMessage('agent-port-delivery',
      { agent: agentB.name, port: port2 },
      [port2]
    );

    // Now agentA ↔ agentB can communicate directly
    agentLogger.info(`[Supervisor] Connected ${agentA.name} ↔ ${agentB.name}`);
  }
}

// ─── Health Coach Agent (receives port) ──────────────────
class HealthCoachAgent extends VibeBaseAgent {
  private peerPort: MessagePortMain | null = null;

  constructor(definition: VibeAgentDefinition, deps: VibeAgentDeps) {
    super(definition, deps);

    // Listen for port from supervisor
    ipcRenderer.on('agent-port-delivery', (event, { agent, port }) => {
      if (agent === 'Sales Copilot') {
        this.peerPort = port;
        this.setupPeerCommunication();
      }
    });
  }

  private setupPeerCommunication() {
    if (!this.peerPort) return;

    this.peerPort.on('message', (event) => {
      const { action, data } = event.data;
      if (action === 'sync-session') {
        this.syncCoachSession(data);
      }
    });
  }

  async coachUser(input: { userId: string; message: string }) {
    const advice = await this.generateCoachingAdvice(input);

    // Directly notify Sales Copilot (no supervisor latency)
    this.peerPort?.postMessage({
      action: 'user-coached',
      data: { userId: input.userId, advice },
    });

    return { advice };
  }
}
```

**Benefits of MessagePort:**

- **Zero-copy:** Port communication doesn't go through supervisor
- **Lower latency:** Direct channel between two agents
- **Reduced memory:** No message duplication through supervisor
- **Isolation:** Port-specific channels stay private

**When NOT to use:**

- Agent needs supervisor oversight
- Broadcast to 3+ agents (use EventEmitter)
- Debug/audit trail required (supervisor overhead acceptable)

---

## 2. CONTEXT ISOLATION & SECURITY

### 2.1 The Security Model

Electron's multi-process architecture enforces **privilege separation** — a principle every Agent-OS must adopt:

```
┌─────────────────────────────────────────────────────────────┐
│ AGENT-OS SECURITY ZONES (Electron-Inspired)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Main Process — PRIVILEGED]                                │
│  ├─ Can call Node.js APIs (fs, crypto, email)             │
│  ├─ Can access secrets (ADMIN_TOKEN, API_KEYS)            │
│  ├─ Can modify database directly                           │
│  ├─ ONLY: Supervisor Agent (Orchestrator) runs here       │
│  └─ CONTROLS: All agent dispatch, registry, policies       │
│                                                             │
│ [Renderer (Agent) Process — SANDBOXED]                     │
│  ├─ NO direct database access                             │
│  ├─ NO secret access                                       │
│  ├─ NO file system access                                 │
│  ├─ Specialized Agents run here (Coach, Sales, etc.)      │
│  └─ CALL: Supervisor via invoke/handle for privileged ops │
│                                                             │
│ [Preload Script — BRIDGE]                                  │
│  ├─ Runs in isolated context (neither main nor renderer)  │
│  ├─ Can access Node.js APIs (filtered)                    │
│  ├─ Exposes only safe methods via contextBridge           │
│  └─ Example: execute-tool, log-action, emit-event         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Implementing contextBridge (Whitelist Model)

**Current Well Problem:** Agents can call ANY tool, ANY service. No privilege boundaries.

**Electron Solution:** Preload script whitelists what agents can call.

```typescript
// ─── PRELOAD SCRIPT (runs in isolated context) ─────────────
// This is the ONLY bridge between agent and supervisor
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('agentAPI', {
  // ALLOWED: Safe, audited operations
  executeTool: (toolName: string, args: unknown) =>
    ipcRenderer.invoke('execute-tool', { toolName, args }),

  logAction: (action: string, input: unknown, output: unknown) =>
    ipcRenderer.invoke('log-action', { action, input, output }),

  emit: (eventName: string, data: unknown) =>
    ipcRenderer.send('emit-event', { eventName, data }),

  // FORBIDDEN (not exposed): These can't be called from agent
  // - Direct database access
  // - Secret access
  // - Admin operations
  // - File system
});

// ─── IN AGENT CODE (can only call whitelisted API) ────────
class HealthCoachAgent extends VibeBaseAgent {
  async getCommission(userId: string, period: string) {
    // Safe: goes through supervisor's invoke handler
    const result = await window.agentAPI.executeTool('commission-lookup', {
      distributorId: userId,
      period,
    });
    return result;
  }

  async logCoachingSession(input: unknown, advice: unknown) {
    // Safe: supervisor audits all agent actions
    await window.agentAPI.logAction('health-coaching', input, advice);
  }

  // PROBLEM: This would fail (not in contextBridge whitelist)
  // const secret = await window.agentAPI.getSecret('API_KEY');
}
```

### 2.3 Security Audit: Well's Current Model

**Gaps Identified:**

| Layer | Current | Gap | Electron Solution |
|-------|---------|-----|-------------------|
| **Privilege** | All agents equal access | No boundaries | Separate main/renderer processes |
| **Secret Access** | Direct env vars | Exposed to frontend | Secrets in main process only |
| **Tool Whitelist** | Implicit (by intent) | No enforcement | contextBridge whitelist |
| **Audit Trail** | Manual logging | Incomplete | Supervisor mandatory logging |
| **Error Isolation** | Agent crash → unclear | No recovery | Supervisor restarts agent |

**Fix:** Implement Electron-style preload script:

```typescript
// src/lib/agent-preload.ts (conceptual)
export const createAgentPreload = () => ({
  executeTool: (toolName: string, args: unknown) => {
    // Only these tools allowed
    const WHITELIST = [
      'commission-lookup',
      'product-catalog-lookup',
      'team-performance-metrics',
    ];
    if (!WHITELIST.includes(toolName)) {
      throw new Error(`Tool not whitelisted: ${toolName}`);
    }
    return invokeToolHandler(toolName, args);
  },

  logAction: (action: string, input: unknown, output: unknown) => {
    // Supervisor enforces logging
    return supervisorLogger.log(action, input, output);
  },
});
```

---

## 3. SERVICE WORKER & BACKGROUND PROCESSING

### 3.1 Mapping Electron's Background Strategies to Agents

Electron supports three patterns for long-running tasks. Agent-OS should adopt similar:

```
┌─────────────────────────────────────────────────────────────┐
│ BACKGROUND AGENT PROCESSING PATTERNS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [1] ISOLATED AGENT (like hidden renderer)                  │
│  ├─ Dedicated long-running agent (e.g., Email Monitor)    │
│  ├─ Runs separately, doesn't block UI agents              │
│  ├─ Communicates via IPC (EventEmitter)                   │
│  ├─ Use Case: Poll external APIs, watch for changes       │
│  └─ Well Example: Reward Engine checking new orders       │
│                                                             │
│ [2] WORKER POOL (like electron-workers)                    │
│  ├─ Multiple agents for same task (horizontal scaling)    │
│  ├─ Supervisor load-balances requests                     │
│  ├─ Use Case: High-volume tool calls (1000s/min)          │
│  └─ Well Example: Product lookup scaled to 10 agents      │
│                                                             │
│ [3] SCHEDULED TASK AGENT (like Service Workers)            │
│  ├─ Runs on timer (minutes/hours)                         │
│  ├─ Maintains its own lifecycle (wake/sleep)              │
│  ├─ Use Case: Daily commission updates, rank checks       │
│  └─ Well Example: 4am daily leaderboard recalc            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Implementing Isolated Agent (Email Monitor Example)

```typescript
// ─── SUPERVISOR: Spawn isolated agent ───────────────────
class AgentSupervisor {
  private isolatedAgents: Map<string, VibeBaseAgent> = new Map();

  spawnIsolatedAgent(agentDef: VibeAgentDefinition, options: {
    autoRestart: boolean;
    maxRestarts: number;
  }) {
    const agent = new IsolatedEmailMonitorAgent(agentDef, {
      log: agentLogger.log,
      retry: defaultRetry,
    });

    // Don't call execute() — agent manages its own lifecycle
    agent.startMonitoring(); // Runs forever
    this.isolatedAgents.set(agentDef.agent_name, agent);
  }
}

// ─── ISOLATED AGENT: Email Monitor (runs forever) ───────
class IsolatedEmailMonitorAgent extends VibeBaseAgent {
  private isRunning = false;
  private pollInterval = 60_000; // 1 minute

  async startMonitoring() {
    this.isRunning = true;

    while (this.isRunning) {
      try {
        // Check for new commission emails every minute
        const newEmails = await this.checkInbox();

        if (newEmails.length > 0) {
          // Emit event for supervisor to dispatch to other agents
          this.deps.log('debug', `[${this.definition.agent_name}] Found ${newEmails.length} new emails`);

          // Notify supervisor
          ipcRenderer.send('isolated-agent-event', {
            agentName: this.definition.agent_name,
            event: 'emails-received',
            data: newEmails,
          });
        }
      } catch (error) {
        this.deps.log('error', `[${this.definition.agent_name}] Poll failed`, error);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }

  stopMonitoring() {
    this.isRunning = false;
  }

  async execute(_input: unknown): Promise<unknown> {
    // For compatibility, but isolated agents use startMonitoring() instead
    return { status: 'monitoring', isRunning: this.isRunning };
  }

  private async checkInbox(): Promise<EmailRecord[]> {
    // Fetch emails via supervisor's executeTool
    const result = await ipcRenderer.invoke('execute-tool', {
      toolName: 'email-check',
      args: { since: this.lastCheckTime },
    });
    this.lastCheckTime = Date.now();
    return result as EmailRecord[];
  }

  private lastCheckTime = Date.now();
}

// ─── SUPERVISOR: Listen for isolated agent events ───────
supervisor.on('isolated-agent-event', async (event) => {
  const { agentName, eventName, data } = event;

  if (agentName === 'Email Monitor' && eventName === 'emails-received') {
    // Broadcast to other agents: "Hey, new commission emails!"
    supervisor.emit('commission-emails-arrived', { emails: data });

    // Other agents (HealthCoach, SalesCopilot) react accordingly
  }
});
```

### 3.3 Implementing Worker Pool (Product Lookup Scaling)

```typescript
// ─── SUPERVISOR: Manage agent pool ───────────────────────
class AgentPoolSupervisor {
  private pool: VibeBaseAgent[] = [];
  private taskQueue: Array<{
    id: string;
    toolName: string;
    args: unknown;
    deferred: { resolve: (v: unknown) => void; reject: (e: Error) => void };
  }> = [];

  constructor(agentDef: VibeAgentDefinition, poolSize = 5) {
    // Spawn N agents of same type
    for (let i = 0; i < poolSize; i++) {
      const agent = new ProductLookupAgent(agentDef, agentLogger);
      this.pool.push(agent);
    }
    this.startDispatcher();
  }

  async executeToolScaled(
    toolName: string,
    args: unknown
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        id: `${Date.now()}-${Math.random()}`,
        toolName,
        args,
        deferred: { resolve, reject },
      });
    });
  }

  private startDispatcher() {
    setInterval(() => {
      // Load balance: assign next task to next available agent
      const agent = this.pool.shift();
      const task = this.taskQueue.shift();

      if (!agent || !task) return;

      (async () => {
        try {
          const result = await agent.executeTool(task.toolName, task.args);
          task.deferred.resolve(result);
        } catch (error) {
          task.deferred.reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
          // Return agent to pool
          this.pool.push(agent);
        }
      })();
    }, 100); // Check every 100ms
  }
}

// Usage: High-volume product searches
await poolSupervisor.executeToolScaled('product-lookup', { query, limit: 10 });
```

### 3.4 Service Workers (Scheduled Tasks)

```typescript
// ─── SCHEDULER: Register daily tasks ───────────────────
class ScheduledTaskAgent extends VibeBaseAgent {
  registerSchedule(cron: string, task: () => Promise<void>) {
    // cron: "0 4 * * *" = 4am daily
    const job = schedule.scheduleJob(cron, async () => {
      try {
        this.deps.log('info', `[${this.definition.agent_name}] Running: ${cron}`);
        await task();
      } catch (error) {
        this.deps.log('error', `[${this.definition.agent_name}] Task failed`, error);
      }
    });
    return job;
  }
}

// ─── WELL: Daily commission recalculation ───────────────
class RewardEngineAgent extends ScheduledTaskAgent {
  async execute(input: unknown): Promise<unknown> {
    // Register daily task
    this.registerSchedule('0 4 * * *', async () => {
      const { data: users } = await supabase
        .from('users')
        .select('*');

      for (const user of users) {
        // Recalculate commissions
        const commissions = await this.calculateCommissions(user.id);
        await supabase
          .from('transactions')
          .update({ status: 'processed' })
          .eq('user_id', user.id);

        this.updateKPI('daily-users-processed', users.length);
      }
    });

    return { status: 'scheduled', nextRun: '4:00 AM' };
  }
}
```

---

## 4. STATE MANAGEMENT ACROSS AGENTS

### 4.1 The Problem: Distributed State

Multiple agents need shared access to:
- User commission balance
- Product inventory
- User rank/status
- Team performance metrics

**Current Well:** Each agent independently calls Supabase (N API calls, N responses).

**Electron Solution:** Supervisor maintains **single source of truth**, agents query through supervisor.

```
┌──────────────────────────────────────────────────────────┐
│ STATE MANAGEMENT PATTERN                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Supervisor State Store]                                │
│  ├─ Single DB query: SELECT * FROM users WHERE id=X    │
│  ├─ Cache result (5 min TTL)                            │
│  └─ Broadcast to 3 agents                              │
│                                                          │
│ [Agent 1 (Coach)]     [Agent 2 (Sales)]  [Agent 3]    │
│  └─ Query Supervisor ──→ Returns cached result ← ──┘   │
│     (no DB call)        (no API latency)                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Implementing Supervisor State Cache

```typescript
// ─── SUPERVISOR: Central state store ───────────────────
class StatefulAgentSupervisor extends EventEmitter {
  private stateCache: Map<string, { data: unknown; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  async getOrFetchState(key: string, fetcher: () => Promise<unknown>) {
    const cached = this.stateCache.get(key);

    // Return cached if valid
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Otherwise, fetch fresh
    const data = await fetcher();
    this.stateCache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    // Broadcast state change to all subscribed agents
    this.emit('state-changed', { key, data });
    return data;
  }

  invalidateState(key: string) {
    this.stateCache.delete(key);
    this.emit('state-invalidated', { key });
  }
}

// ─── USAGE: Commission lookup via supervisor state ─────
class HealthCoachAgent extends VibeBaseAgent {
  constructor(
    definition: VibeAgentDefinition,
    private supervisor: StatefulAgentSupervisor,
    deps: VibeAgentDeps
  ) {
    super(definition, deps);

    // Listen for state updates
    supervisor.on('state-changed', (event) => {
      if (event.key === `user:${this.currentUserId}`) {
        // User state changed, re-evaluate advice
        this.updateCoachingContext(event.data);
      }
    });
  }

  async generateAdvice(userId: string) {
    // Query supervisor cache (no Supabase call!)
    const userState = await this.supervisor.getOrFetchState(
      `user:${userId}`,
      () => supabase.from('users').select('*').eq('id', userId).single()
    );

    // Generate advice based on cached state
    const advice = await this.llm.chat([
      {
        role: 'system',
        content: `User: ${userState.name}, Rank: ${userState.rank}, Sales: ${userState.totalSales}`,
      },
      { role: 'user', content: 'How can I improve my sales?' },
    ]);

    return advice;
  }
}
```

---

## 5. AGENT REGISTRY & SERVICE DISCOVERY

### 5.1 Current Well Implementation (Baseline)

```typescript
// src/lib/vibe-agent/agent-registry-singleton.ts
export class VibeAgentRegistry {
  private agents: Map<string, VibeBaseAgent> = new Map();

  register(agent: VibeBaseAgent): void {
    this.agents.set(agent.getDefinition().agent_name, agent);
  }

  get(agentName: string): VibeBaseAgent | undefined {
    return this.agents.get(agentName);
  }
}
```

**Gaps:**

- No lifecycle tracking (when did agent register? is it alive?)
- No health checks
- No deregistration on agent death
- No routing metadata (which tools does agent handle?)
- No load balancing

### 5.2 Enhanced Registry with Electron Patterns

```typescript
// ─── ENHANCED REGISTRY: Service Discovery ──────────────
interface AgentRegistryEntry {
  agent: VibeBaseAgent;
  registeredAt: number;
  lastHeartbeat: number;
  isHealthy: boolean;
  tools: string[]; // Tools this agent can execute
  metadata: Record<string, unknown>;
}

export class EnhancedAgentRegistry extends EventEmitter {
  private registry: Map<string, AgentRegistryEntry> = new Map();
  private readonly HEARTBEAT_INTERVAL = 5_000; // 5 seconds
  private readonly HEARTBEAT_TIMEOUT = 15_000; // 15 seconds

  register(
    agent: VibeBaseAgent,
    tools: string[] = [],
    metadata: Record<string, unknown> = {}
  ): void {
    const name = agent.getDefinition().agent_name;

    this.registry.set(name, {
      agent,
      registeredAt: Date.now(),
      lastHeartbeat: Date.now(),
      isHealthy: true,
      tools,
      metadata,
    });

    agentLogger.info(`[Registry] Agent registered: ${name} (tools: ${tools.join(', ')})`);

    // Emit registration event
    this.emit('agent-registered', { agentName: name, tools, metadata });
  }

  unregister(agentName: string): void {
    this.registry.delete(agentName);
    this.emit('agent-unregistered', { agentName });
    agentLogger.info(`[Registry] Agent unregistered: ${agentName}`);
  }

  /**
   * Discover agent by tool (like Electron finding handler for channel)
   * Use case: Which agent can execute 'commission-lookup'?
   */
  getAgentForTool(toolName: string): VibeBaseAgent | undefined {
    for (const entry of this.registry.values()) {
      if (entry.tools.includes(toolName)) {
        return entry.agent;
      }
    }
    return undefined;
  }

  /**
   * Health check: Ping all agents
   * Detect dead agents, trigger recovery
   */
  async checkHealth(): Promise<{ healthy: number; unhealthy: number }> {
    let healthy = 0, unhealthy = 0;

    for (const entry of this.registry.values()) {
      const timeSinceHeartbeat = Date.now() - entry.lastHeartbeat;

      if (timeSinceHeartbeat > this.HEARTBEAT_TIMEOUT) {
        entry.isHealthy = false;
        unhealthy++;

        agentLogger.warn(
          `[Registry] Agent unhealthy: ${entry.agent.getDefinition().agent_name}`
        );

        // Emit event for supervisor recovery
        this.emit('agent-unhealthy', {
          agentName: entry.agent.getDefinition().agent_name,
        });
      } else {
        entry.isHealthy = true;
        healthy++;
      }
    }

    return { healthy, unhealthy };
  }

  /**
   * Get all agents (for admin panel, debugging)
   */
  listAgents(): Array<{
    name: string;
    isHealthy: boolean;
    tools: string[];
    registeredSince: number;
  }> {
    return Array.from(this.registry.entries()).map(([name, entry]) => ({
      name,
      isHealthy: entry.isHealthy,
      tools: entry.tools,
      registeredSince: Date.now() - entry.registeredAt,
    }));
  }
}

// ─── SUPERVISOR INTEGRATION ────────────────────────────
class AgentSupervisor {
  private registry = new EnhancedAgentRegistry();

  constructor() {
    // Health check every 10 seconds
    setInterval(() => this.registry.checkHealth(), 10_000);

    // Listen for unhealthy agents
    this.registry.on('agent-unhealthy', (event) => {
      this.handleAgentCrash(event.agentName);
    });
  }

  async executeToolWithDiscovery(toolName: string, args: unknown) {
    // Find agent capable of tool
    const agent = this.registry.getAgentForTool(toolName);

    if (!agent) {
      throw new Error(`No agent registered for tool: ${toolName}`);
    }

    // Route to that specific agent
    return await agent.execute({ action: 'execute-tool', toolName, args });
  }

  private async handleAgentCrash(agentName: string) {
    agentLogger.error(`[Supervisor] Agent crashed: ${agentName}, attempting recovery...`);

    // Restart the agent
    // Implementation: re-instantiate agent, re-register
  }
}
```

---

## 6. SUPERVISOR PATTERNS & CRASH RECOVERY

### 6.1 Electron's Process Supervision Model

Electron uses **hierarchical supervision:** Main process supervises all renderer processes. Death of renderer doesn't kill main; main can restart renderer.

**Mapped to Agents:**

```
┌────────────────────────────────────────────────────────┐
│ SUPERVISION HIERARCHY                                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [SUPERVISOR PROCESS] — Immortal                       │
│   ├─ orchestrateAgentRequest()                        │
│   ├─ routeToAgent()                                   │
│   ├─ monitorHealth()                                  │
│   └─ handleCrash() ← Recovery logic                   │
│          │                                            │
│          ├→ [HealthCoach Agent] (may crash)          │
│          ├→ [Sales Copilot] (may crash)              │
│          ├→ [Reward Engine] (may crash)              │
│          └→ [Email Monitor] (long-running)           │
│                                                        │
│ If any agent crashes:                                │
│  1. Supervisor detects (health check fails)          │
│  2. Supervisor catches error (try/catch)             │
│  3. Supervisor re-instantiates agent                 │
│  4. User request fails gracefully, not app crash    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 6.2 Restart Policies (from Akka, Electron)

```typescript
// ─── RESTART POLICIES ──────────────────────────────────
export type RestartPolicy = 'one-for-one' | 'one-for-all' | 'rest-for-one';

/**
 * OneForOne: Agent crashes → Restart only that agent
 * Use for: Independent agents (Coach, Sales, Email Monitor)
 */
export const ONE_FOR_ONE: RestartPolicy = 'one-for-one';

/**
 * OneForAll: Agent crashes → Restart ALL agents
 * Use for: Tightly-coupled agent suite
 */
export const ONE_FOR_ALL: RestartPolicy = 'one-for-all';

/**
 * RestForOne: Agent crashes → Restart it + all agents started after
 * Use for: Dependency chain (Agent A must start before B)
 */
export const REST_FOR_ONE: RestartPolicy = 'rest-for-one';

// ─── IMPLEMENTATION ────────────────────────────────────
interface SupervisedAgent {
  agent: VibeBaseAgent;
  restartPolicy: RestartPolicy;
  maxRestarts: number;
  restartWindow: number; // ms within which max restarts applies
  currentRestarts: number;
  lastRestartTime: number;
}

class SupervisingAgentSupervisor {
  private supervisedAgents: SupervisedAgent[] = [];

  supervise(
    agent: VibeBaseAgent,
    options: {
      restartPolicy?: RestartPolicy;
      maxRestarts?: number;
      restartWindow?: number;
    } = {}
  ) {
    this.supervisedAgents.push({
      agent,
      restartPolicy: options.restartPolicy ?? ONE_FOR_ONE,
      maxRestarts: options.maxRestarts ?? 3,
      restartWindow: options.restartWindow ?? 60_000, // 1 minute
      currentRestarts: 0,
      lastRestartTime: 0,
    });
  }

  async handleAgentCrash(
    crashedAgent: VibeBaseAgent,
    error: Error
  ): Promise<void> {
    const agentName = crashedAgent.getDefinition().agent_name;
    const supervised = this.supervisedAgents.find(s => s.agent === crashedAgent);

    if (!supervised) {
      agentLogger.error(`[Supervisor] Unmonitored agent crashed: ${agentName}`);
      return;
    }

    // Check if restart limit exceeded
    const timeSinceLastRestart = Date.now() - supervised.lastRestartTime;
    if (timeSinceLastRestart < supervised.restartWindow) {
      supervised.currentRestarts++;
    } else {
      supervised.currentRestarts = 1; // Reset counter
    }

    if (supervised.currentRestarts > supervised.maxRestarts) {
      agentLogger.error(
        `[Supervisor] ${agentName} exceeded max restarts (${supervised.maxRestarts}). Giving up.`
      );

      // Remove from supervision
      this.supervisedAgents = this.supervisedAgents.filter(s => s.agent !== crashedAgent);

      // Notify admin
      this.emit('agent-permanently-dead', { agentName, error: error.message });
      return;
    }

    agentLogger.warn(
      `[Supervisor] Restarting ${agentName} (${supervised.currentRestarts}/${supervised.maxRestarts})`
    );

    // Execute restart policy
    switch (supervised.restartPolicy) {
      case 'one-for-one':
        // Restart only this agent
        await this.restartAgent(supervised);
        break;

      case 'one-for-all':
        // Restart all agents
        for (const supervised of this.supervisedAgents) {
          await this.restartAgent(supervised);
        }
        break;

      case 'rest-for-one':
        // Restart crashed + all started after
        const crashIndex = this.supervisedAgents.indexOf(supervised);
        for (let i = crashIndex; i < this.supervisedAgents.length; i++) {
          await this.restartAgent(this.supervisedAgents[i]);
        }
        break;
    }

    supervised.lastRestartTime = Date.now();
  }

  private async restartAgent(supervised: SupervisedAgent): Promise<void> {
    const agentName = supervised.agent.getDefinition().agent_name;

    try {
      // Re-instantiate agent (conceptual — real implementation depends on DI)
      const newAgent = Object.create(Object.getPrototypeOf(supervised.agent));
      Object.assign(newAgent, supervised.agent);
      supervised.agent = newAgent;

      agentLogger.info(`[Supervisor] Agent restarted: ${agentName}`);
    } catch (error) {
      agentLogger.error(`[Supervisor] Failed to restart ${agentName}`, error);
    }
  }
}
```

### 6.3 Crash Recovery Example: Commission Lookup Timeout

```typescript
// ─── SUPERVISOR: Handle commission lookup timeout ────
async function executeIntentTools(
  classification: ClassificationResult,
  input: OrchestratorInput,
  supervisor: SupervisingAgentSupervisor
): Promise<Array<{ toolName: string; result: unknown }>> {
  const results: Array<{ toolName: string; result: unknown }> = [];

  if (classification.intent === 'commission-inquiry') {
    try {
      // Timeout after 5 seconds (Electron default: 30s)
      const result = await Promise.race([
        executeTool({ toolName: 'commission-lookup', args: { ... } }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: commission-lookup')), 5_000)
        ),
      ]);
      results.push({ toolName: 'commission-lookup', result });
    } catch (error) {
      // Tool failed or timed out
      if (error instanceof Error && error.message.includes('Timeout')) {
        agentLogger.warn(`[Supervisor] Tool timeout, triggering agent recovery`);

        // Find agent responsible for commission-lookup
        const agent = registry.getAgentForTool('commission-lookup');
        if (agent) {
          // Restart it
          await supervisor.handleAgentCrash(agent, error);
        }
      }

      // Fallback: return empty or cached result
      results.push({
        toolName: 'commission-lookup',
        result: { error: 'Commission lookup unavailable, please retry' },
      });
    }
  }

  return results;
}
```

---

## 7. ARCHITECTURAL PATTERNS & RECOMMENDATIONS

### 7.1 Pattern Comparison Matrix

| Pattern | Latency | Coupling | Scalability | Complexity | Recommended |
|---------|---------|----------|-------------|-----------|------------|
| **invoke/handle** | 1-5ms | Low (IPC) | Medium | Low | ✅ **Primary** |
| **EventEmitter** | 1-2ms | Very Low | Medium | Low | ✅ Multi-agent |
| **MessagePort** | <1ms | None (direct) | Low | Medium | When needed |
| **send (async)** | 5-10ms | Low | Medium | Low | Side effects |
| **Polling** | 100ms+ | Low | Low | Medium | Avoid |
| **Shared memory** | <1ms | Very High | High | High | Dangerous |

### 7.2 Well Architecture Roadmap

**Phase 1 (Current):** Keyword-based intent routing + sequential tool execution
```
User message → Classify intent → Find agent → Execute tools → Return response
```

**Phase 2 (Electron invoke/handle):** Structured IPC with timeout/error handling
```
Agent supervisor → ipcRenderer.invoke('execute-tool') → Supervised handler
                                                     ↓
                                        Auto timeout/error propagation
```

**Phase 3 (EventEmitter):** Multi-agent event reaction
```
Supervisor.emit('rank-upgraded')
   ├→ Coach agent reacts: generates advice
   ├→ Sales agent reacts: generates scripts
   └→ Reward engine reacts: calculates bonus
```

**Phase 4 (MessagePort + Pool):** Horizontal scaling
```
High-volume product search
   ├→ Spawn 5 product-lookup agents
   ├→ Supervisor load-balances requests
   └→ Direct agent-to-agent sync via MessagePort
```

**Phase 5 (Service Workers):** Background tasks + scheduled work
```
Daily 4am: Recalculate all commissions (scheduled task)
Every 1min: Monitor for new commission emails (isolated agent)
On trigger: Reward Engine processes new orders
```

### 7.3 Implementation Priority (YAGNI)

**🟢 DO NOW (Phase 1-2, 2 weeks):**
1. Add `invoke/handle` to supervisor for tool execution
2. Implement timeout + structured error handling
3. Add `executeTool` to contextBridge whitelist
4. Update Well's agent orchestrator

**🟡 DO SOON (Phase 3, 4 weeks):**
1. Add EventEmitter to supervisor
2. Emit state-change events (rank, inventory, etc.)
3. Have agents subscribe via `.on()`
4. Test multi-agent reactions

**🔴 DO LATER (Phase 4-5, 8+ weeks):**
1. Implement agent pooling for high-volume tools
2. MessagePort for direct agent sync
3. Scheduled tasks (cron agents)
4. Isolated background agents

---

## 8. UNRESOLVED QUESTIONS

1. **Testing Strategy:** How to mock Electron IPC in unit tests without full Electron environment?
   - Propose: Abstract IPC layer, provide mock implementation for testing

2. **Serialization Boundaries:** Electron uses structured clone for IPC data. How to handle non-serializable agent outputs (Promises, class instances)?
   - Propose: Force agent outputs to JSON-serializable format (documented in VibeAgentDefinition)

3. **State Consistency:** If agent crashes mid-execution, partial state changes remain. How to ensure atomicity?
   - Propose: Transaction-like pattern where agent commits only on success

4. **Security of contextBridge:** Preload script evaluated in isolated context — but can electron preload be bypassed in browser (non-Electron) environment?
   - Propose: Separate implementations: Electron (with preload) vs. Browser (with API gateway validation)

5. **Message Ordering:** Multiple agents sending events simultaneously — guaranteed delivery order?
   - Propose: EventEmitter maintains FIFO queue internally (confirmed from Node.js docs)

6. **Agent Authentication:** Should agents have individual API keys, or use supervisor's key?
   - Propose: Use supervisor's key + audit every agent call with agent name (prevents privilege escalation)

---

## Sources

- [Electron Inter-Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Electron ipcMain API](https://www.electronjs.org/docs/latest/api/ipc-main)
- [Electron ipcRenderer API](https://www.electronjs.org/docs/latest/api/ipc-renderer)
- [Electron contextBridge Security](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Electron MessagePorts](https://www.electronjs.org/docs/latest/tutorial/message-ports)
- [Electron MessagePortMain API](https://www.electronjs.org/docs/latest/api/message-port-main)
- [Multi-Agent Supervisor Architecture](https://www.databricks.com/blog/multi-agent-supervisor-architecture-orchestrating-enterprise-ai-scale)
- [Microservices Service Discovery Patterns](https://microservices.io/patterns/service-registry.html)
- [Akka Fault Tolerance](https://doc.akka.io/docs/akka/current/fault-tolerance.html)
- [Distributed Systems Fault Tolerance](https://www.cs.rochester.edu/u/sandhya/csc258/lectures/fault_tolerance_recovery.pdf)
- [Background Processing in Electron](https://medium.com/swlh/how-to-run-background-worker-processes-in-an-electron-app-e0dc310a93cc)
- [Electron Service Workers](https://www.electronjs.org/docs/latest/api/service-workers)

---

**Report Generated:** 2026-03-01 | **Status:** Ready for Planning Phase | **Estimated Planning Budget:** 2-3 tokens (medium-complexity integration)
