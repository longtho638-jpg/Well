# Phase 2: Event-Based Targeting System

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-json-driven-flow-engine.md)
- Inspired by: Formbricks' targeting rules, triggers, segments, display rules

## Overview
- **Date:** 2026-03-01
- **Priority:** P1
- **Implementation:** pending
- **Review:** pending

Show right content to right distributor at right time. Event-based triggers activate flows, prompts, or agent coaching based on user behavior and attributes.

## Key Insights

Formbricks: Triggers = events (page visit, click, custom). Target = user attributes (role, plan, date). Segments = saved filters. Display rules = frequency cap, delay, sampling. Decoupled from content.

**Applied to Well:** Trigger coaching when sales drop 3 consecutive days. Show upgrade prompt when distributor hits tier threshold. Display training quiz after first week. Target premium agent features to Partner+ rank.

## Requirements
- Event emitter for distributor actions (page view, purchase, agent use)
- Targeting rules: user attributes (rank, join_date, team_size)
- Segment definitions (new users, power users, inactive)
- Display rules (max 1 prompt/day, 5s delay, 20% sampling)
- Trigger → Flow mapping

## Architecture

```typescript
// src/modules/targeting/types.ts
interface TriggerRule {
  id: string;
  event: string;                    // 'page_view', 'purchase', 'agent_used'
  conditions: TargetCondition[];    // user attribute filters
  segment?: string;                 // saved segment ID
  display: DisplayRules;
  action: TriggerAction;            // show flow, show prompt, activate agent
}

interface DisplayRules {
  maxPerDay: number;
  delayMs: number;
  samplingRate: number;  // 0.0 - 1.0
  cooldownMs: number;
}

// src/modules/targeting/event-emitter.ts
class DistributorEventEmitter {
  emit(event: string, data?: Record<string, unknown>): void;
  on(event: string, handler: EventHandler): void;
  evaluateRules(event: string, user: User): TriggerAction[];
}
```

## Implementation Steps
1. Create `DistributorEventEmitter` singleton
2. Define event types (page_view, purchase, agent_used, milestone_reached)
3. Create `TriggerRule` and `TargetCondition` types
4. Implement rule evaluation engine (match events + conditions)
5. Create `DisplayRules` with frequency cap, delay, sampling
6. Emit events from key touchpoints (dashboard load, purchase complete, etc.)
7. Create Segment definitions (new_user, power_user, inactive, about_to_churn)
8. Map triggers to flow/prompt/agent actions
9. Store trigger configs in Supabase (admin-editable)

## Todo
- [ ] Create event emitter
- [ ] Define event types
- [ ] Implement rule evaluation
- [ ] Display rules (frequency, delay, sampling)
- [ ] Emit events from touchpoints
- [ ] Segment definitions
- [ ] Trigger-to-action mapping
- [ ] Store in Supabase
- [ ] Tests

## Success Criteria
- Events fire on key user actions
- Rules correctly match events + user attributes
- Display rules prevent over-prompting (max 1/day respected)
- Triggers activate correct flows/prompts

## Risk Assessment
- **Low:** Event emission is lightweight — no performance impact
- **Medium:** Rule evaluation on every event — optimize with pre-filtering

## Security Considerations
- Event data sanitized before storage
- Trigger rules admin-only editable
- User attribute access follows RLS

## Next Steps
- Phase 5 extends with detailed action tracking and behavioral patterns
