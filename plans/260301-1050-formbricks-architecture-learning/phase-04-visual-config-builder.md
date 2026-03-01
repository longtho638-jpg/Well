# Phase 4: Visual Config Builder

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-json-driven-flow-engine.md)
- Inspired by: Formbricks' drag-and-drop survey builder with live preview

## Overview
- **Date:** 2026-03-01
- **Priority:** P3
- **Implementation:** pending
- **Review:** pending

Admin UI for visually building agent flows, onboarding sequences, and trigger rules — without writing code. Builder state maps to JSON, preview renders production component.

## Key Insights

Formbricks: Builder UI = React state → JSON. Live preview renders same component as production widget. Undo/redo via state history. Auto-save.

## Requirements
- Drag-and-drop step editor for flows
- Live preview pane (renders FlowEngine from Phase 1)
- Undo/redo (state history stack)
- Auto-save to Supabase
- JSON import/export

## Architecture

```typescript
// admin-panel/src/pages/flow-builder.tsx
const FlowBuilder = () => {
  const [flow, dispatch] = useReducer(flowReducer, initialFlow);
  const [history, undo, redo] = useHistory(flow);

  return (
    <div className="grid grid-cols-2">
      <StepEditor flow={flow} dispatch={dispatch} />  {/* Left: editor */}
      <FlowPreview flow={flow} />                       {/* Right: live preview */}
    </div>
  );
};
```

## Implementation Steps
1. Create `FlowBuilder` page in admin panel
2. Create `StepEditor` with add/remove/reorder steps
3. Create step type selector (info, question, action, checkpoint)
4. Create `FlowPreview` using same FlowEngine component
5. Implement undo/redo with useReducer history pattern
6. Add auto-save (debounced 2s after last change)
7. Add JSON import/export buttons
8. Add flow publish/draft status toggle

## Todo
- [ ] FlowBuilder page layout
- [ ] StepEditor with CRUD operations
- [ ] Step type selector
- [ ] FlowPreview with live rendering
- [ ] Undo/redo system
- [ ] Auto-save
- [ ] JSON import/export
- [ ] Tests

## Success Criteria
- Admin can build complete flow visually (no code)
- Live preview matches production rendering
- Undo/redo works reliably
- Auto-save prevents data loss

## Risk Assessment
- **Medium:** Complex UI — build incrementally, simple editor first
- **Low:** Preview fidelity — uses same FlowEngine component

## Security Considerations
- Builder access admin-only (RBAC check)
- JSON import validated with Zod (prevent malicious schemas)

## Next Steps
- Extend builder for trigger rule configuration (Phase 2 integration)
