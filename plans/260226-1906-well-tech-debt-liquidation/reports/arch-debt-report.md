# Architecture & Tech Debt Report - Well Project
**Date:** 2026-02-26

## 1. File Size & Complexity (>200 lines)
- `src/hooks/useAdvanced.ts` (207 LOC): 6 mixed hooks. Needs splitting.
- `src/hooks/useDashboard.ts` (214 LOC): Hardcoded mock data & complex mapping.
- `src/store/index.ts`: "God Store" pattern. Logic should be in slices.

## 2. Business Logic Leakage
- `src/store/slices/walletSlice.ts`: Commission logic (21% vs 25%) hardcoded in store actions.

## 3. Placeholder Code
- `src/store/slices/teamSlice.ts`: `fetchTeamData` is still a placeholder.
