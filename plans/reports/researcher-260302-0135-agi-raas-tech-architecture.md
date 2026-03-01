# AGI Architecture Patterns for WellNexus RaaS Platform

**Date:** 2026-03-02 | **Slug:** agi-raas-tech-architecture
**Status:** Research Complete | **Scope:** Upgrade existing Agent-OS (24+ agents)

---

## 1. Existing Foundation (What We Already Have)

WellNexus already ships production-grade primitives — avoid reinventing:

| Component | File | Pattern |
|-----------|------|---------|
| LLM Router | `agent-llm-router-litellm-pattern.ts` | LiteLLM-style, multi-provider fallback |
| Worker Supervisor | `agent-worker-supervisor-electron-pattern.ts` | Hierarchical, circuit breaker |
| Memory Store | `agent-memory-store-mem0-pattern.ts` | Mem0 CRUD parity, tenant-scoped |
| Automation Engine | `workflow/automation-engine.ts` | Trigger→Action workflow, Zod-validated |
| Vercel AI Adapter | `agent-vercel-ai-adapter.ts` | `streamText` bridge, AI SDK v6 |
| Execution Queue | `agent-execution-queue-n8n-pattern.ts` | Priority queue, concurrency control |

**Gap:** Agent-OS is infrastructure — no AGI reasoning layer (ReAct/Plan-Execute), no tool registry, no semantic memory, no agentic commerce flows.

---

## 2. AGI Reasoning Patterns

### 2a. ReAct (Recommended for Commerce)

Loop: `Thought → Action → Observation → repeat`

```typescript
// Vercel AI SDK 6 — native ReAct via ToolLoopAgent
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: getVibeModel('gemini-2.0-flash'),
  tools: { searchProducts, checkInventory, applyDiscount },
  stopWhen: stepCountIs(10),
  prepareStep: async ({ steps }) => {
    // Dynamic model downgrade after step 5 (cost saving)
    if (steps.length > 5) return { model: getVibeModel('gemini-flash-lite') };
  },
});
```

Best for: product search, order Q&A, real-time recommendation.

### 2b. Plan-Execute (Recommended for Complex Orders)

```
Planner LLM → [subtask1, subtask2, subtask3]
                    ↓
Executor agents run in parallel/sequence
                    ↓
Verifier checks criteria → rollback if failed
```

Best for: bulk order processing, distributor onboarding, compliance checks.
WellNexus already has `RecipeOrchestrator` pattern in mekong-cli — port it.

### 2c. Tree of Thoughts (Skip for now — YAGNI)

Overkill for commerce. Useful only for complex negotiation trees. Revisit in v2.

---

## 3. Multi-Agent Orchestration

### Supervisor Pattern (Fits Existing Architecture)

```
SupervisorAgent
├── ProductAgent      → catalog search, pricing
├── OrderAgent        → create/update/validate orders
├── RewardAgent       → rank, commission, MLM logic
├── DiagnosticAgent   → health, escalation
└── CoachAgent        → distributor onboarding, training
```

`AgentWorkerSupervisor` already routes by `agentName`. Add supervisor-level planning:

```typescript
// Extend existing supervisor
class CommerceSupervisor extends AgentWorkerSupervisor {
  async planAndDelegate(goal: string): Promise<void> {
    const plan = await generateObject({
      model: getVibeModel('gemini-2.0-pro'),
      schema: z.object({ agents: z.array(z.string()), order: z.enum(['parallel','sequential']) }),
      prompt: `Decompose: "${goal}" into agent tasks`,
    });
    // Route to existing registry
    for (const agentName of plan.agents) {
      this.registry.get(agentName)?.execute(goal);
    }
  }
}
```

### Swarm Pattern (For Exploration Tasks)

Agent handoffs — one agent passes context to next. Use for product discovery → recommendation → checkout flows.

```
SearchAgent → handoff(context) → RecommendAgent → handoff(cart) → CheckoutAgent
```

---

## 4. Tool-Use: Function Calling + MCP

### Current Gap

No unified tool registry. Agents call each other via `agentEventBus` but no external tool schema.

### Recommendation: Vercel AI SDK 6 Tool Registry

```typescript
import { tool } from 'ai';
import { z } from 'zod';

// Define once, reuse across all agents
export const wellTools = {
  searchProducts: tool({
    description: 'Search product catalog by keyword',
    inputSchema: z.object({ query: z.string(), category: z.string().optional() }),
    execute: async ({ query }) => productService.search(query),
  }),
  applyDiscount: tool({
    description: 'Apply discount code to cart',
    inputSchema: z.object({ cartId: z.string(), code: z.string() }),
    execute: async ({ cartId, code }) => discountService.apply(cartId, code),
  }),
};
```

### MCP Protocol (Nov 2025 Spec)

Use for: external integrations (ERP, logistics, payment gateways).
MCP = standard interface replacing ad-hoc API clients. Key: OAuth 2.0 per tool, least-privilege by default.

```typescript
// MCP client via Vercel AI SDK
import { createMcpClient } from '@vercel/ai-mcp';
const mcpTools = await createMcpClient({ url: 'http://erp-service/mcp' });
```

---

## 5. Memory Architecture

### Three-Layer Strategy (Map to Existing `agent-memory-store-mem0-pattern.ts`)

```
Short-term  → conversation context window (in-memory, per session)
Long-term   → Supabase postgres + pgvector (semantic search)
Episodic    → timestamped interaction logs (Supabase table)
```

### Implementation Gap

Current `MemoryStore` uses keyword search. Upgrade to vector embeddings:

```typescript
// Add to existing mem0 pattern — embedding generation
import { embed } from 'ai';
const { embedding } = await embed({
  model: google.textEmbeddingModel('text-embedding-004'),
  value: memory.content,
});
// Store in Supabase pgvector: supabase.rpc('match_memories', { query_embedding: embedding })
```

Commerce use cases:
- **Episodic**: "User bought X last month, prefers Y brand" → personalized recommendations
- **Semantic**: Product knowledge base → fast catalog Q&A
- **Procedural**: Agent learns optimal discount thresholds per distributor rank

---

## 6. Vercel AI SDK 6 — Key Capabilities

SDK is already installed (`ai ^6.0.105`). Unlock unused features:

| Feature | API | Use Case |
|---------|-----|---------|
| Agent class | `new ToolLoopAgent(...)` | Replace manual ReAct loops |
| Loop control | `stopWhen`, `prepareStep` | Cost-aware step limits |
| generateObject | `generateObject({ schema })` | Structured plan output |
| Dynamic tools | `inputSchema` + lazy load | Load tools on demand |
| SSE streaming | `streamText` → SSE | Replace current WebSocket |
| Global providers | `"google/gemini-2.0-flash"` | Simplify provider config |

---

## 7. Cost Optimization

### Model Routing Strategy (Extend Existing `agent-llm-router-litellm-pattern.ts`)

```typescript
// Tiered routing by task complexity
const routingRules = [
  { complexity: 'simple',  model: 'gemini-2.0-flash-lite', maxTokens: 500  }, // ~$0.001
  { complexity: 'medium',  model: 'gemini-2.0-flash',      maxTokens: 2000 }, // ~$0.01
  { complexity: 'complex', model: 'gemini-2.0-pro',        maxTokens: 8000 }, // ~$0.05
];
```

### Semantic Caching (High ROI — 40-60% cost reduction)

```typescript
// Cache at agentEventBus level — hash prompt → cache response
const cacheKey = await hashPrompt(messages);
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached); // Sub-ms response
```

### Edge Inference

Use Vercel Edge Functions for lightweight agents (product search, FAQ). Full agents on Node.js runtime. Quantized models via Ollama for local testing.

### Cost Targets

| Agent Type | Model | Estimated Cost/req |
|------------|-------|-------------------|
| FAQ/search | flash-lite | $0.001 |
| Order create | flash | $0.008 |
| Complex plan | pro | $0.05 |
| Batch analysis | flash + cache | $0.0002 |

---

## 8. Agentic Commerce Patterns

### Real-World Context (2026)

- Amazon Rufus: $10B annualized sales via agentic product discovery
- OpenAI Operator: autonomous task completion (booking, checkout)
- ACP protocol: agent-to-agent commercial flows (ChatGPT ↔ Stripe ↔ merchants)
- 45% of shoppers use AI assistance in 2026

### WellNexus Specific Opportunities

```
1. Distributor Onboarding Agent
   Trigger: new signup → coach agent guides through rank requirements
   Tools: getRankRequirements, checkProgress, sendWhatsApp

2. Smart Reorder Agent
   Trigger: low inventory signal → plan optimal reorder
   Tools: checkStock, getPrice, createOrder, applyBulkDiscount

3. Commission Optimizer Agent
   Trigger: end-of-period → calculate optimal MLM commission tree
   Tools: getRankTree, calculateCommission, generatePayout

4. Price Negotiation (B2B tier)
   Agent-to-agent: distributor agent ↔ WellNexus pricing agent
   Dynamic discounts based on volume, rank, history
```

---

## 9. Recommended Upgrade Path

### Phase 1 (Quick Wins — 1 week)

1. Wire `ToolLoopAgent` from AI SDK 6 into `AgentService.stream()`
2. Add tool registry (`wellTools`) — searchProducts, createOrder, checkRank
3. Enable `stopWhen` + tiered model routing in existing router

### Phase 2 (Memory + Planning — 2 weeks)

1. Add pgvector to Supabase, wire into `MemoryStore.search()`
2. Add `CommerceSupervisor.planAndDelegate()` on top of existing supervisor
3. Semantic caching layer at event bus level

### Phase 3 (Agentic Commerce — 3-4 weeks)

1. Distributor Onboarding Agent (highest ROI)
2. Smart Reorder Agent
3. Commission Optimizer Agent

---

## Unresolved Questions

1. **pgvector availability** — Is Supabase project on a plan that supports pgvector extension?
2. **MCP adoption timeline** — External integrations (ERP, logistics) — do vendors have MCP servers or require custom adapters?
3. **Streaming UX** — Current `AgentChat.tsx` uses WebSocket; migrate to SSE or keep hybrid?
4. **Negotiation authority** — For B2B price negotiation agent, what are the discount floor/ceiling rules and who approves?
5. **MLM compliance** — Commission calculation agent needs legal review before autonomous payouts.

---

## Sources

- [Vercel AI SDK 6](https://vercel.com/blog/ai-sdk-6)
- [AI SDK Agents Loop Control](https://ai-sdk.dev/docs/agents/loop-control)
- [ReAct vs Plan-Execute Architectures](https://apxml.com/courses/langchain-production-llm/chapter-2-sophisticated-agents-tools/agent-architectures)
- [Multi-Agent Supervisor Pattern — Databricks](https://www.databricks.com/blog/multi-agent-supervisor-architecture-orchestrating-enterprise-ai-scale)
- [MCP Nov 2025 Spec](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Best Practices](https://mcp-best-practice.github.io/mcp-best-practice/best-practice/)
- [AI Agent Memory — IBM](https://www.ibm.com/think/topics/ai-agent-memory)
- [Memory-Driven AI Agents — MarkTechPost](https://www.marktechpost.com/2026/02/01/how-to-build-memory-driven-ai-agents-with-short-term-long-term-and-episodic-memory/)
- [LLM Cost Optimization 2025](https://futureagi.com/blogs/llm-cost-optimization-2025)
- [Semantic Caching — AWS](https://aws.amazon.com/blogs/database/optimize-llm-response-costs-and-latency-with-effective-caching/)
- [Agentic Commerce — McKinsey](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-agentic-commerce-opportunity-how-ai-agents-are-ushering-in-a-new-era-for-consumers-and-merchants)
- [Agentic Commerce — BCG](https://www.bcg.com/publications/2025/agentic-commerce-redefining-retail-how-to-respond)
