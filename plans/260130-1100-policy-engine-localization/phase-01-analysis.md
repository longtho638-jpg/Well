# Phase 1: Analysis & Key Mapping

## Context
`PolicyEngine.tsx` uses `policyengine` keys (lowercase). `en.ts` has `admin.policy`. We need to align them.

## Keys Used in PolicyEngine.tsx
Based on quick scan:
- `policyengine.synchronizing_policy_core`
- `policyengine.policy_engine`
- `policyengine.v3_1`
- `policyengine.strategic_integrity_confirmed`
- `policyengine.sync`
- `policyengine.projection_simulator`
- `policyengine.real_time`
- `policyengine.policy_changes_are_cryptograph`

## Action Items
1.  Scan `PolicyEngine.tsx` for all usage of `t()`.
2.  Check `src/locales/vi.ts` for existing `policyengine` keys.
3.  Define the standard `policyEngine` structure for `en.ts` and `vi.ts`.
