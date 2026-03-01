# LiteLLM Architecture & Design Patterns Research

**Date:** 2026-03-01
**Project:** Well Distributor Portal
**Focus:** Patterns for React/TypeScript LLM integration

---

## 1. WHAT IS LITELLM — CORE CONCEPT

**Definition:** LiteLLM is an open-source Python SDK + proxy server (AI Gateway) that provides:
- **Unified interface** to 100+ LLM providers (OpenAI, Anthropic, Azure, Bedrock, VertexAI, Cohere, etc.)
- **Multi-provider abstraction** — single API format (OpenAI-compatible) for all backends
- **Gateway layer** with cost tracking, rate limiting, auth, load balancing, fallbacks
- **Dual deployment modes:**
  - Direct SDK integration (Python library)
  - Centralized proxy server (AI Gateway with REST API)

**Key Insight:** LiteLLM removes provider lock-in by abstracting API differences into a normalized layer. Think of it as a "database abstraction layer for LLMs."

---

## 2. KEY ARCHITECTURAL PATTERNS

### A. Request Flow Architecture (5-Stage Pipeline)

```
Request → Auth Check → Rate Limit Validation → Router (LB/Fallback) → Provider Translation → Response + Async Logging
```

**Pattern Name:** Pipeline/Middleware Chain

| Stage | Responsibility | Pattern |
|-------|----------------|---------|
| **Auth** | Bearer token validation (virtual keys) | Cache-first lookup (Redis → DB fallback) |
| **Rate Limit** | Multi-level quota enforcement | Token bucket / sliding window (RPM, TPM) |
| **Router** | Load balance + fallback logic | State machine (healthy → degraded → cooldown) |
| **Translation** | Normalize to OpenAI format | Adapter pattern (provider-specific → standard) |
| **Logging** | Cost tracking, observability | Fire-and-forget async tasks (non-blocking) |

**Frontend Equivalent:** Apply this pattern to API calls:
- Auth wrapper (JWT validation)
- Rate limit manager (client-side quota)
- Provider selector (fallback chain)
- Standardized response transformer
- Analytics dispatch (async telemetry)

---

### B. Router Architecture (Load Balancing + Fallbacks)

**Core Responsibility:** Distribute requests across multiple deployments, handle failures gracefully.

**Routing Strategies Available:**

| Strategy | Use Case | Behavior |
|----------|----------|----------|
| **Simple Shuffle** | Default, best for production | Randomly shuffles deployments, returns first available |
| **Least Busy** | High concurrency workloads | Selects deployment with fewest in-flight requests |
| **Usage-Based** | Cost optimization | Routes to cheapest available provider |
| **Latency-Based** | Latency-sensitive apps | Selects based on historical response time |

**Fallback Mechanism:**

```python
# Pseudo-code (Python)
routers = [
    {"model": "gpt-4", "order": 1},      # Primary
    {"model": "gpt-3.5-turbo", "order": 2}  # Fallback
]

# If gpt-4 fails → automatically retry gpt-3.5-turbo
# Order parameter defines priority/fallback chain
```

**Health Tracking:**
- Deployment state machine: `healthy → rate_limited → cooldown → recovered`
- CooldownCache class tracks failing deployments
- Auto-recovery after cooldown expires
- Pre-call checks (enable_pre_call_checks: true) validate health before routing

**Frontend Pattern Mapping:**
- **For payment SDK fallback:** Stripe → Polar → offline mode
- **For model selection:** GPT-4 → GPT-3.5 → Claude → Gemini
- **For data provider:** Primary DB → Replica → Cache → Stale Data

---

### C. Multi-Provider Abstraction Pattern (Factory + Adapter)

**Problem:** 100+ providers with completely different APIs.

**Solution:** Normalized interface layer.

```
Client Code (OpenAI Format)
         ↓
LiteLLM Adapter Layer
         ↓
Provider-Specific Translators:
    ├── OpenAI → OpenAI (passthrough)
    ├── Anthropic → OpenAI format (transform messages)
    ├── Bedrock → OpenAI format (map parameters)
    ├── Azure → OpenAI format (add auth headers)
    └── ...100+ more
         ↓
Provider APIs
```

**Key Design Elements:**

1. **Single Client Interface:** All providers use `/chat/completions` endpoint
2. **Config-Driven Routing:** `model_name` maps to provider + deployment
3. **Parameter Mapping:** Temperature, max_tokens, etc. normalized across providers
4. **Error Translation:** Provider-specific errors → standardized exceptions

**Frontend Mapping:**
```typescript
// Instead of provider-specific clients
const anthropicClient = new Anthropic();
const openaiClient = new OpenAI();

// Use LiteLLM pattern: unified interface
const llmClient = new LLMRouter({
  defaultModel: 'gpt-4',
  fallbacks: ['gpt-3.5-turbo', 'claude-3-opus'],
  config: loadConfigFromServer()
});

// Same call works for any provider
const response = await llmClient.complete(prompt);
```

---

### D. Budget & Rate Limiting Architecture

**Three-Tier Budget System:**

| Level | Scope | Example |
|-------|-------|---------|
| **Global** | Entire server | $10,000/month total spend |
| **Team/Project** | Group of users | Sophia AI Factory team: $2,000/month |
| **User/Key** | Individual API key | User "alice@example.com": $100/month |

**Rate Limit Types:**

```yaml
rpm_limit: 1000          # Requests Per Minute
tpm_limit: 100000        # Tokens Per Minute (input + output)
max_parallel_requests: 100
budget_limit: "$500"
budget_period: "7d"      # 7 days, 30d, or 1mo
```

**Implementation Pattern:**

```python
# Token bucket algorithm with Redis sync
class RateLimiter:
    def __init__(self, rpm, tpm):
        self.tokens_per_minute = rpm
        self.tokens_total = tpm
        self.last_refill = now()

    def check_and_consume(self, tokens_needed):
        refill_tokens()
        if available_tokens >= tokens_needed:
            available_tokens -= tokens_needed
            return True
        return False  # Rate limited
```

**Multi-Instance Sync (Redis):**
- In distributed setups, Redis syncs cooldown state + usage across instances
- Prevents race conditions in distributed rate limiting
- Tracks spend per key/team in shared cache

**Frontend Pattern:**
```typescript
// Client-side rate limiter for API calls
class APIRateLimiter {
  constructor(rpmLimit: number, tpmLimit: number, budgetUSD: number) {}

  async call(endpoint: string, tokens: number) {
    if (!this.canProceed(tokens)) {
      return { error: 'RATE_LIMITED', retryAfter: 60 };
    }
    return await fetch(endpoint);
  }
}

// Use in React hooks
const [usage, setUsage] = useState({ rpm: 0, tpm: 0, budget: 0 });
const limiter = useMemo(() => new APIRateLimiter(...), []);
```

---

### E. Complexity Router (Auto-Routing Pattern)

**Purpose:** Route requests to appropriate model based on complexity without external API calls.

**How It Works:**
- Rule-based scoring system (sub-millisecond latency)
- Zero external API calls needed
- Classifies requests by complexity

**Example Rules:**
```yaml
if token_count < 100:
  model: "gpt-3.5-turbo"      # Simple → cheap
else if token_count < 1000:
  model: "gpt-4"              # Complex → powerful
else:
  model: "claude-3-opus"      # Very complex → best
```

**Frontend Pattern:**
- Estimate request complexity (word count, parameter count)
- Select model tier (light/medium/heavy) before API call
- Reduces latency + cost

---

## 3. HOW LITELLM HANDLES MULTI-PROVIDER ABSTRACTION

### Abstraction Layers (Bottom-Up)

```
┌─────────────────────────────────────────────┐
│ Application Code (OpenAI Format Only)       │
├─────────────────────────────────────────────┤
│ LiteLLM Public API (unified interface)      │
├─────────────────────────────────────────────┤
│ Provider Adapters (100+ implementations)    │
│  ├── OpenAI Adapter                         │
│  ├── Anthropic Adapter (message transform)  │
│  ├── Azure Adapter (auth headers)           │
│  ├── Bedrock Adapter                        │
│  └── ... others                             │
├─────────────────────────────────────────────┤
│ HTTP Client + Error Handling                │
├─────────────────────────────────────────────┤
│ Provider APIs                               │
└─────────────────────────────────────────────┘
```

### Key Abstraction Techniques

**1. Config-Driven Provider Selection**
```python
# Instead of: "which SDK do I import?"
# Use config: which provider backend?

model_config = {
    "model": "gpt-4",                    # Client sees this
    "provider": "openai",                # Internal routing
    "api_key": "sk-...",
    "deployment": "prod-1"
}
```

**2. Message Format Normalization**
```python
# All providers receive same format:
messages = [
    {"role": "user", "content": "Hello"}
]

# Adapters transform as needed:
# - Anthropic: adds system blocks
# - Bedrock: converts to XML format
# - Azure: prefixes with deployment name
```

**3. Parameter Mapping**
```python
# Frontend: temperature 0.0-1.0 (standard)
# Backend: Anthropic uses different scale
# Adapter: auto-convert per provider needs
```

---

## 4. KEY DESIGN PATTERNS WORTH ADOPTING IN TYPESCRIPT

### A. Provider Pattern (Adapter + Factory)

```typescript
// Unified provider interface
interface LLMProvider {
  complete(prompt: string, options: CompleteOptions): Promise<CompletionResult>;
  isHealthy(): boolean;
  getCost(): number;
}

// Provider implementations
class OpenAIProvider implements LLMProvider { ... }
class AnthropicProvider implements LLMProvider { ... }
class ClaudioProvider implements LLMProvider { ... }

// Factory
class LLMProviderFactory {
  create(name: string): LLMProvider { ... }
}
```

**Use In Well Portal:**
- Payment provider pattern (Stripe, Polar, PayPal)
- Analytics provider (Mixpanel, PostHog, Segment)
- Auth provider (Supabase Auth, NextAuth, Auth0)

---

### B. Router Pattern (State Machine + Routing Table)

```typescript
type DeploymentState = 'healthy' | 'degraded' | 'cooldown' | 'recovered';

class DeploymentRouter {
  private deployments: Map<string, Deployment> = new Map();
  private state: Map<string, DeploymentState> = new Map();
  private cooldownExpiry: Map<string, Date> = new Map();

  async select(strategy: 'shuffle' | 'least-busy' | 'latency'): Promise<Deployment> {
    const available = this.getHealthyDeployments();

    switch(strategy) {
      case 'shuffle':
        return available[Math.random() * available.length | 0];
      case 'least-busy':
        return available.sort((a, b) => a.activeRequests - b.activeRequests)[0];
      case 'latency':
        return available.sort((a, b) => a.p95Latency - b.p95Latency)[0];
    }
  }

  markFailed(id: string, error: Error) {
    this.state.set(id, 'cooldown');
    this.cooldownExpiry.set(id, new Date(Date.now() + 30000)); // 30s cooldown
  }
}
```

**Use In Well Portal:**
- Distributor selection (geolocation-based, latency-based)
- Order routing (warehouse selection based on inventory)
- API endpoint selection (multiple backends, health-aware)

---

### C. Rate Limiter Pattern (Token Bucket)

```typescript
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: Date = new Date();

  constructor(rpm: number, tpm: number) {
    this.maxTokens = rpm;
    this.tokens = rpm;
    this.refillRate = rpm / 60; // tokens per second
  }

  canConsume(tokensNeeded: number = 1): boolean {
    this.refill();
    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded;
      return true;
    }
    return false;
  }

  private refill() {
    const now = new Date();
    const elapsed = (now.getTime() - this.lastRefill.getTime()) / 1000;
    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + elapsed * this.refillRate
    );
    this.lastRefill = now;
  }
}
```

**Use In Well Portal:**
- API call throttling (distributor orders)
- User action rate limiting (search, filter)
- Payment attempts rate limiting

---

### D. Circuit Breaker Pattern (Provider Health)

```typescript
enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Too many failures, reject immediately
  HALF_OPEN = 'half_open' // Testing if provider recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successThreshold: number = 2;
  private failureThreshold: number = 5;
  private resetTimeout: number = 60000; // 1 minute
  private lastFailureTime: Date | null = null;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime!.getTime() > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();
    if (this.failures >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
```

**Use In Well Portal:**
- Payment processor fallback (Stripe down → Polar)
- Database connection resilience
- Third-party API integrations

---

### E. Caching Strategy (Cache-First Lookup)

**Pattern:** Redis (distributed) → In-Memory (local) → Database (fallback)

```typescript
class CacheLayer {
  constructor(
    private redis: RedisClient,
    private memory: Map<string, CacheEntry>,
    private db: Database
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // Level 1: Redis cache
    const redisValue = await this.redis.get(key);
    if (redisValue) return JSON.parse(redisValue);

    // Level 2: In-memory cache
    const memValue = this.memory.get(key);
    if (memValue && !memValue.isExpired()) return memValue.value;

    // Level 3: Database
    const dbValue = await this.db.query(key);

    // Repopulate caches
    await this.redis.set(key, JSON.stringify(dbValue), 'EX', 3600);
    this.memory.set(key, { value: dbValue, expiry: Date.now() + 300000 });

    return dbValue;
  }
}
```

**Use In Well Portal:**
- API key validation (frequent, read-heavy)
- User preferences / distributor settings
- Product catalog
- Pricing information

---

### F. Observable Async Pipeline (Fire-and-Forget Logging)

```typescript
class AsyncPipeline {
  private queue: AsyncTask[] = [];

  async execute<T>(
    mainTask: () => Promise<T>,
    sideTasks: Array<() => Promise<void>>
  ): Promise<T> {
    const result = await mainTask(); // Critical path

    // Fire-and-forget side tasks (non-blocking)
    Promise.all(sideTasks.map(task => task())).catch(err =>
      console.error('Side task failed:', err)
    );

    return result;
  }
}

// Usage
await asyncPipeline.execute(
  () => processPayment(orderId),  // Main path: must complete
  [
    () => logToAnalytics(orderId),  // Side: async
    () => sendConfirmationEmail(),  // Side: async
    () => updateInventory()         // Side: async
  ]
);
```

**Use In Well Portal:**
- Main: API response (must be fast)
- Sides: logging, analytics, email, webhooks (can be async)

---

## 5. BUDGET/RATE LIMITING PATTERNS

### A. Tiered Budget System

**Structure:**

```typescript
interface BudgetTier {
  name: string;
  monthlyLimit: number;
  dailyLimit: number;
  perRequestLimit: number;
  warningThreshold: 0.8; // Alert at 80%
}

const budgetTiers = {
  free: { monthlyLimit: 10, dailyLimit: 1, perRequestLimit: 0.1 },
  starter: { monthlyLimit: 100, dailyLimit: 10, perRequestLimit: 1 },
  growth: { monthlyLimit: 1000, dailyLimit: 100, perRequestLimit: 10 },
  enterprise: { monthlyLimit: 50000, dailyLimit: 2000, perRequestLimit: 500 }
};
```

### B. Sliding Window Rate Limiter

**Algorithm:** Track requests in last N seconds

```typescript
class SlidingWindowLimiter {
  private window: number[]; // timestamps of requests
  private windowSize: number; // in seconds
  private maxRequests: number;

  constructor(maxRequests: number, windowSizeSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.windowSize = windowSizeSeconds;
    this.window = [];
  }

  canConsume(): boolean {
    const now = Date.now();

    // Remove old requests outside window
    this.window = this.window.filter(
      time => now - time < this.windowSize * 1000
    );

    // Check if under limit
    if (this.window.length < this.maxRequests) {
      this.window.push(now);
      return true;
    }

    return false;
  }
}
```

### C. Usage Tracking & Alerts

```typescript
interface UsageMetrics {
  requestsThisMonth: number;
  tokensThisMonth: number;
  costThisMonth: number;
  costPerRequest: number;
  percentageOfBudget: number;
}

class UsageTracker {
  async trackRequest(userId: string, tokens: number, provider: string) {
    const costUSD = this.calculateCost(tokens, provider);

    // Update real-time metrics
    await this.db.increment(`usage:${userId}:month:cost`, costUSD);
    await this.db.increment(`usage:${userId}:month:tokens`, tokens);

    // Check if over budget
    const usage = await this.getUsageMetrics(userId);
    if (usage.percentageOfBudget > 0.95) {
      await this.notifyQuotaWarning(userId, usage);
    }
  }
}
```

### D. Cost Optimization Router

```typescript
interface ProviderCost {
  name: string;
  costPerToken: number;
  latencyMs: number;
  reliability: number; // 0-1
}

class CostOptimizedRouter {
  selectProvider(
    prompt: string,
    options: { budget?: number; latencySensitive?: boolean }
  ): ProviderCost {
    const providers = this.getAvailableProviders();

    if (options.latencySensitive) {
      // Pick fastest, regardless of cost
      return providers.sort((a, b) => a.latencyMs - b.latencyMs)[0];
    }

    // Pick cheapest that meets budget
    return providers
      .filter(p => p.costPerToken * prompt.length / 1000 <= options.budget!)
      .sort((a, b) => a.costPerToken - b.costPerToken)[0];
  }
}
```

---

## 6. TYPESCRIPT IMPLEMENTATION TEMPLATE

```typescript
// lib/llm-router.ts - LiteLLM Pattern in TypeScript

import { EventEmitter } from 'events';

type ProviderName = 'openai' | 'anthropic' | 'claude' | 'gemini';
type RouterStrategy = 'shuffle' | 'least-busy' | 'latency' | 'cost';

interface Provider {
  id: string;
  name: ProviderName;
  apiKey: string;
  active: boolean;
  order: number; // Priority for fallback
  cost: number; // USD per 1M tokens
  latency: number; // P95 latency in ms
  activeRequests: number;
}

interface RateLimitConfig {
  rpmLimit: number;
  tpmLimit: number;
  monthlyBudget: number;
}

export class LLMRouter extends EventEmitter {
  private providers: Map<string, Provider> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private cache: CacheLayer;

  constructor(private config: RateLimitConfig) {
    super();
  }

  registerProvider(provider: Provider) {
    this.providers.set(provider.id, provider);
    this.circuitBreakers.set(provider.id, new CircuitBreaker());
  }

  async complete(
    prompt: string,
    options: { strategy?: RouterStrategy } = {}
  ) {
    // 1. Rate limit check
    if (!this.rateLimiters.get('global')?.canConsume()) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // 2. Select provider
    const provider = this.selectProvider(options.strategy || 'shuffle');

    // 3. Execute with circuit breaker
    return await this.circuitBreakers
      .get(provider.id)!
      .execute(() => this.callProvider(provider, prompt));
  }

  private selectProvider(strategy: RouterStrategy): Provider {
    const healthy = Array.from(this.providers.values())
      .filter(p => p.active);

    switch(strategy) {
      case 'shuffle':
        return healthy[Math.random() * healthy.length | 0];
      case 'least-busy':
        return healthy.sort((a, b) => a.activeRequests - b.activeRequests)[0];
      case 'latency':
        return healthy.sort((a, b) => a.latency - b.latency)[0];
      case 'cost':
        return healthy.sort((a, b) => a.cost - b.cost)[0];
    }
  }

  private async callProvider(provider: Provider, prompt: string) {
    provider.activeRequests++;
    try {
      // Make API call
      const result = await fetch(/* ... */);
      this.emit('success', { provider: provider.id });
      return result;
    } catch (error) {
      this.emit('failure', { provider: provider.id, error });
      throw error;
    } finally {
      provider.activeRequests--;
    }
  }
}
```

---

## 7. UNRESOLVED QUESTIONS

1. **State Persistence Across Distributed Instances:** How should Well track rate limits if multiple backend instances exist? Use Redis or managed service?

2. **Budget Enforcement Timing:** Should budget checks happen per-request (strict) or batch-updated (eventual)? Trade-off between accuracy and latency?

3. **Fallback Chain Optimization:** Should fallback priority be fixed (config) or dynamic (based on historical success rates)?

4. **Circuit Breaker Reset Strategy:** Exponential backoff vs. fixed timeout for circuit breaker recovery? Well's use case?

5. **Multi-Provider Pricing:** How to handle providers with different pricing models? (per-token vs. per-request vs. subscription)

---

## Sources

- [Router - Load Balancing | liteLLM](https://docs.litellm.ai/docs/routing)
- [LiteLLM AI Gateway (LLM Proxy) | liteLLM](https://docs.litellm.ai/docs/simple_proxy)
- [Proxy - Load Balancing | liteLLM](https://docs.litellm.ai/docs/proxy/load_balancing)
- [Life of a Request | liteLLM](https://docs.litellm.ai/docs/proxy/architecture)
- [Routing, Loadbalancing & Fallbacks | liteLLM](https://docs.litellm.ai/docs/routing-load-balancing)
- [Budgets, Rate Limits | liteLLM](https://docs.litellm.ai/docs/proxy/users)
- [Budget / Rate Limit Tiers | liteLLM](https://docs.litellm.ai/docs/proxy/rate_limit_tiers)
- [GitHub - BerriAI/litellm](https://github.com/BerriAI/litellm)
