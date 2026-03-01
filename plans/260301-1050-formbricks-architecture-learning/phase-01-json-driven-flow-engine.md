# Phase 1: JSON-Driven Flow Engine

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: Formbricks' survey JSON schema with question types, conditional logic, piping

## Overview
- **Date:** 2026-03-01
- **Priority:** P1 — Foundation for configurable flows
- **Implementation:** pending
- **Review:** pending

Create JSON-driven flow engine for distributor onboarding, training quizzes, and agent conversation templates. Flows defined as JSON (not code) — admin editable, versionable, A/B testable.

## Key Insights

Formbricks: Survey = JSON array of questions with type, logic, validation. Branching via conditions. Piping enables dynamic content. Versioning enables iteration without breaking live surveys.

**Applied to Well:** Distributor onboarding = flow definition. Training quizzes = flow definition. Agent conversation templates = flow definition. All defined in JSON, rendered by universal FlowEngine component.

## Requirements
- Flow schema: steps array with type, content, logic, validation
- Step types: info, question, action, checkpoint
- Conditional branching (if answer=X, go to step Y)
- Template variables ({{user.name}}, {{commission.total}})
- Flow versioning in Supabase

## Architecture

```typescript
// src/modules/flows/types.ts
interface FlowDefinition {
  id: string;
  version: number;
  name: string;
  steps: FlowStep[];
  variables: Record<string, string>;
}

interface FlowStep {
  id: string;
  type: 'info' | 'question' | 'action' | 'checkpoint';
  content: string;          // supports {{variables}}
  options?: FlowOption[];   // for question type
  logic?: FlowLogic[];      // conditional branching
  validation?: ZodSchema;
}

interface FlowLogic {
  condition: { field: string; operator: string; value: unknown };
  target: string;  // step ID to jump to
}
```

## Implementation Steps
1. Define `FlowDefinition`, `FlowStep`, `FlowLogic` types
2. Create `FlowEngine` React component — renders steps sequentially
3. Implement conditional branching logic (evaluate conditions → jump to target)
4. Implement template variable interpolation ({{user.name}} → actual value)
5. Create step type renderers (InfoStep, QuestionStep, ActionStep, CheckpointStep)
6. Store flow definitions in Supabase `flow_definitions` table
7. Create onboarding flow as first JSON definition
8. Add flow versioning (immutable versions, active flag)

## Todo
- [ ] Define flow types (FlowDefinition, FlowStep, FlowLogic)
- [ ] Create FlowEngine component
- [ ] Implement branching logic
- [ ] Implement variable interpolation
- [ ] Create step type renderers
- [ ] Supabase table for flow definitions
- [ ] Create onboarding flow JSON
- [ ] Flow versioning
- [ ] Tests

## Success Criteria
- Onboarding flow renders correctly from JSON definition
- Conditional branching works (different paths based on answers)
- Template variables resolve to actual user data
- Admin can edit flow JSON without code deploy

## Risk Assessment
- **Medium:** Complex branching logic — validate no infinite loops
- **Low:** JSON schema complexity — start simple, iterate

## Security Considerations
- Template variables must be whitelisted (no arbitrary data access)
- Flow definitions validated with Zod before storage
- User responses validated per step

## Next Steps
- Phase 2 uses flows as targets for event-based triggers
- Phase 4 provides visual editor for flow JSON
