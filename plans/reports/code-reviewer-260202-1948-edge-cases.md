## Code Review Report

### Scope
- Files reviewed:
  - src/pages/LeaderDashboard.tsx
  - src/components/WithdrawalModal.tsx
  - src/components/AppLayout.tsx
  - src/components/Sidebar.tsx
  - src/App.tsx
  - src/locales/vi.ts
  - src/locales/en.ts
- Review focus: Edge cases in AI Insights, Withdrawal Modal, and User Settings

### Edge Case Verification

#### 8. AI Insights extra closing bracket ")"
- **Status**: ❌ Unhandled (Bug in Vietnamese locale)
- **Location**: `src/pages/LeaderDashboard.tsx` (Line 491)
- **Issue**:
  - The code explicitly appends a closing parenthesis: `{t('leaderdashboard.th_nh_vi_n_c_n_ch')}{teamInsights.atRiskMembers.length})`
  - The English translation (`src/locales/en.ts`) includes the opening parenthesis: `'Members Needing Attention ('`.
  - The Vietnamese translation (`src/locales/vi.ts`) **does not**: `'Thành viên cần chú ý'`.
  - **Result**: In Vietnamese, it renders as `Thành viên cần chú ý5)`, which is a typo/formatting error.
- **Code Snippet**:
  ```tsx
  // src/pages/LeaderDashboard.tsx
  <h3 className="font-bold ...">
    <AlertTriangle className="..." />
    {t('leaderdashboard.th_nh_vi_n_c_n_ch')}{teamInsights.atRiskMembers.length})
  </h3>
  ```

#### 9. Withdrawal bankName should be dropdown
- **Status**: ❌ Unhandled
- **Location**: `src/components/WithdrawalModal.tsx` (Line 197-209)
- **Issue**:
  - The `bankName` field is implemented as a free text `Input` component.
  - There is no predefined list of banks or dropdown selection.
  - Validation only checks if the field is not empty (`!bankName.trim()`), allowing invalid bank names.
- **Code Snippet**:
  ```tsx
  // src/components/WithdrawalModal.tsx
  <Input
    label="Bank Name"
    type="text"
    value={bankName}
    onChange={(e) => {
      setBankName(e.target.value);
      // ...
    }}
    placeholder={t('withdrawalmodal.bank_placeholder')}
    // ...
  />
  ```

#### 10. User settings/profile not accessible
- **Status**: ❌ Unhandled
- **Location**: `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/AppLayout.tsx`
- **Issue**:
  - **Missing Routes**: No routes defined for `/dashboard/settings` or `/dashboard/profile` in `src/App.tsx`.
  - **Missing Components**: `src/pages/SettingsPage.tsx` and `src/pages/ProfilePage.tsx` do not exist in the codebase.
  - **Missing Navigation**: The `Sidebar` component does not contain a link to Settings or Profile.
  - **No Interaction**: In `AppLayout.tsx`, the user profile section in the header has `cursor-pointer` but no `onClick` handler to navigate to a profile page.
- **Code Snippet**:
  ```tsx
  // src/components/AppLayout.tsx
  <div className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity">
    {/* No onClick handler here */}
    <div className="text-right hidden sm:block">
      <p className="text-sm font-bold ...">{user.name}</p>
      {/* ... */}
    </div>
    {/* ... */}
  </div>
  ```

### Recommended Actions

1. **Fix AI Insights Formatting**:
   - Update `src/locales/vi.ts` key `th_nh_vi_n_c_n_ch` to `'Thành viên cần chú ý ('`.
   - OR better: Refactor `src/pages/LeaderDashboard.tsx` to handle the parentheses in code for consistency, e.g., `({teamInsights.atRiskMembers.length})`.

2. **Implement Bank Dropdown**:
   - Create a list of supported banks (e.g., in `src/constants/banks.ts`).
   - Replace `Input` with a `Select` component in `src/components/WithdrawalModal.tsx`.

3. **Implement Settings/Profile**:
   - Create `src/pages/SettingsPage.tsx` and `src/pages/ProfilePage.tsx`.
   - Add routes in `src/App.tsx`.
   - Add "Settings" item to `src/components/Sidebar.tsx`.
   - Add `onClick` navigation to the profile section in `src/components/AppLayout.tsx`.

### Unresolved Questions
- Is there a specific list of supported banks for the withdrawal feature?
- What specific settings are required for the Settings page (e.g., notification preferences, password change, etc.)?
