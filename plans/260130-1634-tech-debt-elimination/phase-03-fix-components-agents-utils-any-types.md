# Phase 03: Fix Components & UI `: any` Types

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [Phase 02: Hooks & Services](./phase-02-fix-hooks-services-any-types.md)

## Overview

**Priority:** P0 (GO-LIVE blocker)
**Status:** Completed
**Effort:** 1h
**Risk:** Low-Medium (UI components + agent + utility)

Fix 3 `: any` occurrences in components, agents, and utilities.

## Files to Modify

### 1. `src/components/Dashboard/LiveActivitiesTicker.tsx` (1 occurrence)
**Line:** 21
**Context:** Icon prop type in Activity interface

### 2. `src/agents/custom/SalesCopilotAgent.ts` (1 occurrence)
**Line:** 68
**Context:** Gemini AI model instance type

### 3. `src/styles/design-tokens.ts` (1 occurrence)
**Line:** 132
**Context:** Color path traversal utility

## Implementation Steps

### Step 1: Fix LiveActivitiesTicker.tsx

**Line 21 - Icon prop type:**
```typescript
// BEFORE
interface Activity {
  id: string;
  name: string;
  action: string;
  time: string;
  location?: string;
  bgColor?: string;
  color?: string;
  icon?: any;
}

// AFTER
import type { LucideIcon } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  action: string;
  time: string;
  location?: string;
  bgColor?: string;
  color?: string;
  icon?: LucideIcon;
}
```

**Rationale:** WellNexus uses lucide-react for icons. All icon props should be `LucideIcon` type.

### Step 2: Fix SalesCopilotAgent.ts

**Line 68 - Gemini model type:**
```typescript
// BEFORE
import { GoogleGenerativeAI } from '@google/generative-ai';

export class SalesCopilotAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // ...
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }
}

// AFTER
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export class SalesCopilotAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    // ...
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }
}
```

**Rationale:** `GenerativeModel` is the proper export from `@google/generative-ai` package.

### Step 3: Fix design-tokens.ts

**Line 132 - Color path traversal:**
```typescript
// BEFORE
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = designTokens;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Color path not found: ${path}`);
      return '#000000';
    }
  }

  return typeof value === 'string' ? value : '#000000';
}

// AFTER
type NestedColorValue = string | { [key: string]: NestedColorValue };

export function getColor(path: string): string {
  const keys = path.split('.');
  let value: NestedColorValue = designTokens;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Color path not found: ${path}`);
      return '#000000';
    }
  }

  return typeof value === 'string' ? value : '#000000';
}
```

**Rationale:** Recursive type definition properly represents nested color token structure.

## Todo List

- [x] Fix LiveActivitiesTicker.tsx
  - [x] Import LucideIcon type
  - [x] Update Activity interface
  - [x] Verify icon usage in component
- [x] Fix SalesCopilotAgent.ts
  - [x] Import GenerativeModel
  - [x] Update model property type
  - [x] Verify Gemini API calls
- [x] Fix design-tokens.ts
  - [x] Create NestedColorValue type
  - [x] Update getColor function
  - [x] Test color path traversal
- [x] Run `npm run test:run`
- [x] Run `tsc --noEmit`
- [x] Commit changes

## Success Criteria

- ✅ All 3 `: any` in components/agents/utils replaced
- ✅ All 230 tests pass
- ✅ TypeScript compilation produces 0 errors
- ✅ Icon rendering works correctly
- ✅ Gemini AI agent functions properly
- ✅ Color utility returns correct values

## Risk Assessment

**Risks:**
- LucideIcon import path incorrect
- GenerativeModel type mismatch with actual usage
- NestedColorValue type too restrictive for token structure

**Mitigation:**
- Verify lucide-react exports (standard package)
- Check @google/generative-ai type definitions
- Test color path with actual design token paths
- Run full test suite to verify UI components

## Related Code Files

**Files using icons:**
- Check icon prop usage in LiveActivitiesTicker
- Verify lucide-react version in package.json

**Files using Gemini:**
- SalesCopilotAgent.ts (primary)
- GeminiCoachAgent.ts (may have similar pattern)

**Files using design tokens:**
- Components consuming getColor()
- Theme system integration

## Next Steps

After completion, proceed to [Phase 04: Verification & Build](./phase-04-verification-and-build.md)
