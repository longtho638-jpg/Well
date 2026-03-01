# Phase 3: Agent Guardrails Pipeline

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-ai-gateway-service-layer.md)
- Inspired by: Portkey's pre/post-processing hooks, content moderation middleware

## Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Implementation:** pending
- **Review:** pending

Add composable middleware pipeline to AI gateway — pre-request hooks (input sanitization, PII scrubbing) and post-response hooks (output validation, format compliance, Vietnamese content checks).

## Key Insights

Portkey's guardrails: ordered middleware chain, each hook can modify/reject/pass through. Independent hooks — add/remove without affecting others. Async execution.

**Applied to Well:** Agent responses need guardrails for Vietnamese financial compliance (no unlicensed financial advice), PII protection (don't leak distributor personal data in AI responses), output format consistency.

## Requirements
- Composable middleware pipeline (pre + post hooks)
- Built-in guardrails: PII detection, content length limits, Vietnamese compliance
- Custom guardrails per agent type
- Hooks don't block streaming (post-hooks validate complete response)

## Architecture

```typescript
// src/shared/services/ai-guardrails.ts
type GuardrailHook = (ctx: GuardrailContext) => Promise<GuardrailResult>;

interface GuardrailResult {
  action: 'pass' | 'modify' | 'reject';
  data?: string;         // modified content
  reason?: string;       // rejection reason
}

const defaultPipeline: GuardrailPipeline = {
  pre: [sanitizeInput, detectPII, enforceMaxLength],
  post: [validateJSON, checkContentPolicy, formatVietnamese]
};
```

## Implementation Steps
1. Define `GuardrailHook`, `GuardrailContext`, `GuardrailResult` types
2. Create `GuardrailPipeline` executor (runs hooks in order, stops on reject)
3. Implement `sanitizeInput` — strip HTML/script tags from user input
4. Implement `detectPII` — flag messages containing phone/email/ID patterns
5. Implement `enforceMaxLength` — cap input tokens to prevent abuse
6. Implement `validateOutput` — ensure response is valid, non-empty
7. Implement `checkContentPolicy` — block financial advice violations
8. Integrate pipeline into `AIGateway.chat()` (pre before provider, post after)
9. Allow per-agent custom guardrail configs

## Todo
- [ ] Define guardrail types and pipeline executor
- [ ] Implement 3 pre-hooks (sanitize, PII, length)
- [ ] Implement 3 post-hooks (validate, policy, format)
- [ ] Integrate into AIGateway
- [ ] Per-agent guardrail config
- [ ] Tests for each guardrail hook

## Success Criteria
- PII patterns detected and scrubbed before reaching LLM
- Content policy violations blocked with user-friendly message
- Pipeline adds <10ms overhead per request
- Guardrails configurable per agent (strict for Coach, relaxed for Copilot)

## Risk Assessment
- **Low:** False positives on PII detection — use conservative patterns, log for review
- **Low:** Performance overhead — hooks are simple string operations

## Security Considerations
- PII scrubbing protects distributor data from LLM training
- Content policy prevents regulatory violations
- Input sanitization blocks prompt injection attempts

## Next Steps
- Phase 5 (Observability) logs guardrail actions (how many blocked, why)
