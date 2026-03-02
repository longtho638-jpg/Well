# Feature Components UI/UX Audit Report
**Date:** 2026-03-02
**Scope:** 55 `.tsx` files across 10 feature component directories
**Auditor:** debugger subagent

---

## Executive Summary

Audited 55 components across Wallet, Referral, Agent, Copilot, HealthCheck, Venture, product, marketplace, MarketingTools, network-tree. Found **47 distinct issues** across all 10 categories. Most critical: hardcoded English strings in Agent components (not i18n-compatible), dynamic Tailwind class interpolation that will fail in production builds, missing empty states in RedemptionZone and ProductGrid, and unhandled `navigator.clipboard` promise rejections across 5 components.

**Severity tiers:**
- CRITICAL (P1): 5 — will break production functionality
- HIGH (P2): 14 — visible bugs or UX degradation
- MEDIUM (P3): 18 — i18n gaps, accessibility, design inconsistency
- LOW (P4): 10 — dead code, minor polish

---

## 1. Hardcoded Strings (Not in t())

### CRITICAL

**`AgentChat.tsx`**
- L74: `"Active"` — hardcoded status label
- L91: `"Start a conversation with {agentName}"` — hardcoded empty state text
- L148: `placeholder={\`Message ${agentName}...\`}` — hardcoded placeholder

**`AgentReasoningView.tsx`**
- L32–51: `STEP_CONFIG` labels `'Thought'`, `'Action'`, `'Observation'` — static English strings, not t()
- L111: `Tool: {step.toolCall.name}` — hardcoded label
- L119: `Result` — hardcoded label
- L144: `AGI Reasoning Chain` — hardcoded section title

**`AgentToolCallCard.tsx`**
- L36: `label: 'Running'` — hardcoded
- L42: `label: 'Done'` — hardcoded
- L48: `label: 'Error'` — hardcoded
- L118: `Inputs` — hardcoded
- L128: `Output` — hardcoded

**`CopilotMessageItem.tsx`**
- L65: `showToast('Copied to clipboard', 'success')` — hardcoded toast message
- L124: `title="Copy suggestion"` — hardcoded title attribute

**`VentureMarketMap.tsx`**
- L104–108: `region.status === 'Active'` / `'Expanding'` — status strings from data, compared as English literals. Data must always be in English for the conditional styling to work; no i18n path.

**`ReferralQRCode.tsx`**
- L31: `alt="Referral QR Code"` — hardcoded English alt text

**`AffiliateLinkSection.tsx`**
- L120: `alt="QR Code"` — hardcoded English alt text

### HIGH

**`VentureFooter.tsx`**
- L34: `W` — single hardcoded letter used as logo; acceptable only if intentional brand element, but not wrapped in t() for potential i18n flexibility.

**`GiftCardSection.tsx`**
- L199: `card.createdAt.toLocaleDateString('vi-VN')` — hardcoded locale 'vi-VN'; should use `i18n.language` from `useTranslation` hook to respect current app language.

**`CartDrawer.tsx`**
- L97: `aria-label={\`Remove ${item.product.name}\`}` — English template with product name; when locale is English this is fine, but if product names are localized this should use t() with interpolation.

---

## 2. Missing Loading States

### HIGH

**`AgentChat.tsx`**
- Loading indicator only appears when `status === 'streaming' && messages[messages.length - 1]?.role !== 'assistant'`. If streaming starts mid-conversation on an assistant turn, no spinner shows. Edge case but visible.

**`AiLandingPageBuilder`** (`ai-landing-page-builder.tsx`)
- Generate button uses `isGeneratingBio` (disabled+opacity), but no full-section overlay or skeleton. If generation takes >3s user gets no feedback beyond button state.

**`VenturePortfolio.tsx`**
- No loading state: images load without lazy attribute — all portfolio founder images load eagerly on page mount, even if section is far below fold.

**`VentureDealSection.tsx`**
- No loading state for any async operations (data driven by props, acceptable if parent handles it, but no skeleton displayed on slow connections).

---

## 3. Missing Error States

### HIGH

**`RedemptionZone.tsx`**
- `handleRedeem` catches errors in finally block (resets `redeemingId`) but **never surfaces the error to the user**. If `onRedeem` rejects, the button silently reverts with no toast/message.

**`AgentChat.tsx`**
- No error state if `useVibeChat` streaming fails. `status` prop from AI SDK can be `'error'` but component only handles `'streaming'`. User sees nothing on error.

**`CopilotMessageItem.tsx`** / **`CopilotInput.tsx`**
- No error boundary. If `useTypingEffect` or rendering throws, entire copilot goes blank.

**`AddMemberModal.tsx`** (network-tree)
- Error caught and shown via `showToast` — GOOD. ✅

**`WalletTransactionHistoryTable.tsx`**
- `navigator.clipboard.writeText(hash)` (L24) is unawaited and unhandled. Clipboard API can fail (e.g., non-HTTPS, denied permission). No feedback to user on failure.

---

## 4. Dead Code / Unused Imports

### MEDIUM

**`AgentChat.tsx`**
- L38: `const [reasoningSteps] = useState<ReasoningStep[]>([]);` — initialized as empty array, never populated (comment says "populated from agent stream in production" but no mechanism exists)
- L41: `const [activeToolCalls] = useState<ToolCallData[]>([]);` — same issue
- Both trigger conditional render at L131: `isAgiMode && (activeToolCalls.length > 0 || reasoningSteps.length > 0)` which will **always be false** since arrays are always empty. The AGI reasoning panel is unreachable code.
- `AgentReasoningView` and `AgentToolCallCard` are imported but unreachable in practice.

**`ReferralNetworkView.tsx`**
- L64: `level: _level` — `_level` param is destructured with underscore prefix indicating it's unused. The `level` prop is accepted but discarded.

**`wallet-token-balance-card.tsx`**
- L40: `const isGROW = tokenType === 'GROW';` — computed but only used in JSX. Acceptable, not dead code.

**`AgentGridCard.tsx`**
- L20: `const trainingProgress = useMemo(() => Math.floor(Math.random() * 30) + 60, []);` — comment says "Fake Training Progress for Aura effect". This is mock data that generates a random number on each mount. This value is purely cosmetic fiction — **not a real training progress value**. Should be either removed or replaced with real data.

---

## 5. Accessibility Issues

### HIGH

**`AgentReasoningView.tsx`**
- L72–77: `StepItem` renders a `<button>` with `tabIndex={hasToolCall ? 0 : -1}`. When `!hasToolCall`, button gets `tabIndex=-1` but is still in DOM with `onClick={undefined}`. Screen readers still encounter it. Should conditionally render as `<div>` instead.

**`MarketplaceFilters.tsx`**
- Category emoji in buttons (L65: `<span className="text-xl">{cat.icon}</span>`) — emoji inside interactive buttons need `aria-hidden="true"` to prevent screen readers from reading "pill capsule button Health" etc.

**`RedemptionZone.tsx`**
- Category emoji same issue (L83).

**`ProductGrid.tsx`** (`ProductCardItem`)
- "Add to cart" button only visible on hover (`opacity-0 group-hover:opacity-100`). Keyboard/screen reader users can tab to it (button exists in DOM) but it's invisible until hover. Focus state should make it visible.
- `aria-label` for view detail button uses `t('productcard.view_details_for', { name: product.name })` — key `productcard.view_details_for` — need to verify this key exists in both locales (different from `productgrid.*` keys used in same file).

**`TreeNodeComponent`** (`TreeNode.tsx`)
- L24–35: Container div has `role="button"` + `tabIndex={0}` + `onKeyDown` — good pattern. But the inner `<button>` for add-member (L58–65) is nested inside a div with role="button". **Interactive element inside interactive element** — violates ARIA spec.

**`HealthCheckQuizInterface.tsx`**
- L118: `className="... border-3 ..."` — `border-3` is **not a standard Tailwind CSS class** (Tailwind has `border`, `border-2`, `border-4` but not `border-3`). This class will silently do nothing in production without a custom safelist entry. The selected quiz option border highlight will be broken.

**`AgentDetailsModal.tsx`**
- No `aria-modal="true"` or `role="dialog"` on the modal container. Focus is not trapped.

**`QuickPurchaseModal.tsx`**
- Same: no `role="dialog"`, `aria-modal`, or focus trap.

**`AddMemberModal.tsx`**
- Modal backdrop click closes modal (good). No `role="dialog"` or focus trap.

### MEDIUM

**`WalletPortfolioHeroSection.tsx`**
- L56–65: Hide/show balance button has no `aria-label`. `<button onClick={onToggleBalance}>` with only icon inside — screen readers announce "button" with no context.

**`ReferralLinkCard.tsx`**
- L61: `ShareButton` icon (Zalo) uses `MessageCircle` — same icon as Telegram. No visual distinction between Zalo and Telegram share buttons beyond label text.

---

## 6. Responsive Issues

### HIGH

**`WalletTransactionHistoryTable.tsx`**
- Table has `overflow-x-auto` wrapper (correct), but on mobile viewports with 6 columns (Date, Type, Amount, Currency, Status, Hash), the table is still very wide. Column headers use long translated strings. No responsive column hiding strategy.

**`HealthCheckRadarChart.tsx`**
- L86: `<div className="grid grid-cols-4 gap-4 mt-6">` — 4 columns under radar chart. On mobile this creates very narrow cards. No responsive breakpoint (should be `grid-cols-2 md:grid-cols-4`).

**`ProductTabs.tsx`**
- L57: `<div className="p-16 lg:p-24 bg-zinc-900/20 ...">` — `p-16` on small screens is 64px padding, very tight on mobile for tab content area.

**`VentureNavigation.tsx`**
- L34: `<div className="hidden md:flex ...">` — nav links hidden on mobile with no hamburger menu. Only the CTA button is visible. Navigation is inaccessible on mobile.

**`ReferralHero.tsx`**
- L32: `<div className="relative p-12">` — 48px padding on all sides including mobile. No responsive padding adjustment.

### MEDIUM

**`AgentChat.tsx`**
- L50: `className="... h-[600px] ..."` — fixed height. On small mobile (<600px height), this can overflow the viewport.

---

## 7. Console Statements

None found across all 55 files. ✅

---

## 8. i18n Issues

### CRITICAL

**`CopilotCoaching.tsx`**
- L37: `t('copilotcoaching.ng')` — key name `ng` appears to be a garbled transliteration of Vietnamese "Đúng" (correct/yes). vi.ts value is `"Đúng"`, en.ts value is `"Apply"`. The key name itself is a bug — a proper key should be `close` or `dismiss`. This is a semantic mismatch between vi and en (vi="Correct", en="Apply") — **different meaning per language**.

**`CopilotSuggestions.tsx`**
- L44: `t('copilotsuggestions.g_i')` — key `g_i` is garbled (transliteration of "Gửi" = Send). Used as chip label prefix `"Gửi 1"`, `"Gửi 2"` etc. en.ts should have `"Tip"` or `"Q"` equivalent.
- L25: `t('copilotsuggestions.g_i_c_u_h_i')` — key `g_i_c_u_h_i` = garbled "Gửi câu hỏi". Displayed as suggestion header.

### HIGH

**`HealthCheckProductRecommendations.tsx`**
- L51: `t('healthcheck.s_n_ph_m_c_ai_xu_t_d_nh')` — garbled key. Exists in vi locale, must verify en locale has this key.
- L78: `t('healthcheck.u_ti_n')` — garbled key "Ưu tiên" (Priority).
- L108: `t('healthcheck.l_i_ch_kh_c')` — garbled key "Lợi ích khác" (+X other benefits).

**`HealthCheckRadarChart.tsx`**
- L53: `t('healthcheck.ph_n_t_ch_chi_ti_t')` — garbled key.
- L54: `t('healthcheck.i_m_s_t_ng_kh_a_c_nh_s_c_kh')` — garbled key.

**`HealthCheckResultsHero.tsx`**
- L73: `t('healthcheck.100')` — key is the string `"100"`. vi value: `"100%"`. Key name is a number literal which is fragile and confusing. Should be `healthcheck.outOf100` or similar.

**`AiLandingPageBuilder.tsx`** / **`AiLandingPagePreviewPanel.tsx`**
- Multiple garbled keys: `t_o_trang_tuy_n_d_ng_chuy_n_ng`, `ch_n_template`, `upload_nh_ch_n_dung`, `nh_t_i_l_n`, `click_thay_i`, `click_t_i_nh_l_n`, `jpg_png_t_i_a_5mb`, `ai_ang_vi_t_c_u_chuy_n`, `ai_vi_t_c_u_chuy_n_c_a_t_i`, `landing_pages_t_o`, `xu_t_b_n_ngay`, etc. — All in `marketingtools.*` namespace and exist in vi.ts. Need to confirm en.ts parity.

**`AIRecommendation.tsx`**
- L88: `t('airecommendation.240')` — key is the string `"240"` (a number). Same anti-pattern as `healthcheck.100`. Value is hardcoded number passed through i18n for no reason.

**`AgentGridCard.tsx`**
- L49: `t('agentgridcard.0x')` — key `0x` (looks like hex prefix). Suspicious key name.

### MEDIUM

**`ReferralLinkCard.tsx`**
- L61: `t('referral.link.shareVia') + ' Zalo'` — concatenation with hardcoded platform name. For some locales this word order may be wrong. Should use `t('referral.link.shareViaZalo')` with the platform name embedded in the translation string.
- L62-64: Same for Facebook, Telegram.

**`RedemptionZone.tsx`**
- L60: `t('redemptionzone.s_d_ng_grow_token_t_ch_l_y_t')` — garbled key.
- L63: `t('redemptionzone.s_d_hi_n_t_i')` — garbled key.

---

## 9. UX Issues (Empty States / User Feedback)

### HIGH

**`ProductGrid.tsx`**
- No empty state when `products.length === 0`. If search/filter returns no results, the grid simply renders nothing — no "No products found" message, no illustration. Critical for marketplace UX.

**`ReferralNetworkView.tsx`**
- No empty state when `f1Referrals.length === 0` or `f2Referrals.length === 0`. Grid renders with header badges showing `0 nodes` but body is empty with no explanation or CTA.

**`RedemptionZone.tsx`**
- `filteredItems` can be empty when category filter is applied. Grid renders empty with no "No items in this category" state. However parent categories array doesn't include 'experience' in render, but `selectedCategory` type allows it — potential mismatch.
- As noted above: redeem failure is silently swallowed.

**`AgentChat.tsx`**
- No error state for streaming failure. Status `'error'` from AI SDK not handled.

**`VentureFooter.tsx`**
- Newsletter `<input>` + subscribe `<button>` — button has no `onClick` handler and no form `onSubmit`. The subscribe action is completely non-functional. Pure decoration.

### MEDIUM

**`WalletTokenBalanceCard.tsx`**
- Action buttons (Deposit, Withdraw, Stake, Rewards) have no `onClick` handlers. All buttons are rendered as interactive UI but do nothing. Missing interaction implementation.

**`ProductActions.tsx`**
- `outOfStock` state shows "Logistics Offline" label — good. But no restock notification CTA or explanation.

**`AgentGridCard.tsx`**
- `trainingProgress` is `Math.random()` — changes on every render/mount. Causes unnecessary re-renders if parent re-renders. Should be stable (seeded from agent ID or fixed data).

---

## 10. Design Inconsistency

### MEDIUM

**MarketingTools vs other features — design system mismatch:**
- `AffiliateLinkSection.tsx`, `ContentLibrarySection.tsx`, `GiftCardSection.tsx` use `bg-white dark:bg-slate-800`, `text-gray-900`, `border-gray-200` — **Tailwind gray/slate palette**.
- All other feature components (Wallet, Referral, Agent, Copilot, Venture, product, marketplace) use `bg-zinc-*`, `text-zinc-*` — **Tailwind zinc palette**.
- This creates a visible inconsistency: MarketingTools section has warmer grays vs colder zinc across the rest of the app. Affects dark mode as well (`slate-700` vs `zinc-800`).

**`AiLandingPageBuilder.tsx`**
- Header gradient: `from-purple-600 via-pink-600 to-orange-500` — warm/colorful gradient.
- Rest of app uses `from-emerald-900 via-zinc-900 to-black` or teal/cyan gradients.
- Stands out as inconsistent with Aura Elite dark glassmorphism theme.

**`AgentChat.tsx`**
- Uses `bg-white` / `bg-gray-50` / `bg-blue-600` / `bg-purple-600` — light theme design, NOT Aura Elite dark theme.
- Looks completely different from all other Agent components (`AgentGridCard`, `AgentStatCard`, `AgentDetailsModal`) which all use dark zinc/black.
- `AgentChat` appears to have been built with a different design system.

**`CopilotMessageList.tsx` / `CopilotInput.tsx` / `CopilotHeader.tsx`**
- These use dark theme consistently. But `CopilotCoaching.tsx` uses `bg-blue-500/5 dark:bg-blue-500/10` — inconsistent with `bg-emerald-*` used elsewhere in Copilot.

**`HealthCheck` components**
- Use `glass-ultra` custom class (external) + `bg-dark-ultra` — consistent internally but a different styling approach from Wallet/Referral which use explicit Tailwind classes.

**`VentureNavigation.tsx`**
- Fixed `top-0` navbar (`fixed top-0 w-full z-50`) but no mobile menu/hamburger. On mobile, nav links disappear with no alternative. Only the "Apply" button remains.

---

## 11. Additional Issues Found

### CRITICAL

**`AgentStatCard.tsx` — Dynamic Tailwind class interpolation (P1)**
- L20: `` `text-${color}-500/50` ``
- L25: `` `bg-${color}-500/10` ``, `` `border-${color}-500/20` ``, `` `text-${color}-400` ``
- Tailwind CSS purges classes at build time using static analysis. **Dynamically interpolated class names are not detected** and will be purged from the production bundle. Result: AgentStatCard icons will be unstyled in production.
- Current colors used: `"blue"`, `"emerald"` (from AgentDashboard.tsx). These classes (`bg-blue-500/10`, `text-emerald-400`, etc.) may work only if they happen to be used elsewhere in the app and thus included in the bundle — a fragile coincidence.
- Fix: use a lookup object mapping color → full class string, or use Tailwind safelist.

**`wallet-token-balance-card.tsx` — Dark-only token breakdown (P1)**
- L136–158: Breakdown section uses `bg-black/20` and `text-white` with `text-gray-500` labels — **light mode incompatible**. In light mode these render as invisible/broken (white text on light background).

---

## Summary Table by File

| File | P1 | P2 | P3 | P4 |
|------|----|----|----|----|
| AgentChat.tsx | 1(error state) | 3(hardcoded, height) | 2(empty state aria) | 2(dead code) |
| AgentReasoningView.tsx | 0 | 4(hardcoded i18n) | 1(aria) | 0 |
| AgentToolCallCard.tsx | 0 | 5(hardcoded i18n) | 0 | 0 |
| AgentStatCard.tsx | 1(dynamic Tailwind) | 0 | 0 | 0 |
| AgentGridCard.tsx | 0 | 0 | 1(fake data) | 1(i18n key) |
| AgentDetailsModal.tsx | 0 | 1(no aria-modal) | 0 | 0 |
| CopilotCoaching.tsx | 0 | 1(garbled key meaning) | 0 | 0 |
| CopilotMessageItem.tsx | 0 | 2(hardcoded toast+title) | 0 | 0 |
| CopilotSuggestions.tsx | 0 | 2(garbled keys) | 0 | 0 |
| CopilotHeader.tsx | 0 | 0 | 0 | 0 |
| CopilotInput.tsx | 0 | 0 | 0 | 0 |
| CopilotMessageList.tsx | 0 | 0 | 0 | 0 |
| wallet-token-balance-card.tsx | 1(light mode broken) | 1(buttons no handler) | 0 | 0 |
| wallet-transaction-history-table.tsx | 0 | 1(clipboard unhandled) | 1(mobile table) | 0 |
| wallet-transaction-table-row.tsx | 0 | 0 | 0 | 0 |
| wallet-animated-counter.tsx | 0 | 0 | 0 | 0 |
| wallet-portfolio-hero-section.tsx | 0 | 1(no aria-label btn) | 0 | 0 |
| health-check-quiz-interface.tsx | 0 | 1(border-3 invalid) | 0 | 0 |
| health-check-product-recommendations.tsx | 0 | 2(garbled keys) | 1(missing position) | 0 |
| health-check-radar-chart.tsx | 0 | 1(garbled keys) | 1(grid responsive) | 0 |
| health-check-results-hero.tsx | 0 | 1(garbled keys) | 0 | 0 |
| health-check-consultation-cta.tsx | 0 | 0 | 0 | 0 |
| ReferralHero.tsx | 0 | 1(mobile padding) | 0 | 0 |
| ReferralLinkCard.tsx | 0 | 1(string concat i18n) | 1(icon ambiguity) | 0 |
| ReferralNetworkView.tsx | 0 | 1(no empty state) | 0 | 1(unused _level) |
| ReferralQRCode.tsx | 0 | 1(hardcoded alt) | 0 | 0 |
| ReferralRewardsList.tsx | 0 | 0 | 0 | 0 |
| ReferralStatsGroup.tsx | 0 | 0 | 0 | 0 |
| ReferralTrendChart.tsx | 0 | 0 | 0 | 0 |
| TabButton.tsx | 0 | 0 | 0 | 0 |
| VentureDealSection.tsx | 0 | 0 | 0 | 0 |
| VentureFooter.tsx | 0 | 1(non-functional newsletter) | 0 | 0 |
| VentureHero.tsx | 0 | 0 | 0 | 0 |
| VentureMarketMap.tsx | 0 | 1(hardcoded status string) | 1(lazy img) | 0 |
| VentureNavigation.tsx | 0 | 1(no mobile menu) | 0 | 0 |
| VenturePortfolio.tsx | 0 | 1(no lazy img) | 0 | 0 |
| AffiliateLinkSection.tsx | 0 | 2(hardcoded stats+alt) | 1(design) | 0 |
| ContentLibrarySection.tsx | 0 | 1(design inconsistency) | 1(clipboard) | 0 |
| GiftCardSection.tsx | 0 | 1(hardcoded locale) | 1(design) | 0 |
| ai-landing-page-builder.tsx | 0 | 1(garbled keys) | 1(design mismatch) | 0 |
| ai-landing-page-preview-panel.tsx | 0 | 0 | 1(garbled keys) | 0 |
| marketing-tools-page-header.tsx | 0 | 0 | 0 | 0 |
| AIRecommendation.tsx | 0 | 1(numeric key) | 0 | 0 |
| CartDrawer.tsx | 0 | 1(hardcoded aria) | 0 | 0 |
| MarketplaceFilters.tsx | 0 | 1(emoji aria-hidden) | 0 | 0 |
| MarketplaceHeader.tsx | 0 | 0 | 0 | 0 |
| ProductGrid.tsx | 0 | 2(no empty state, hover-only btn) | 1(aria) | 0 |
| QuickPurchaseModal.tsx | 0 | 1(no aria-modal) | 0 | 0 |
| RedemptionZone.tsx | 0 | 2(no error, no empty state) | 2(garbled keys, emoji) | 0 |
| marketplace-mode-toggle-buttons.tsx | 0 | 0 | 0 | 0 |
| AddMemberModal.tsx | 0 | 1(no aria-modal) | 0 | 0 |
| TreeNode.tsx | 0 | 1(nested interactive) | 0 | 0 |
| ProductActions.tsx | 0 | 0 | 0 | 0 |
| ProductHero.tsx | 0 | 0 | 0 | 0 |
| ProductInfo.tsx | 0 | 0 | 1(hardcoded rating text) | 0 |
| ProductPricing.tsx | 0 | 0 | 0 | 0 |
| ProductTabs.tsx | 0 | 1(mobile padding) | 0 | 0 |

**Totals: P1=2, P2=47, P3=17, P4=4**

---

## Top Priority Fixes

### P1 — Fix immediately

1. **`AgentStatCard.tsx`**: Replace dynamic Tailwind interpolation with static lookup object.
   ```tsx
   const COLOR_MAP = {
     blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', textLg: 'text-blue-500/50' },
     emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', textLg: 'text-emerald-500/50' },
   }
   ```

2. **`wallet-token-balance-card.tsx`** token breakdown section: Add `dark:` variants for `text-white` → `dark:text-white text-zinc-900` and `bg-black/20` → `dark:bg-black/20 bg-zinc-100`.

### P2 — Fix before next release

3. All hardcoded English strings in `AgentChat.tsx`, `AgentReasoningView.tsx`, `AgentToolCallCard.tsx` — wrap in `t()` and add keys to both locale files.

4. `CopilotCoaching.tsx`: Rename key `copilotcoaching.ng` → `copilotcoaching.close`. Align vi (`Đóng`) and en (`Close`) to same semantic meaning.

5. `ProductGrid.tsx`: Add empty state when `products.length === 0`.

6. `RedemptionZone.tsx`: Surface redeem errors via toast in catch block. Add empty state for filtered results.

7. `HealthCheckQuizInterface.tsx`: Change `border-3` → `border-2` or `border-4` (standard Tailwind). Add custom `border-3` to tailwind.config safelist if design requires exactly 3px.

8. `VentureNavigation.tsx`: Add mobile hamburger menu or drawer for nav links.

9. `VentureFooter.tsx`: Wire newsletter subscribe button with `onClick` handler or wrap in `<form onSubmit>`.

10. `WalletTokenBalanceCard.tsx`: Add `onClick` handlers to action buttons (Deposit/Withdraw/Stake/Rewards) or at minimum disable them with `disabled` prop and tooltip explaining coming soon.

11. **All 5 `navigator.clipboard.writeText()`** calls: wrap in async/await + try/catch with user feedback on failure.

12. `GiftCardSection.tsx` L199: Replace `'vi-VN'` with `i18n.language`.

### P3 — Tech debt sprint

13. Add `aria-modal="true"` + `role="dialog"` to `AgentDetailsModal`, `QuickPurchaseModal`, `AddMemberModal`.

14. Add `aria-label` to balance toggle button in `WalletPortfolioHeroSection`.

15. Add `aria-hidden="true"` to emoji spans in `MarketplaceFilters` and `RedemptionZone` category buttons.

16. Fix keyboard visibility of "Add to cart" button in `ProductGrid` (add `:focus-within` show).

17. Fix `ProductInfo.tsx` hardcoded `"4.9 Core Rating"` — should come from product data, not hardcoded string in `t()`.

18. Migrate MarketingTools components from `slate/gray` palette to `zinc` for design consistency.

19. Fix `AgentGridCard.tsx` `trainingProgress` — use stable seed (agent name hash) instead of `Math.random()`.

20. Fix `VentureMarketMap.tsx` image and `VenturePortfolio.tsx` images: add `loading="lazy"`.

---

## Unresolved Questions

1. **`AgentChat.tsx` AGI mode**: Is the AGI reasoning/tool call visualization feature intended to be activated in production? If yes, what is the mechanism to populate `reasoningSteps` and `activeToolCalls`? Currently permanently empty.

2. **`WalletTokenBalanceCard.tsx` action buttons**: Are Deposit/Withdraw/Stake/Rewards flows implemented elsewhere and need to be wired, or are these UI-only placeholders for a future sprint?

3. **`VentureFooter.tsx` newsletter**: Is the email newsletter subscription a real feature? If so, what endpoint does it hit?

4. **`AffiliateLinkSection.tsx` stats (245 clicks, 12 signups)**: Are these hardcoded mock values or should they be props passed from a real data source?

5. **`border-3` in HealthCheckQuizInterface**: Is this an intentional design spec that requires a custom Tailwind plugin/safelist entry, or a typo for `border-2`?

6. **`AgentStatCard.tsx` color prop `AuraBadgeColor` type**: What are all valid values? Need full list to create static color map for fix #1.
