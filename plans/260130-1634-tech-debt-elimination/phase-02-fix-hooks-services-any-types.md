# Phase 02: Fix Hooks & Services `: any` Types

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [Phase 01: Test Files](./phase-01-fix-test-files-any-types.md)

## Overview

**Priority:** P0 (GO-LIVE blocker)
**Status:** Pending
**Effort:** 1.5h
**Risk:** Medium (production code changes)

Fix 5 `: any` occurrences across hooks and services that directly impact production code.

## Files to Modify

### 1. `src/hooks/useTranslation.ts` (2 occurrences)
**Lines:** 6, 24
**Context:** i18next wrapper with flexible translation params

### 2. `src/hooks/useReferral.ts` (2 occurrences)
**Lines:** 46, 78
**Context:** RPC response data mapping

### 3. `src/services/orderService.ts` (1 occurrence)
**Line:** 23
**Context:** Order metadata field

## Key Insights

**i18next Type Challenge:**
- Current `any` bypasses i18next's complex generic types
- Comment states: "Disable strict type checking to avoid excessively deep recursion"
- Need balance between type safety and practicality

**RPC Data Mapping:**
- Supabase RPC returns untyped JSON
- Need proper interface for tree data structure

## Implementation Steps

### Step 1: Fix useTranslation.ts

**Check existing i18next types:**
```typescript
// File: src/types/i18next.d.ts (line 6)
resources: any; // Already disabled strict checking
```

**Solution: Create proper TFunction type**
```typescript
// BEFORE (lines 6, 24)
type SimpleT = (key: string, ...args: any[]) => string;
const t: SimpleT = (key: string, ...args: any[]): string => {
  return i18nT(key, ...args) as string;
};

// AFTER
import type { TOptions } from 'i18next';

type TranslationFunction = (
  key: string,
  options?: TOptions | string
) => string;

const t: TranslationFunction = (key: string, options?: TOptions | string): string => {
  return i18nT(key, options) as string;
};
```

**Rationale:** Use i18next's built-in `TOptions` type for translation parameters.

### Step 2: Fix useReferral.ts

**Create RPC Response Interface:**
```typescript
// Add near top of file
interface ReferralTreeNode {
  id: string;
  sponsor_id: string | null;
  email: string;
  full_name: string;
  created_at: string;
  level?: number;
}
```

**Lines 46, 78:**
```typescript
// BEFORE
const mappedReferrals: Referral[] = treeData.map((u: any) => ({ ... }));
const mappedReferrals: Referral[] = (f1Data || []).map((u: any) => ({ ... }));

// AFTER
const mappedReferrals: Referral[] = treeData.map((u: ReferralTreeNode) => ({
  id: u.id,
  referrerId: u.sponsor_id || user.id,
  referredUserId: u.id,
  // ... rest of mapping
}));

const mappedReferrals: Referral[] = (f1Data || []).map((u: ReferralTreeNode) => ({
  id: u.id,
  referrerId: user.id || '',
  referredUserId: u.id,
  // ... rest of mapping
}));
```

### Step 3: Fix orderService.ts

**Line 23 - Create Metadata Interface:**
```typescript
// BEFORE
interface CreateOrderInput {
  // ...
  metadata?: any;
}

// AFTER
interface OrderMetadata {
  source?: string;
  campaign?: string;
  notes?: string;
  [key: string]: string | number | boolean | undefined;
}

interface CreateOrderInput {
  // ...
  metadata?: OrderMetadata;
}
```

**Rationale:** Allow structured metadata with string index signature for flexibility.

## Todo List

- [ ] Fix useTranslation.ts
  - [ ] Import TOptions from i18next
  - [ ] Replace SimpleT with TranslationFunction
  - [ ] Update function signature
- [ ] Fix useReferral.ts
  - [ ] Create ReferralTreeNode interface
  - [ ] Replace both `(u: any)` occurrences
- [ ] Fix orderService.ts
  - [ ] Create OrderMetadata interface
  - [ ] Update CreateOrderInput
- [ ] Run `npm run test:run`
- [ ] Run `tsc --noEmit`
- [ ] Commit changes

## Success Criteria

- ✅ All 5 `: any` in hooks/services replaced
- ✅ All 230 tests pass
- ✅ TypeScript compilation produces 0 errors
- ✅ Existing functionality unchanged
- ✅ No i18next type recursion errors

## Risk Assessment

**Risks:**
- i18next TOptions type too strict for existing usage
- RPC data structure mismatch with interface
- Metadata usage expects broader types than defined

**Mitigation:**
- Use i18next's TOptions (flexible by design)
- Keep ReferralTreeNode minimal (only used fields)
- Add index signature to OrderMetadata for extensibility
- Test translation calls after changes
- Verify RPC mapping with actual Supabase data

## Security Considerations

- OrderMetadata now typed (prevents arbitrary object injection)
- RPC data validated through interface
- Translation params typed (prevents XSS via interpolation)

## Next Steps

After completion, proceed to [Phase 03: Components & UI](./phase-03-fix-components-ui-any-types.md)
