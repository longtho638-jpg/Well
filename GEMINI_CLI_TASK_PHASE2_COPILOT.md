# Task for Gemini CLI: Phase 2 - Copilot Agent Integration

## Context
✅ **Phase 1 Complete**: HealthCoach now uses GeminiCoachAgent

You are implementing **Phase 2**: Integrate SalesCopilotAgent into CopilotPage and TheCopilot component.

---

## Objectives

1. Modify `TheCopilot.tsx` component to use `useAgentOS` hook
2. Replace direct service calls with agent execution
3. Update `CopilotPage.tsx` if needed
4. Verify compilation

---

## Task 1: Modify TheCopilot Component

### File: `src/components/TheCopilot.tsx`

**Current Logic**: Component likely calls `copilotService.ts` directly for objection handling.

**Required Changes**:

1. Add import:
```typescript
import { useAgentOS } from '@/hooks/useAgentOS';
```

2. Use hook in component:
```typescript
const { executeAgent } = useAgentOS();
```

3. Replace service calls with agent execution:
```typescript
// BEFORE (if using copilotService directly):
// import { detectObjection, suggestResponse } from '@/services/copilotService';
// const response = suggestResponse(userMessage);

// AFTER:
const result = await executeAgent('Sales Copilot', {
  action: 'suggestResponse',
  message: userMessage
});

// result will be the suggested response text
```

---

## Task 2: Verify CopilotPage (if needed)

### File: `src/pages/CopilotPage.tsx`

Check if CopilotPage needs any modifications. If TheCopilot is already using the agent, CopilotPage likely doesn't need changes.

---

## Verification Steps

1. **Build Check**:
   ```bash
   npm run build
   ```
   Should compile without new errors.

2. **Runtime Test** (if possible):
   - Navigate to `/copilot`
   - Send objection message: "Sản phẩm đắt quá"
   - Verify agent suggests appropriate response

---

## Success Criteria

- ✅ TheCopilot component uses `useAgentOS` hook
- ✅ Agent execution replaces direct service calls
- ✅ TypeScript compiles successfully
- ✅ No new build errors introduced

---

## Deliverables

- Modified `src/components/TheCopilot.tsx`
- (Optional) Modified `src/pages/CopilotPage.tsx`

---

## Notes

- The `SalesCopilotAgent` already exists and is registered
- Agent handles objection detection and response automatically
- All interactions will be logged in `agentState.agentLogs`

Proceed with Phase 2 implementation.
