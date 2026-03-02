---
phase: 5
title: "Services, Utils, Hooks, Agents, Store Splitting — 14 Files Over 200 LOC"
status: pending
priority: P1
effort: 3h
parallel: [2, 3, 4, 6]
depends_on: [1]
owns: ["src/agents/**", "src/services/**", "src/hooks/use-agent-chat.ts", "src/utils/**", "src/store/slices/walletSlice.ts", "src/types.ts", "src/data/mockData.ts", "src/lib/vibe-payment/**"]
---

## Context Links
- Research: [researcher-01-component-splitting.md](research/researcher-01-component-splitting.md)

## Overview
14 non-component/non-page files exceed 200 LOC across agents, services, hooks, utils, store, types, and data. These are pure TypeScript — no JSX (except the hook). Strategy: extract types, split by concern, decompose utility grab-bags.

## File Inventory (14 files, grouped by domain)

### Agents (4 files)
| File | LOC | Split Strategy |
|------|-----|----------------|
| `agents/custom/ScoutAgent.ts` | 300 | Extract tool definitions + response parser |
| `agents/custom/SalesCopilotAgent.ts` | 287 | Extract prompt templates + sales logic |
| `agents/custom/AgencyOSAgent.ts` | 254 | Extract command registry |
| `agents/custom/GeminiCoachAgent.ts` | 250 | Extract coaching prompts + response formatter |

### Services (3 files)
| File | LOC | Split Strategy |
|------|-----|----------------|
| `services/referral-service.ts` | 282 | Extract referral types + tree-walk logic |
| `services/audit-log-service.ts` | 268 | Extract log types + query builders |
| `services/copilotService.ts` | 251 | Extract copilot types + prompt builder |

### Hooks (1 file)
| File | LOC | Split Strategy |
|------|-----|----------------|
| `hooks/use-agent-chat.ts` | 281 | Extract chat types + message handlers |

### Utils (5 files)
| File | LOC | Split Strategy |
|------|-----|----------------|
| `utils/deep.ts` | 235 | Split: deep-clone vs deep-merge vs deep-compare |
| `utils/dom.ts` | 230 | Split: scroll helpers vs element queries vs focus mgmt |
| `utils/gestures.ts` | 228 | Split: swipe handlers vs pinch handlers |
| `utils/async.ts` | 224 | Split: retry logic vs debounce/throttle vs queue |
| `utils/a11y.ts` | 222 | Split: aria helpers vs focus-trap vs screen-reader |
| `utils/security.ts` | 221 | Split: sanitize vs csrf vs input-validation |

### Store (1 file)
| File | LOC | Split Strategy |
|------|-----|----------------|
| `store/slices/walletSlice.ts` | 243 | Extract wallet types + action creators |

### Types (1 file)
| File | LOC | Split Strategy |
|------|-----|----------------|
| `types.ts` | 292 | Split into domain-specific type files |

### Data (1 file)
| File | LOC | Split Strategy |
|------|-----|----------------|
| `data/mockData.ts` | 513 | Split by domain: users, products, transactions |

### Lib (1 file)
| File | LOC | Split Strategy |
|------|-----|----------------|
| `lib/vibe-payment/autonomous-webhook-handler.ts` | 236 | Extract webhook types + event processors |

## Implementation Steps

### Step 1: Split `types.ts` (292 LOC -> domain files)
Central types file — split into focused modules:
1. Create `src/types/user-types.ts` — user, profile, auth types
2. Create `src/types/commerce-types.ts` — product, order, cart types
3. Create `src/types/wallet-types.ts` — wallet, transaction, token types
4. Create `src/types/agent-types.ts` — agent definition, log, state types
5. Create `src/types/index.ts` — barrel re-exporting all (preserves `from '@/types'`)
6. Slim original `types.ts` to re-export from `types/index.ts` (backward compat)

### Step 2: Split `data/mockData.ts` (513 LOC -> domain files)
1. Create `src/data/mock-users.ts` — user/team mock data
2. Create `src/data/mock-products.ts` — product/catalog mock data
3. Create `src/data/mock-transactions.ts` — transaction/wallet mock data
4. Slim `mockData.ts` to barrel re-exporting all

### Step 3: Split agent files (4 files)
For each agent, extract prompt templates and tool definitions:

**ScoutAgent.ts (300 LOC):**
1. Create `src/agents/custom/scout-agent-tools.ts` — tool definitions array
2. Create `src/agents/custom/scout-agent-prompts.ts` — system/user prompts

**SalesCopilotAgent.ts (287 LOC):**
1. Create `src/agents/custom/sales-copilot-prompts.ts`
2. Create `src/agents/custom/sales-copilot-response-parser.ts`

**AgencyOSAgent.ts (254 LOC):**
1. Create `src/agents/custom/agency-os-command-registry.ts`

**GeminiCoachAgent.ts (250 LOC):**
1. Create `src/agents/custom/gemini-coach-prompts.ts`

### Step 4: Split service files (3 files)
For each service, extract types and pure helper functions:

**referral-service.ts (282 LOC):**
1. Create `src/services/referral-service-types.ts` — ReferralNode, TreeConfig
2. Create `src/services/referral-tree-walker.ts` — tree traversal logic

**audit-log-service.ts (268 LOC):**
1. Create `src/services/audit-log-types.ts` — AuditEntry, QueryFilter
2. Create `src/services/audit-log-query-builder.ts` — query construction

**copilotService.ts (251 LOC):**
1. Create `src/services/copilot-service-types.ts`
2. Create `src/services/copilot-prompt-builder.ts`

### Step 5: Split `hooks/use-agent-chat.ts` (281 LOC)
1. Create `src/hooks/agent-chat/use-agent-chat-types.ts` — ChatMessage, ChatState
2. Create `src/hooks/agent-chat/agent-chat-message-handler.ts` — message processing
3. Slim `use-agent-chat.ts` to hook shell importing from above

### Step 6: Split util files (6 files, each ~220-235 LOC)
Each util is a grab-bag — split by sub-concern:

**deep.ts (235 LOC):**
1. Create `src/utils/deep-clone.ts`, `src/utils/deep-merge.ts`, `src/utils/deep-compare.ts`
2. Slim `deep.ts` to barrel

**dom.ts (230 LOC):**
1. Create `src/utils/dom-scroll-helpers.ts`, `src/utils/dom-element-queries.ts`, `src/utils/dom-focus-management.ts`
2. Slim `dom.ts` to barrel

**gestures.ts (228 LOC):**
1. Create `src/utils/gesture-swipe-handlers.ts`, `src/utils/gesture-pinch-handlers.ts`
2. Slim `gestures.ts` to barrel

**async.ts (224 LOC):**
1. Create `src/utils/async-retry-logic.ts`, `src/utils/async-debounce-throttle.ts`
2. Slim `async.ts` to barrel

**a11y.ts (222 LOC):**
1. Create `src/utils/a11y-aria-helpers.ts`, `src/utils/a11y-focus-trap.ts`
2. Slim `a11y.ts` to barrel

**security.ts (221 LOC):**
1. Create `src/utils/security-sanitize.ts`, `src/utils/security-input-validation.ts`
2. Slim `security.ts` to barrel

### Step 7: Split store + vibe-payment

**walletSlice.ts (243 LOC):**
1. Create `src/store/slices/wallet-slice-types.ts` — WalletState, WalletActions
2. Create `src/store/slices/wallet-slice-actions.ts` — action creators
3. Slim `walletSlice.ts` to slice definition

**autonomous-webhook-handler.ts (236 LOC):**
1. Create `src/lib/vibe-payment/webhook-handler-types.ts`
2. Create `src/lib/vibe-payment/webhook-event-processors.ts`
3. Slim original to handler orchestration

### Step 8: Verify
```bash
pnpm build && pnpm test
```

## Todo List
- [ ] Split `types.ts` (292 LOC) into domain type files
- [ ] Split `data/mockData.ts` (513 LOC) into domain mock files
- [ ] Split 4 agent files (ScoutAgent, SalesCopilot, AgencyOS, GeminiCoach)
- [ ] Split 3 service files (referral, audit-log, copilot)
- [ ] Split `hooks/use-agent-chat.ts` (281 LOC)
- [ ] Split 6 util files (deep, dom, gestures, async, a11y, security)
- [ ] Split `store/slices/walletSlice.ts` (243 LOC)
- [ ] Split `lib/vibe-payment/autonomous-webhook-handler.ts` (236 LOC)
- [ ] Build passes
- [ ] Tests pass

## Success Criteria
- All 14 files under 200 LOC
- All barrel re-exports preserve existing `import { X } from '@/utils/deep'` paths
- No behavior change — pure structural refactor
- `pnpm build` exits 0

## Conflict Prevention
- **Exclusive ownership**: files listed above owned solely by this phase
- Phase 02 owns `src/lib/vibe-agent/**` — this phase owns `src/lib/vibe-payment/**`
- Phase 03 owns `src/pages/**` — no overlap
- Phase 04 owns `src/components/**` — no overlap
- `types.ts` barrel preserves `from '@/types'` import path

## Risk Assessment
- MEDIUM: `types.ts` split affects many importers — barrel must re-export everything
  - Mitigation: keep `types.ts` as barrel, grep `from '@/types'` to verify coverage
- MEDIUM: util barrel files must preserve all named exports
  - Mitigation: each original file becomes a re-export barrel
- LOW: Agent prompt extraction is pure string extraction
- LOW: mockData split only affects test files

## Security Considerations
- `security.ts` split: sanitization + validation logic must remain correct after extraction
- Webhook handler: payment event processing logic must not lose error handling during split
