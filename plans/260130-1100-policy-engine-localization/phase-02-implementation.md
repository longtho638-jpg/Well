# Phase 2: Implementation

## Objectives
1.  **Refactor Component**: Update `src/pages/Admin/PolicyEngine.tsx` to use camelCase keys (`policyEngine.*`).
2.  **Update English Locales**: Add `policyEngine` section to `src/locales/en.ts`.
3.  **Update Vietnamese Locales**: Rename/Update `policyengine` to `policyEngine` in `src/locales/vi.ts`.
4.  **Cleanup**: Remove legacy `policyenginex` sections if they exist.

## Key Mapping
| Key | English | Vietnamese |
| :--- | :--- | :--- |
| `policyEngine.synchronizingPolicyCore` | Synchronizing Policy Core | Đang đồng bộ Policy Core |
| `policyEngine.title` | Policy Engine | Policy Engine |
| `policyEngine.version` | v3.1 | v3.1 |
| `policyEngine.strategicIntegrityConfirmed` | Strategic Integrity Confirmed | Toàn vẹn chiến lược đã xác nhận |
| `policyEngine.sync` | Sync: | Đồng bộ: |
| `policyEngine.projectionSimulator` | Projection Simulator | Mô phỏng dự báo |
| `policyEngine.realTime` | Real-time | Thời gian thực |
| `policyEngine.policyChangesAreCryptographicallySigned` | Policy changes are cryptographically signed | Thay đổi chính sách được ký bảo mật |

## Steps
1.  [x] Edit `src/pages/Admin/PolicyEngine.tsx` to update `t()` calls.
2.  [x] Edit `src/locales/en.ts` to add the new section.
3.  [x] Edit `src/locales/vi.ts` to rename and standardise the section.
