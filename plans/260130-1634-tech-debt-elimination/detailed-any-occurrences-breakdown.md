# Complete `: any` Occurrences Breakdown

**Total:** 31 occurrences across 11 files
**Generated:** 2026-01-30

## File-by-File Breakdown

### 📁 Test Files (21 occurrences - 68%)

#### 1. `src/__tests__/admin-logic.integration.test.ts` (14 occurrences)

| Line | Code | Fix |
|------|------|-----|
| 22 | `allAgents.map((a: any) => a.agent_name)` | `AgentDefinition` |
| 24-25 | `expect(agentNames).toContain(...)` | Context only |
| 41 | `allAgents.filter((a: any) => a.business_function === '...')` | `AgentDefinition` |
| 45 | `expect(opsAgents.some((a: any) => ...))` | `AgentDefinition` |
| 65 | `allAgents.map((agentDef: any) => { ... })` | `AgentDefinition` |
| 77 | `agentKPIs.find((a: any) => a.name === 'AgencyOS')` | `{ name: string; kpis: KPI[] }` |
| 100 | `allAgents.forEach((agentDef: any) => { ... })` | `AgentDefinition` |
| 123 | `kpis.find((k: any) => k.name === 'Commands Executed')` | `KPI` |
| 137 | `kpis.find((k: any) => k.name === 'Success Rate')` | `KPI` |
| 197 | `allAgents.map((a: any) => a.agent_name)` | `AgentDefinition` |
| 203 | `allAgents.forEach((agentDef: any) => { ... })` | `AgentDefinition` |
| 238 | `updatedKPIs.find((k: any) => k.name === 'Commands Executed')` | `KPI` |
| 243 | `agentRegistry.listAll().map((agentDef: any) => { ... })` | `AgentDefinition` |
| 257 | `dashboardData.forEach((data: any) => { ... })` | `{ name: string; kpis: KPI[]; ... }` |
| 281 | `as { success: boolean; suggestion: any[] }` | `SearchResult` |

#### 2. `src/__tests__/user-flows.integration.test.ts` (5 occurrences)

| Line | Code | Fix |
|------|------|-----|
| 25 | `as { success: boolean; suggestion: any[] }` | `SearchResult` |
| 94 | `results.forEach((result: any) => { ... })` | `ExecuteResult` |
| 218 | `kpis.find((k: any) => k.name === 'Commands Executed')` | `KPI` |
| 275 | `as { success: boolean; suggestion: any[] }` | `SearchResult` |
| 301 | `kpis.find((k: any) => k.name === 'Commands Executed')` | `KPI` |

#### 3. `src/components/Dashboard/CommissionWidget.test.tsx` (1 occurrence)

| Line | Code | Fix |
|------|------|-----|
| 42 | `(storeModule.useStore as any).mockImplementation((selector: any) => { ... })` | `(storeModule.useStore as unknown as jest.Mock).mockImplementation((selector: (state: StoreState) => unknown) => { ... })` |

#### 4. `src/components/marketplace/QuickPurchaseModal.test.tsx` (2 occurrences)

| Line | Code | Fix |
|------|------|-----|
| 10 | `t: (key: string, params: any) => { ... }` | `t: (key: string, params?: Record<string, string \| number>) => { ... }` |
| 56 | `(storeModule.useStore as any).mockImplementation((selector: any) => { ... })` | `(storeModule.useStore as unknown as jest.Mock).mockImplementation((selector: (state: StoreState) => unknown) => { ... })` |

---

### 🎣 Hooks (4 occurrences - 13%)

#### 5. `src/hooks/useTranslation.ts` (2 occurrences)

| Line | Code | Fix |
|------|------|-----|
| 6 | `type SimpleT = (key: string, ...args: any[]) => string;` | `type TranslationFunction = (key: string, options?: TOptions \| string) => string;` |
| 24 | `const t: SimpleT = (key: string, ...args: any[]): string => { ... }` | `const t: TranslationFunction = (key: string, options?: TOptions \| string): string => { ... }` |

#### 6. `src/hooks/useReferral.ts` (2 occurrences)

| Line | Code | Fix |
|------|------|-----|
| 46 | `treeData.map((u: any) => ({ ... }))` | `treeData.map((u: ReferralTreeNode) => ({ ... }))` |
| 78 | `(f1Data \|\| []).map((u: any) => ({ ... }))` | `(f1Data \|\| []).map((u: ReferralTreeNode) => ({ ... }))` |

---

### 🔧 Services (1 occurrence - 3%)

#### 7. `src/services/orderService.ts` (1 occurrence)

| Line | Code | Fix |
|------|------|-----|
| 23 | `metadata?: any;` | `metadata?: OrderMetadata;` (with interface definition) |

---

### 🎨 Components (3 occurrences - 10%)

#### 8. `src/components/Dashboard/LiveActivitiesTicker.tsx` (1 occurrence)

| Line | Code | Fix |
|------|------|-----|
| 21 | `icon?: any;` | `icon?: LucideIcon;` (import from 'lucide-react') |

---

### 🤖 Agents (1 occurrence - 3%)

#### 9. `src/agents/custom/SalesCopilotAgent.ts` (1 occurrence)

| Line | Code | Fix |
|------|------|-----|
| 68 | `private model: any;` | `private model: GenerativeModel;` (import from '@google/generative-ai') |

---

### 📘 Type Definitions (1 occurrence - 3%)

#### 10. `src/types/i18next.d.ts` (1 occurrence)

| Line | Code | Fix |
|------|------|-----|
| 6 | `resources: any;` | **KEEP AS IS** - Intentional to avoid deep recursion |

**Note:** This is an acceptable use of `any` - i18next's resource types can cause excessively deep type instantiation. Comment explains rationale.

---

### 🎨 Utilities (1 occurrence - 3%)

#### 11. `src/styles/design-tokens.ts` (1 occurrence)

| Line | Code | Fix |
|------|------|-----|
| 132 | `let value: any = designTokens;` | `let value: NestedColorValue = designTokens;` (with recursive type) |

---

## Type Definitions to Create

### Test Files
```typescript
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

interface ExecuteResult {
  success: boolean;
  [key: string]: unknown;
}
```

### Hooks
```typescript
// useTranslation.ts
import type { TOptions } from 'i18next';
type TranslationFunction = (key: string, options?: TOptions | string) => string;

// useReferral.ts
interface ReferralTreeNode {
  id: string;
  sponsor_id: string | null;
  email: string;
  full_name: string;
  created_at: string;
  level?: number;
}
```

### Services
```typescript
interface OrderMetadata {
  source?: string;
  campaign?: string;
  notes?: string;
  [key: string]: string | number | boolean | undefined;
}
```

### Components
```typescript
import type { LucideIcon } from 'lucide-react';
// Use LucideIcon for icon props
```

### Agents
```typescript
import { GenerativeModel } from '@google/generative-ai';
// Use GenerativeModel for Gemini model instances
```

### Utilities
```typescript
type NestedColorValue = string | { [key: string]: NestedColorValue };
```

---

## Statistics

**By Category:**
- Test Files: 21 (68%)
- Hooks: 4 (13%)
- Components: 3 (10%)
- Services: 1 (3%)
- Agents: 1 (3%)
- Types: 1 (3%) - Intentional, keep as-is
- Utilities: 1 (3%)

**By Fix Type:**
- Interface/Type creation: 8 new types
- Import existing types: 2 (LucideIcon, GenerativeModel)
- Use built-in types: 1 (TOptions from i18next)
- Keep as-is: 1 (i18next resources)

**Complexity:**
- Simple fixes (direct type replacement): 24 (77%)
- Medium fixes (new interface needed): 6 (19%)
- Keep as documented exception: 1 (3%)

---

## Verification Commands

```bash
# Find all `: any` in src/
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"

# Count occurrences
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l

# Expected after fixes: 1 (i18next.d.ts only, which is intentional)
```
