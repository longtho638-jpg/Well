# Phase 01: Fix Test Files `: any` Types

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Test Suite: `/src/__tests__/`

## Overview

**Priority:** P0 (GO-LIVE blocker)
**Status:** Pending
**Effort:** 1h
**Risk:** Low (test-only changes)

Fix 21 `: any` occurrences across 3 test files. Test files are lowest risk since they don't affect production code.

## Files to Modify

### 1. `src/__tests__/admin-logic.integration.test.ts` (14 occurrences)
**Pattern:** Array methods using `(item: any) =>` in filters/maps
**Lines:** 22, 24, 25, 41, 45, 65, 77, 100, 123, 137, 197, 203, 238, 243, 257, 281

### 2. `src/__tests__/user-flows.integration.test.ts` (5 occurrences)
**Pattern:** Type assertions and array callbacks
**Lines:** 25, 94, 218, 275, 301

### 3. `src/components/Dashboard/CommissionWidget.test.tsx` (1 occurrence)
**Pattern:** Mock implementation selector
**Line:** 42

### 4. `src/components/marketplace/QuickPurchaseModal.test.tsx` (2 occurrences)
**Pattern:** Mock translation params + store selector
**Lines:** 10, 56

## Implementation Steps

### Step 1: Create Type Definitions
```typescript
// Add to relevant test files as needed
interface AgentDefinition {
  agent_name: string;
  business_function: string;
  core_actions: string[];
}

interface KPI {
  name: string;
  current: number;
  target?: number;
}

interface SearchResult {
  success: boolean;
  suggestion: string[];
}
```

### Step 2: Fix admin-logic.integration.test.ts

**Lines 22, 24-25, 41, 45, 197, 203:**
```typescript
// BEFORE
const agentNames = allAgents.map((a: any) => a.agent_name);
const opsAgents = allAgents.filter((a: any) => a.business_function === 'Operations & Logistics');
allAgents.forEach((agentDef: any) => { ... });

// AFTER
const agentNames = allAgents.map((a: AgentDefinition) => a.agent_name);
const opsAgents = allAgents.filter((a: AgentDefinition) => a.business_function === 'Operations & Logistics');
allAgents.forEach((agentDef: AgentDefinition) => { ... });
```

**Lines 65, 243:**
```typescript
// BEFORE
const agentKPIs = allAgents.map((agentDef: any) => { ... });

// AFTER
const agentKPIs = allAgents.map((agentDef: AgentDefinition) => { ... });
```

**Lines 77, 123, 137, 257:**
```typescript
// BEFORE
const agencyOSKPIs = agentKPIs.find((a: any) => a.name === 'AgencyOS');
const commandsExecuted = kpis.find((k: any) => k.name === 'Commands Executed');

// AFTER
const agencyOSKPIs = agentKPIs.find((a: { name: string; kpis: KPI[] }) => a.name === 'AgencyOS');
const commandsExecuted = kpis.find((k: KPI) => k.name === 'Commands Executed');
```

**Line 281:**
```typescript
// BEFORE
}) as { success: boolean; suggestion: any[] };

// AFTER
}) as SearchResult;
```

### Step 3: Fix user-flows.integration.test.ts

**Lines 25, 275:**
```typescript
// BEFORE
}) as { success: boolean; suggestion: any[] };

// AFTER
}) as SearchResult;
```

**Lines 94, 218, 301:**
```typescript
// BEFORE
results.forEach((result: any) => { ... });
const commandsExecuted = kpis.find((k: any) => k.name === 'Commands Executed');

// AFTER
interface ExecuteResult { success: boolean; [key: string]: unknown }
results.forEach((result: ExecuteResult) => { ... });
const commandsExecuted = kpis.find((k: KPI) => k.name === 'Commands Executed');
```

### Step 4: Fix CommissionWidget.test.tsx

**Line 42:**
```typescript
// BEFORE
(storeModule.useStore as any).mockImplementation((selector: any) => { ... });

// AFTER
interface StoreState { transactions: Transaction[] }
(storeModule.useStore as unknown as jest.Mock).mockImplementation(
  (selector: (state: StoreState) => unknown) => { ... }
);
```

### Step 5: Fix QuickPurchaseModal.test.tsx

**Line 10:**
```typescript
// BEFORE
t: (key: string, params: any) => { ... }

// AFTER
t: (key: string, params?: Record<string, string | number>) => { ... }
```

**Line 56:**
```typescript
// BEFORE
(storeModule.useStore as any).mockImplementation((selector: any) => { ... });

// AFTER
interface StoreState { products: Product[]; transactions: Transaction[] }
(storeModule.useStore as unknown as jest.Mock).mockImplementation(
  (selector: (state: StoreState) => unknown) => { ... }
);
```

## Todo List

- [ ] Add type definitions to test files
- [ ] Fix admin-logic.integration.test.ts (14 occurrences)
- [ ] Fix user-flows.integration.test.ts (5 occurrences)
- [ ] Fix CommissionWidget.test.tsx (1 occurrence)
- [ ] Fix QuickPurchaseModal.test.tsx (2 occurrences)
- [ ] Run `npm run test:run` (verify 230 tests pass)
- [ ] Run `tsc --noEmit` (verify 0 errors)
- [ ] Commit changes

## Success Criteria

- ✅ All 21 `: any` in test files replaced with proper types
- ✅ All 230 tests pass
- ✅ TypeScript compilation produces 0 errors
- ✅ No runtime behavior changes

## Risk Assessment

**Risks:**
- Incorrect type assumptions breaking tests
- Mock implementations incompatible with new types

**Mitigation:**
- Test after each file modification
- Use existing type definitions from `/src/types/`
- Leverage TypeScript inference where possible

## Next Steps

After completion, proceed to [Phase 02: Hooks & Services](./phase-02-fix-hooks-services-any-types.md)
