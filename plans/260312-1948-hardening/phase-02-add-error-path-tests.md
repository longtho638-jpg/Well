# Phase 2: Add Error Path Tests for License CRUD

## Context Links
- Parent Plan: [[260312-1948-hardening/plan.md]]
- Dependencies: None (can run in parallel with Phase 1)
- Related: `src/components/admin/LicenseActionsMenu.tsx`, `src/components/admin/CreateLicenseModal.tsx`

## Parallelization Info
- **Can run concurrently with:** Phase 1 (different file ownership)
- **Must complete before:** Phase 3 (test suite execution)

## Overview
- **Date:** 2026-03-12
- **Description:** Add comprehensive error handling tests for Phase 2.2 License CRUD components
- **Priority:** High
- **Implementation Status:** Pending
- **Review Status:** Pending

## Key Insights
- Phase 2.2 added LicenseActionsMenu and CreateLicenseModal
- Error paths need testing: API failures, validation errors, network issues
- Current components have try-catch but no test coverage for error states

## Requirements
- Test error states for suspend/unsuspend operations
- Test error states for tier changes
- Test error states for revoke operations
- Test form validation errors in CreateLicenseModal
- Test API failure scenarios with proper error UI

## Architecture
Tests will use React Testing Library with @testing-library/react and vi.mock() for Supabase client.

## Related Code Files
- `src/__tests__/components/__tests__/license-actions-menu.test.tsx` (create)
- `src/__tests__/components/__tests__/create-license-modal.test.tsx` (create)
- Source components (read only)

## File Ownership
**This phase owns:** New test files in `src/__tests__/components/__tests__/` - exclusive creation rights

## Implementation Steps
1. Create license-actions-menu.test.tsx with error scenarios
2. Create create-license-modal.test.tsx with validation errors
3. Mock Supabase client to simulate API failures
4. Test error UI states (error messages, disabled buttons)
5. Verify error recovery (retry after failure)

## Todo List
- [ ] Create license-actions-menu error test file
- [ ] Test suspend API failure handling
- [ ] Test revoke API failure handling
- [ ] Test tier change error handling
- [ ] Create create-license-modal validation test file
- [ ] Test user-not-found error
- [ ] Test duplicate license error
- [ ] Test network timeout error

## Success Criteria
- 100% test coverage for error paths in License CRUD
- All error states have corresponding UI tests
- No console.error leakage in tests

## Conflict Prevention
- Creates NEW files only - no modification of Phase 1 files
- Test files in isolated directory structure

## Risk Assessment
- **Risk:** Component implementation may need error boundary updates
- **Mitigation:** If error UI missing, document as gap (do not expand scope)

## Security Considerations
- Tests must verify error messages don't leak sensitive data
- Verify authentication errors handled properly

## Next Steps
After Phase 2 completes: Merge with Phase 1 results, proceed to Phase 3 (full test suite)
