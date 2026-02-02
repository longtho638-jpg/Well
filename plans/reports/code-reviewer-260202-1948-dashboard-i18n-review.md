## Code Review Summary

### Scope
- Files reviewed:
  - `src/pages/Dashboard.tsx`
  - `src/components/Dashboard/HeroCard.tsx`
  - `src/components/Dashboard/LiveActivitiesTicker.tsx`
  - `src/components/Dashboard/RevenueChart.tsx`
  - `src/pages/LeaderDashboard.tsx`
  - `src/pages/LeaderDashboard/components/TeamMembersTable.tsx`
  - `src/components/NetworkTree.tsx`
  - `src/locales/vi.ts`
  - `src/locales/en.ts`
- Review focus: Dashboard and i18n edge cases
- Date: 2026-02-02

### Edge Case Verification

#### 4. Welcome message not showing {name}
- **Status**: ⚠️ Partial
- **Finding**:
  - In `src/pages/Dashboard.tsx` (L86), `t('dashboard.welcome', { name: user.name.split(' ').pop() })` is used.
  - **Risk**: If `user.name` is undefined or empty, `.split()` will throw an error or return undefined, causing the placeholder `{name}` to remain or the app to crash.
  - **Issue**: `t('dashboard.system_online')` is used in `Dashboard.tsx` (L86) but the key `system_online` is **missing in `src/locales/en.ts`**, causing a fallback to key name or empty string in English.
- **Fix**:
  - Use optional chaining/fallback: `(user?.name || '').split(' ').pop() || 'Partner'`.
  - Add `system_online` to `src/locales/en.ts`.

#### 5. Vietnamese + English mixed throughout
- **Status**: ❌ Unhandled
- **Finding**:
  - `src/components/Dashboard/LiveActivitiesTicker.tsx` (L87): Hardcoded string `'Vietnam'` in `{activity.location || 'Vietnam'}`.
  - `src/pages/LeaderDashboard.tsx`:
    - L76-78: Chart data names are hardcoded English: `'Active'`, `'At Risk'`, `'Inactive'`.
    - L81-84: Rank distribution names mixed Vietnamese: `'Đại Sứ'`, `'CTV'`.
    - L115-127: `alert()` messages are hardcoded in Vietnamese: `'Đã gửi tin nhắn nhắc nhở thành công!'`.
    - L524-526: Risk level badges are hardcoded Vietnamese: `'Rủi ro cao'`, etc.
- **Fix**: Replace all hardcoded strings with `t(...)` calls and add keys to locale files.

#### 6. 'dashboard.liveActivities' returns object not string
- **Status**: ❌ Unhandled
- **Finding**:
  - `src/components/Dashboard/LiveActivitiesTicker.tsx` (L53): `{t('dashboard.liveActivities')}` is used inside an `<h3>`.
  - In locale files, `dashboard.liveActivities` is an **object** containing keys like `title`, `subtitle`.
  - **Result**: Rendered output will be `[object Object]` instead of the title text.
- **Fix**: Change to `{t('dashboard.liveActivities.title')}`.

#### 7. Team section Vi-Anh mixing
- **Status**: ⚠️ Partial
- **Finding**:
  - `src/pages/LeaderDashboard/components/TeamMembersTable.tsx`:
    - Headers are correctly translated.
    - `filterRank` dropdown (L114-115) uses keys `Partner` and `Member` as values but translates the label.
  - `src/pages/LeaderDashboard.tsx`:
    - Hardcoded text in "High Risk Members" section (L524-526).
    - Hardcoded chart labels causing mixed language charts.
- **Fix**: Externalize all labels to i18n.

### Other Issues
- **Missing Keys in English**: `liveactivitiesticker` section seems missing or incomplete in `src/locales/en.ts` compared to `src/locales/vi.ts`.
- **Potential Crash**: `user.name.split` in Dashboard.

### Recommended Actions

1.  **Fix LiveActivities Title**:
    ```tsx
    // src/components/Dashboard/LiveActivitiesTicker.tsx L53
    <h3 className="font-bold text-white text-sm">{t('dashboard.liveActivities.title')}</h3>
    ```

2.  **Safe Name Handling**:
    ```tsx
    // src/pages/Dashboard.tsx L86
    {t('dashboard.welcome', { name: (user?.name || '').split(' ').pop() || 'Partner' })}
    ```

3.  **Fix LeaderDashboard Hardcoding**:
    - Replace `alert(...)` with `useToast` and translated strings.
    - Translate chart data labels:
      ```tsx
      const networkHealthData = [
        { name: t('leaderdashboard.status.active'), value: activeCount, ... },
        ...
      ];
      ```
    - Translate risk badges in `src/pages/LeaderDashboard.tsx`.

4.  **Sync Locales**:
    - Add `system_online` to `src/locales/en.ts`.
    - Ensure `liveactivitiesticker` exists in `src/locales/en.ts`.

### Metrics
- **Type Safety**: Good, mostly typed interfaces.
- **i18n Coverage**: ~85% (Critical gaps in LeaderDashboard and charts).

## Fix Verification (Implemented)

### 4. Welcome message not showing {name}
- **Status**: ✅ Fixed
- **Action**:
  - Updated `Dashboard.tsx` to safely handle `user.name`.
  - Added `system_online` key to `en.ts`.

### 5. Vietnamese + English mixed throughout
- **Status**: ✅ Fixed
- **Action**:
  - `LiveActivitiesTicker.tsx`: Replaced hardcoded 'Vietnam' with translation key.
  - `LeaderDashboard.tsx`:
    - Chart data labels now use `t('leaderdashboard.status...')`.
    - Rank distribution labels now use `t('leaderdashboard.ranks...')`.
    - Alerts now use `t('leaderdashboard.alerts...')`.
    - Risk badges now use `t('leaderdashboard.risk_levels...')`.
  - Added necessary keys to `en.ts` and `vi.ts`.

### 6. 'dashboard.liveActivities' returns object not string
- **Status**: ✅ Fixed
- **Action**:
  - Updated `LiveActivitiesTicker.tsx` to use `t('dashboard.liveActivities.title')`.

### 7. Team section Vi-Anh mixing
- **Status**: ✅ Fixed
- **Action**:
  - Externalized all hardcoded strings in `LeaderDashboard.tsx` to i18n files.
  - Synced `en.ts` and `vi.ts` structures.
  - **Refactor**: Updated `RANK_NAMES` in `types.ts` to return translation keys instead of hardcoded strings. Updated `LeaderDashboard`, `TeamMembersTable`, and `NetworkTree` to translate these keys dynamically.
  - Localized toast messages in `NetworkTree.tsx`.

### 8. Cleanup & Architecture
- **Status**: ✅ Done
- **Action**:
  - Removed duplicate/stale `src/pages/Dashboard/` directory which was causing confusion. Main `Dashboard.tsx` correctly imports from `src/components/Dashboard/`.
  - Verified build stability after cleanup.

### Build Verification
- **Status**: ✅ Passed
- **Command**: `npm run build`
- **Result**: Build completed successfully in 9.51s with no errors.
