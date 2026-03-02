# Core Components UI/UX Audit Report
**Date:** 2026-03-02
**Scope:** Dashboard, PremiumNavigation, admin, auth, ui, LeaderDashboard, Leaderboard, + root components
**Files scanned:** ~50 files

---

## Executive Summary

- **Critical (must fix):** 8 issues
- **High (should fix):** 14 issues
- **Medium (nice to fix):** 10 issues
- **Low / Cosmetic:** 6 issues

Overall: codebase is **good** quality. i18n coverage is broad. Main gaps: hardcoded strings in admin/auth components, missing aria attributes on ToggleSwitch, a placeholder Zalo URL, and several UX polish items.

---

## 1. HARDCODED STRINGS (i18n violations)

### CRITICAL

**`src/components/OnboardingQuest.tsx`** (lines 27, 110)
```tsx
setAdvice("Keep sharing your positivity! The sales will follow.");  // fallback not translated
{loading ? "Analyzing Sales Data..." : "Get AI Advice"}            // button label
```
Both strings appear directly to user. Should use `t()` keys.

**`src/components/admin/partners/PartnerDetailModal.tsx`** (lines 50, 51, 60, 146, 157, 168)
```tsx
showToast('Partner updated successfully', 'success');   // hardcoded EN
showToast('Failed to update partner', 'error');         // hardcoded EN
label="Total Sales"       // Input label
label="Pending Cashback"  // Input label
label="Point Balance"     // Input label
```
All 5 are user-visible strings shown inside an admin modal. Need `t()` wrappers.

**`src/components/admin/FounderRevenueGoal.tsx`** (line 40)
```tsx
{priority === 'high' ? 'Quan trọng' : priority === 'medium' ? 'Trung bình' : 'Thấp'}
```
`PriorityBadge` renders raw Vietnamese strings instead of translation keys. Inconsistent with the rest of the app that uses `t()`.

**`src/components/auth/LoginActivityLog.tsx`** (line 65)
```tsx
{f === 'all' ? 'All' : f === 'success' ? 'Successful' : 'Failed'}
```
Filter tabs rendered in hardcoded English.

### HIGH

**`src/components/admin/orders/OrderTable.tsx`** (lines 34-38)
```tsx
{ icon: Calendar, label: 'Timeline' },
{ icon: User, label: 'Partner Identity' },
{ icon: DollarSign, label: 'Value (VND)' },
{ icon: ImageIcon, label: 'Evidence' },
{ icon: Shield, label: 'Governance', center: true }
```
All 5 table column headers are hardcoded English strings.

**`src/components/admin/partners/PartnerFilters.tsx`** (line 39)
```tsx
placeholder="Search identity by name, email, or UID..."
```
Long descriptive placeholder in hardcoded English.

**`src/components/ZaloWidget.tsx`** (line 12)
```tsx
window.open('https://zalo.me/your-zalo-oa', '_blank');
```
**Placeholder URL still in production code.** Opens a broken Zalo link. Not an i18n issue but a critical dead-code/incomplete-implementation bug.

**`src/components/admin/orders/OrderTable.tsx`** (lines 112, 115)
```tsx
{order.user?.name || 'Anonymous Partner'}
{order.user?.email || 'unverified@network.node'}
```
Fallback strings shown to admin users when user data is missing — hardcoded English.

---

## 2. ACCESSIBILITY ISSUES

### CRITICAL

**`src/components/admin/AdminSecuritySettings.tsx` — ToggleSwitch** (lines 21-37)
```tsx
const ToggleSwitch: React.FC<{...}> = ({ enabled, onChange, loading }) => (
    <button onClick={() => onChange(!enabled)} disabled={loading} ...>
```
Missing: `role="switch"`, `aria-checked={enabled}`, `aria-label` describing what the toggle controls. Screen readers cannot identify this as a toggle or its current state.

**`src/components/ZaloWidget.tsx`** (line 16)
```tsx
<motion.button onClick={handleZaloClick} ...>
  <MessageCircle className="w-6 h-6" />
</motion.button>
```
Icon-only floating button with NO `aria-label`. Screen readers will announce nothing meaningful.

**`src/components/ui/Toast.tsx` (ToastProvider)** — close button (line 62)
```tsx
<button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
  <X className="w-4 h-4" />
</button>
```
No `aria-label="Dismiss notification"`. Icon-only button inaccessible.

**`src/components/admin/NotificationCenter.tsx`** — mark-all-read button (lines 87-93)
```tsx
<button onClick={markAllAsRead} ... title="Mark all as read">
  <CheckCheck className="w-5 h-5" />
</button>
```
Uses `title` only (not accessible on keyboard/mobile). Should use `aria-label`.

### HIGH

**`src/components/Dashboard/RecentActivityList.tsx`** (line 70)
```tsx
<motion.button whileHover ...>
  {t('recentactivitylist.view_digital_audit_trace')}
</motion.button>
```
Button has no `onClick` handler — it does nothing when clicked. Dead UI.

**`src/components/LeaderDashboard/TeamTable.tsx`** — action buttons (lines 158-165)
```tsx
<button ... title={t('team.actions.sendEmail')}>
  <Mail ... />
</button>
<button ... title={t('team.actions.call')}>
  <Phone ... />
</button>
```
Action buttons use `title` attribute only. Should use `aria-label` for proper keyboard/screen reader support.

**`src/components/Dashboard/AchievementGrid.tsx`** — locked badges (lines 81-87)
```tsx
{!badge.unlocked && (
  <div className="absolute inset-0 flex items-center justify-center ...">
    <ShieldAlert size={16} ... />
  </div>
)}
```
Locked overlay div has no `aria-label` or `aria-hidden`. The `ShieldAlert` icon meaning is lost to screen readers.

**`src/components/ParticleBackground.tsx`**
Canvas element has no `aria-hidden="true"`. Should be hidden from screen readers since it's purely decorative.

---

## 3. UX / MISSING STATES

### CRITICAL

**`src/components/admin/policy/SimulationPanel.tsx`** — range input (line 40)
```tsx
<input type="range" ... className="w-full accent-white h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer" />
```
No `aria-label` or `<label>` element for the range slider. Also no visual current-value readout update animation — just static text that updates.

**`src/components/Dashboard/RevenueChart.tsx`** — filter dropdown (lines 27-34)
```tsx
<select className="...">
  <option>{t('revenuechart.last_7_days')}</option>
  <option>{t('revenuechart.last_30_days')}</option>
</select>
```
Dropdown has no `onChange` handler — it's a cosmetic control with no actual filtering behavior wired up. Dead UI.

### HIGH

**`src/components/admin/partners/PartnerDetailModal.tsx`** — design inconsistency
```tsx
className="bg-white rounded-xl max-w-3xl w-full ..."
```
Modal uses `bg-white` (light mode only) while rest of admin panel uses dark glassmorphism (`bg-zinc-900`, `bg-zinc-950`). Jarring visual inconsistency; no dark mode support for this modal.

**`src/components/OnboardingQuest.tsx`** — error handling (line 27)
```tsx
} catch {
    setAdvice("Keep sharing your positivity! The sales will follow.");
}
```
Catch block silently swallows real API errors and shows a fake positive message. User has no indication something failed.

**`src/components/LiveConsole.tsx`** — TX rate (lines 57-61)
```tsx
const [txRate, setTxRate] = useState(() => Math.floor(Math.random() * 9999));
useEffect(() => {
    const interval = setInterval(() => setTxRate(Math.floor(Math.random() * 9999)), 5000);
```
TX rate metric is entirely random/fake. If this panel is supposed to convey real telemetry, this misleads users/admins. If decorative, needs a `// decorative` comment or removal from the "LIVE" telemetry UI.

**`src/components/admin/orders/OrderTable.tsx`** — empty state missing
When `orders` array is empty, the table renders an empty `<tbody>` with no empty state message. Bad UX for admin users.

**`src/components/LeaderDashboard/TeamTable.tsx`** — action buttons nonfunctional
```tsx
<button ... title={t('team.actions.sendEmail')}>
<button ... title={t('team.actions.call')}>
<button ... title={t('team.actions.moreActions')}>
```
All 3 action buttons have no `onClick` handlers. Dead UI.

**`src/components/Leaderboard/leaderboard-challenge-modal.tsx`** — challenge button does nothing
```tsx
<button onClick={onClose} ...>
  {t('leaderboard.readyToFight')}
</button>
```
"Ready to Fight" just closes the modal. No actual challenge action is triggered. The modal is purely motivational text with a misleading CTA.

---

## 4. DEAD CODE / INCOMPLETE IMPLEMENTATIONS

### HIGH

**`src/components/ZaloWidget.tsx`** — broken URL
```tsx
window.open('https://zalo.me/your-zalo-oa', '_blank');
```
Template placeholder never replaced. Clicking opens `zalo.me/your-zalo-oa` which does not exist.

**`src/components/admin/FounderRevenueGoal.tsx`** — dead recommendation items
```tsx
<motion.div ... className="... cursor-pointer group">
```
Recommendation cards have `cursor-pointer` + hover state but no `onClick` handler. Nothing happens when user clicks an AI recommendation.

**`src/components/Dashboard/RevenueChart.tsx`** — unresponsive dropdown (above)

**`src/components/Dashboard/RecentActivityList.tsx`** — button with no handler (above)

### MEDIUM

**`src/components/admin/AdminSecuritySettings.tsx`** — "Change Password" button
```tsx
<button className="text-sm text-emerald-400 hover:underline">{t('adminsecuritysettings.i_m_t_kh_u')}</button>
```
No `onClick` handler. Clicking does nothing.

**`src/components/LiveConsole.tsx`** — commented dead code (line 125)
```tsx
{/* <div>BEE-AGENT CORE V4.2.0-STABLE</div> */}
```
Commented-out block immediately replaced by `<span>` with translation key on line 126. Dead comment.

---

## 5. RESPONSIVE / DESIGN ISSUES

### HIGH

**`src/components/Dashboard/HeroCard.tsx`** — external texture URL
```tsx
className="... bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
```
Loads texture from external CDN (transparenttextures.com). Fails in offline/restricted environments; not controlled asset; potential CORS/CSP issue.

**`src/components/Dashboard/ValuationCard.tsx`** — same issue (line 24)
Same external CDN texture pattern.

**`src/components/Dashboard/daily-quest-card-and-token-fly-animation.tsx`** — `window.innerWidth` access (line 25)
```tsx
animate={{ x: window.innerWidth - 100, y: -100, ... }}
```
`window.innerWidth` accessed during render/animation. This will throw in SSR environments and may produce incorrect values if the window resizes between when the value is captured and when the animation runs. Should use a ref or layout effect.

**`src/components/admin/partners/PartnerDetailModal.tsx`** — no mobile layout
```tsx
className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
```
Modal is `max-w-3xl` with no responsive breakpoints for mobile. On small screens the edit form with `grid-cols-2` will overflow or compress poorly.

### MEDIUM

**`src/components/Dashboard/HeroCard.tsx`** — `p-12` on mobile
```tsx
className="... p-12 flex flex-col xl:flex-row ..."
```
`p-12` (48px padding) on all screen sizes including mobile. Very tight on small screens. Should be `p-6 xl:p-12`.

**`src/components/AgentDashboard.tsx`** — inline `<style>` block (lines 167-197)
```tsx
<style>{`
  @keyframes fade-in { ... }
  .animate-fade-in { ... }
`}</style>
```
Inline `<style>` in JSX is an anti-pattern; breaks SSR and CSS-in-JS tools. These should be Tailwind `animate-*` utilities or CSS module classes.

---

## 6. DESIGN INCONSISTENCY

### MEDIUM

**`src/components/QuickActionsCard.tsx`** — wrong design system
```tsx
className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6"
```
Uses light-mode `bg-white` + `dark:bg-slate-800` design while surrounding Dashboard components use the Aura Elite dark glassmorphism theme (`bg-zinc-950`, `bg-zinc-900`, `backdrop-blur-3xl`). The card visually clashes with `HeroCard`, `StatsGrid`, etc.

Also the `background` inline style (lines 132-134):
```tsx
style={{
  background: `linear-gradient(135deg, ${action.bgColor.replace('bg-', '')} 0%, white 100%)`,
}}
```
`action.bgColor` is a Tailwind class like `"bg-pink-50"` — replacing `"bg-"` with `""` yields `"pink-50"` which is not a valid CSS color. This gradient is broken for all action buttons.

**`src/components/Dashboard/RevenueChart.tsx`** — mixed design
```tsx
className="... bg-white dark:bg-slate-800 ..."
```
Same issue: light/dark slate vs Aura Elite zinc dark. Chart lives inside a white card surrounded by dark zinc cards.

**`src/components/Dashboard/TopProducts.tsx`** — same (line 19)
```tsx
className="bg-white dark:bg-slate-800 ..."
```
Third component breaking dashboard visual consistency.

---

## 7. MISSING ARIA / SEMANTIC HTML

### MEDIUM

**`src/components/ui/CommandPalette.tsx`** — missing `aria-labelledby`/`aria-label` on dialog
```tsx
<div className="relative w-full max-w-2xl ..." role="dialog" aria-modal="true">
```
`role="dialog"` without `aria-labelledby` or `aria-label` — screen readers won't announce what this dialog is.

**`src/components/Leaderboard/leaderboard-ranking-table.tsx`** — table role mismatch
The "table" is built with `<div>` grid layout (not a `<table>`). Fine for visual presentation, but missing ARIA table roles (`role="table"`, `role="row"`, `role="cell"`, `role="columnheader"`) for accessibility.

**`src/components/auth/LoginActivityLog.tsx`** — export button
```tsx
<button onClick={onExport} ... title="Export activity log">
  <Download className="w-5 h-5" />
</button>
```
Uses `title` only. Should be `aria-label`.

---

## 8. PERFORMANCE / CORRECTNESS NOTES

### LOW

**`src/components/Dashboard/AchievementGrid.tsx`** — `key={idx}` on list (line 57)
```tsx
{achievements.map((badge, idx) => (
  <motion.div key={idx} ...>
```
Using array index as key. With Framer Motion `layout` transitions, this causes incorrect animations when list items reorder. Should use a stable ID from badge data.

**`src/components/Dashboard/RecentActivityList.tsx`** — `key={idx}` (line 43)
Same issue.

**`src/components/admin/orders/OrderTable.tsx`** — `key={idx}` on table headers (line 40)
```tsx
{[...].map((head, idx) => <th key={idx} ...>)}
```
Minor, but index keys on static config arrays is an anti-pattern.

**`src/components/Dashboard/RevenueBreakdown.tsx`** — hardcoded tooltip label
```tsx
formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M ₫`, 'Yield']}
```
`'Yield'` is hardcoded English in tooltip. Should use `t()`.

**`src/components/AgentDashboard.tsx`** — plural handling (line 158)
```tsx
{agent.actions.length} {t('agentdashboard.action')}{agent.actions.length !== 1 ? 's' : ''}
```
Concatenating English `'s'` plural suffix on a translated string. Breaks for Vietnamese and other languages.

---

## Summary Table

| File | Severity | Issue |
|---|---|---|
| `OnboardingQuest.tsx` | CRITICAL | 2 hardcoded EN strings shown to user |
| `admin/partners/PartnerDetailModal.tsx` | CRITICAL | 5 hardcoded EN strings + toast messages |
| `admin/FounderRevenueGoal.tsx` | CRITICAL | PriorityBadge raw Vietnamese (not via t()) |
| `auth/LoginActivityLog.tsx` | CRITICAL | Filter tabs hardcoded EN |
| `admin/orders/OrderTable.tsx` | HIGH | 5 column headers + 2 fallback strings hardcoded |
| `admin/partners/PartnerFilters.tsx` | HIGH | Placeholder hardcoded EN |
| `ZaloWidget.tsx` | CRITICAL | Placeholder URL 'your-zalo-oa' — broken |
| `ZaloWidget.tsx` | CRITICAL | Missing aria-label on icon button |
| `admin/AdminSecuritySettings.tsx` ToggleSwitch | CRITICAL | Missing role="switch", aria-checked, aria-label |
| `ui/Toast.tsx` ToastProvider close btn | HIGH | Missing aria-label on X button |
| `admin/NotificationCenter.tsx` mark-all btn | HIGH | title attr instead of aria-label |
| `Dashboard/RecentActivityList.tsx` | HIGH | Button with no onClick (dead UI) |
| `LeaderDashboard/TeamTable.tsx` action btns | HIGH | 3 buttons no onClick (dead UI) |
| `Dashboard/RevenueChart.tsx` | HIGH | Dropdown no onChange (dead UI) |
| `admin/AdminSecuritySettings.tsx` change pwd | MEDIUM | Button no onClick (dead UI) |
| `admin/FounderRevenueGoal.tsx` recs | HIGH | cursor-pointer with no onClick |
| `Leaderboard/leaderboard-challenge-modal.tsx` | MEDIUM | CTA just closes modal — no action |
| `Dashboard/HeroCard.tsx` | HIGH | External CDN texture (not controlled) |
| `Dashboard/ValuationCard.tsx` | HIGH | External CDN texture (not controlled) |
| `Dashboard/daily-quest-card-*.tsx` | HIGH | window.innerWidth in animation |
| `admin/partners/PartnerDetailModal.tsx` | HIGH | bg-white modal in dark admin UI |
| `Dashboard/HeroCard.tsx` | MEDIUM | p-12 on mobile |
| `QuickActionsCard.tsx` | HIGH | bg-color CSS injection bug (broken gradient) |
| `QuickActionsCard.tsx` | MEDIUM | Design mismatch (slate vs zinc Aura Elite) |
| `Dashboard/RevenueChart.tsx` | MEDIUM | Design mismatch |
| `Dashboard/TopProducts.tsx` | MEDIUM | Design mismatch |
| `AgentDashboard.tsx` | MEDIUM | Inline style block in JSX |
| `AgentDashboard.tsx` | LOW | Broken plural concatenation for i18n |
| `LiveConsole.tsx` | MEDIUM | Fake/random TX rate in "live" telemetry |
| `ParticleBackground.tsx` | MEDIUM | Canvas not aria-hidden |
| `Dashboard/RevenueBreakdown.tsx` | LOW | 'Yield' hardcoded in tooltip |
| `Dashboard/AchievementGrid.tsx` | LOW | key={idx} with Framer Motion |
| `Dashboard/RecentActivityList.tsx` | LOW | key={idx} |
| `ui/CommandPalette.tsx` | MEDIUM | role="dialog" missing aria-label |
| `Leaderboard/leaderboard-ranking-table.tsx` | MEDIUM | div-grid table missing ARIA table roles |
| `LeaderDashboard/TeamTable.tsx` action btns | MEDIUM | title not aria-label |
| `auth/LoginActivityLog.tsx` export btn | LOW | title not aria-label |

---

## Recommended Fix Priority

### Sprint 1 (fix now — critical UX breakage)
1. `ZaloWidget.tsx` — replace placeholder URL with real Zalo OA link
2. `ZaloWidget.tsx` — add `aria-label="Chat với chúng tôi qua Zalo"`
3. `AdminSecuritySettings.tsx` ToggleSwitch — add `role="switch"` + `aria-checked` + `aria-label`
4. `OnboardingQuest.tsx` — wrap 2 strings in `t()`
5. `PartnerDetailModal.tsx` — wrap toast messages + Input labels in `t()`
6. `RevenueChart.tsx` — wire `onChange` or remove the filter dropdown
7. `QuickActionsCard.tsx` — fix broken CSS injection in gradient style

### Sprint 2 (high UX debt)
1. Dead buttons: `RecentActivityList`, `TeamTable` action buttons, `AdminSecuritySettings` change-password, `FounderRevenueGoal` recommendations
2. `OrderTable.tsx` — translate column headers + fallback strings
3. `PartnerFilters.tsx` — translate placeholder
4. `LoginActivityLog.tsx` — translate filter tabs
5. `FounderRevenueGoal.tsx` — move `PriorityBadge` strings to `t()`
6. External CDN textures in `HeroCard` + `ValuationCard`

### Sprint 3 (polish)
1. Design consistency: `QuickActionsCard`, `RevenueChart`, `TopProducts` — migrate to Aura Elite zinc dark
2. `PartnerDetailModal` — add dark mode, mobile layout
3. Missing aria across Toast close, NotificationCenter, TeamTable buttons
4. `AgentDashboard` — remove inline `<style>`, fix plural
5. `ParticleBackground` — add `aria-hidden="true"`
6. `window.innerWidth` in `TokenFlyAnimation` — use layout ref

---

## Unresolved Questions

1. **`ZaloWidget`**: What is the actual Zalo OA URL for WellNexus? Without it the widget is dead code.
2. **`RevenueChart` filter**: Is 30-day filtering actually implemented in the data layer, or was this always a cosmetic dropdown? Needs confirmation before wiring.
3. **Leaderboard challenge modal**: Is there a planned backend for challenges, or is this intentionally just a motivational UI with no real action?
4. **`LiveConsole` TX rate**: Is this supposed to reflect real data? If yes, what API endpoint? If decorative, should the "LIVE" label be removed?
5. **`TeamTable` action buttons** (email/call/more): Are these intended to integrate with an email client, phone dialer, or in-app messaging? Clarify intent before implementing `onClick`.
6. **`FounderRevenueGoal` recommendations**: Where should clicking a recommendation navigate/link to?
