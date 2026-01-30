# Tech Debt Elimination Plan - Quick Reference

**Plan Directory:** `/Users/macbookprom1/Well/plans/260130-1634-tech-debt-elimination/`
**Created:** 2026-01-30
**Status:** Pending
**Priority:** P0 (GO-LIVE blocker)

## 🎯 Mission

Eliminate all 31 `: any` type annotations in src/ to achieve strict TypeScript compliance before GO-LIVE.

## 📊 Scope

| Category | Files | Occurrences |
|----------|-------|-------------|
| Test Files | 3 | 21 (68%) |
| Hooks | 2 | 4 |
| Services | 1 | 1 |
| Components | 2 | 3 |
| Agents | 1 | 1 |
| Types | 1 | 1 (note: intentional for i18next) |
| **TOTAL** | **11** | **31** |

## 📋 Phase Execution Order

1. **Phase 01:** Fix Test Files (1h) - Lowest risk
   - 3 files, 21 occurrences
   - [Details](./phase-01-fix-test-files-any-types.md)

2. **Phase 02:** Fix Hooks & Services (1.5h) - Production code
   - useTranslation, useReferral, orderService
   - [Details](./phase-02-fix-hooks-services-any-types.md)

3. **Phase 03:** Fix Components & UI (1h) - UI layer
   - LiveActivitiesTicker, SalesCopilotAgent, design-tokens
   - [Details](./phase-03-fix-components-agents-utils-any-types.md)

4. **Phase 04:** Verification & Build (30min) - Quality gates
   - TypeScript check, build, tests
   - [Details](./phase-04-verification-and-build.md)

## ✅ Success Criteria

- [ ] Zero `: any` types in src/
- [ ] `tsc --noEmit` → 0 errors
- [ ] `npm run build` → Pass (<5s)
- [ ] `npm run test:run` → 230/230 tests passing
- [ ] Bundle size ≤ 250KB (baseline: 201KB)

## 🚀 Quick Start

```bash
# Navigate to project
cd /Users/macbookprom1/Well

# Start with Phase 01
# See: phase-01-fix-test-files-any-types.md

# After each phase:
npm run test:run  # Verify tests pass
tsc --noEmit      # Verify no TS errors
```

## 🎖️ Type Definitions to Create

1. **Tests:** AgentDefinition, KPI, SearchResult, ExecuteResult
2. **Hooks:** TranslationFunction, ReferralTreeNode
3. **Services:** OrderMetadata
4. **Components:** LucideIcon (import)
5. **Agents:** GenerativeModel (import)
6. **Utils:** NestedColorValue

## ⚠️ Key Considerations

- **i18next:** Already has `resources: any` in type definition (acceptable)
- **RPC Data:** Use minimal interfaces (only fields actually used)
- **Metadata:** Add index signature for extensibility
- **Test Mocks:** Use `unknown` before casting to jest.Mock

## 📝 Notes

- **Good News:** Zero TODO/FIXME comments found!
- **Strategy:** Test files first (68% of occurrences, lowest risk)
- **YAGNI:** Create minimal types only for actual usage
- **Incremental:** Commit after each phase for safety

## 🔗 Related Files

- **Config:** `/tsconfig.json` (strict: true enabled)
- **Types:** `/src/types/i18next.d.ts`
- **Tests:** `/src/__tests__/*.test.ts`
- **Hooks:** `/src/hooks/use*.ts`
