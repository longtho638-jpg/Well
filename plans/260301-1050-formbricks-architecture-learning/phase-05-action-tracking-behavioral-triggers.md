# Phase 5: Action Tracking & Behavioral Triggers

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 2](./phase-02-event-based-targeting.md)
- Inspired by: Formbricks' action classes, user identification, session tracking

## Overview
- **Date:** 2026-03-01
- **Priority:** P3
- **Implementation:** pending
- **Review:** pending

Track distributor actions as first-class entities. Enable behavioral triggers based on action patterns (sequence, count, absence). Power intelligent coaching and engagement.

## Key Insights

Formbricks: Actions = trackable behaviors, not just events. Action history enables sequencing ("after 3rd purchase"). Session grouping. No-code action definition via CSS selector/URL.

## Requirements
- Action tracking for key distributor behaviors
- Action history per user (stored in Supabase)
- Pattern-based triggers (count, sequence, absence)
- Admin-configurable action definitions

## Architecture

```typescript
// src/modules/tracking/types.ts
interface DistributorAction {
  id: string;
  userId: string;
  actionType: string;
  metadata: Record<string, unknown>;
  sessionId: string;
  timestamp: Date;
}

type BehaviorPattern =
  | { type: 'count'; action: string; threshold: number; period: string }     // "5 purchases in 7d"
  | { type: 'sequence'; actions: string[]; withinMs: number }                 // "view → cart → purchase"
  | { type: 'absence'; action: string; durationMs: number };                  // "no login for 7 days"
```

## Implementation Steps
1. Create `distributor_actions` Supabase table
2. Define `DistributorAction` type and tracking service
3. Instrument key touchpoints (dashboard view, purchase, agent use, team invite)
4. Create behavior pattern evaluator (count, sequence, absence)
5. Connect patterns to triggers from Phase 2
6. Create admin UI for action analytics (most common actions, user paths)
7. Add churn prediction pattern (no login 7d + no purchase 14d)
8. Add milestone celebration pattern (10th purchase, first team member)

## Todo
- [ ] Create Supabase table
- [ ] Tracking service with action types
- [ ] Instrument 6+ key touchpoints
- [ ] Behavior pattern evaluator
- [ ] Connect to targeting system
- [ ] Admin analytics UI
- [ ] Churn prediction pattern
- [ ] Milestone celebration pattern
- [ ] Tests

## Success Criteria
- All key distributor actions tracked
- Behavioral patterns correctly trigger automations
- Churn prediction fires for inactive distributors
- Milestone celebrations engage active distributors

## Risk Assessment
- **Low:** Action tracking is lightweight (async insert)
- **Medium:** Pattern evaluation cost — batch evaluate on intervals, not real-time

## Security Considerations
- Action data anonymizable for analytics
- No sensitive content in action metadata
- RLS ensures users only see own actions, admins see all

## Next Steps
- Formbricks learning series complete
- Feed insights into unified architecture with Cal.com + Portkey + NiceGUI patterns
