# UI/UX Deep Bug Audit — WellNexus RaaS

**Date**: 2026-03-03 20:10
**Audit Type**: 10x Deep Scan — UI/UX Quality
**Stack**: React + TypeScript + Tailwind CSS
**Design System**: Aura Elite (Dark gradients, glassmorphism)

---

## 🎯 Executive Summary

| Category | Issues | Severity |
|----------|--------|----------|
| Emoji Icons | 7 occurrences | 🔴 HIGH |
| Missing cursor-pointer | 20+ elements | 🟡 MEDIUM |
| Font inconsistencies | 3 conflicts | 🟡 MEDIUM |
| Missing hover transitions | ~15 elements | 🟡 MEDIUM |
| Accessibility gaps | TBD | 🟠 HIGH |

**Design System Recommended**: Data-Dense Dashboard (Fira Code/Fira Sans)

---

## 🔴 CRITICAL: Emoji Usage trong UI

**Rule**: KHÔNG dùng emojis (⚙️✅❌🚀) làm UI icons — dùng SVG (Heroicons/Lucide).

### Findings:

| File | Line | Emoji | Fix |
|------|------|-------|-----|
| `src/components/ui/CommandPalette.tsx` | 16 | ⚙️ | `<CogIcon />` |
| `src/pages/AgencyOSDemo.tsx` | 153 | 🚀 | `<RocketIcon />` |
| `src/pages/agency-os-demo/agency-os-demo-execution-log-panel.tsx` | 23 | ⚙️ | `<CogIcon />` |
| `src/pages/agency-os-demo/agency-os-demo-execution-log-panel.tsx` | 75 | ✅ | `<CheckCircleIcon />` |
| `src/pages/agency-os-demo/agency-os-demo-execution-log-panel.tsx` | 80 | ❌ | `<XCircleIcon />` |
| `src/components/MarketingTools/ai-landing-page-builder.tsx` | 181 | ✅ | `<CheckCircleIcon />` |

**Impact**: Emojis render differently across OS/devices → UI không đồng bộ, thiếu professional.

---

## 🟡 MEDIUM: Missing cursor-pointer

**Rule**: Tất cả clickable elements PHẢI có `cursor-pointer`.

### Findings (partial list):

| File | Element | Missing |
|------|---------|---------|
| `src/components/ui/CommandPalette.tsx` | button (close) | ❌ |
| `src/components/ui/CommandPalette.tsx` | button (category) | ❌ |
| `src/components/ui/CommandPalette.tsx` | div (command item) | ❌ |
| `src/components/ui/Toast.tsx` | button (dismiss) | ❌ |
| `src/components/ui/ErrorBoundary.tsx` | button (retry) | ❌ |
| `src/components/landing/FeaturedProducts.tsx` | button (navigate) | ❌ |
| `src/components/landing/landing-roadmap-section.tsx` | div (vision) | ❌ |
| `src/components/LeaderDashboard/at-risk-members-list-with-actions.tsx` | button (reminder) | ❌ |
| `src/components/Referral/ReferralLinkCard.tsx` | button (copy) | ❌ |

**Impact**: UX kém — user không biết element có thể click.

---

## 🟡 MEDIUM: Font Inconsistencies

**Current Setup**:
```css
/* src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;700;800&display=swap');
```

**Issue**: Mixed font usage:
1. `src/main.tsx:77` — `fontFamily: 'system-ui, -apple-system, sans-serif'`
2. `src/index.css` — Inter (body) + Outfit (display)
3. `src/components/reports/commission-report-pdf-stylesheet-definitions.ts` — Helvetica

**Recommended** (per UI/UX Pro Max):
```css
/* Fira Code + Fira Sans for Data Dashboard */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
```

---

## 🟡 MEDIUM: Missing Hover Transitions

**Rule**: Hover states PHẢI có `transition-colors duration-200` (150-300ms).

### Findings:

Elements có onClick nhưng không có hover transition:
- `src/components/ui/ErrorBoundary.tsx` — 3 buttons (retry, reload, home)
- `src/components/landing/landing-roadmap-section.tsx` — Vision CTA
- `src/components/LeaderDashboard/at-risk-members-list-with-actions.tsx` — Action buttons

---

## 🟠 HIGH: Accessibility Issues

### Missing aria-labels:

Icon-only buttons cần aria-label:
```tsx
// ❌ SAI
<button onClick={onClose}>✕</button>

// ✅ ĐÚNG
<button onClick={onClose} aria-label="Close modal">
  <XMarkIcon className="w-5 h-5" />
</button>
```

**Scan needed**:
```bash
grep -rn "aria-label" src/components --include="*.tsx" | wc -l
```

---

## 📊 Design System Recommendations

### Target: MLM/Network Marketing Dashboard

**Pattern**: Data-Dense Dashboard
- Multiple charts/widgets
- Data tables, KPI cards
- Minimal padding, grid layout
- Space-efficient, maximum data visibility

**Best For**: Business intelligence, financial analytics, enterprise reporting

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary | #3B82F6 | Buttons, links, CTAs |
| Secondary | #60A5FA | Secondary actions |
| CTA | #F97316 | Primary actions (orange hot) |
| Background | #F8FAFC | Light mode bg |
| Text | #1E293B | Body text |

**Notes**: Cool→Hot gradients + neutral grey

### Typography

| Element | Font | Weights |
|---------|------|---------|
| Display (H1-H3) | Fira Sans | 500, 600, 700, 800 |
| Body | Fira Code | 400, 500, 600 |
| Mono (code) | Fira Code | 400, 500, 600, 700 |

**Google Fonts URL**:
```
https://fonts.google.com/share?selection.family=Fira+Code:wght@400;500;600;700|Fira+Sans:wght@300;400;500;600;700
```

### Key Effects

- Hover tooltips on all icons
- Chart zoom on click
- Row highlighting on hover
- Smooth filter animations (200ms)
- Data loading spinners

### Anti-patterns (TRÁNH)

- ❌ Ornate design (quá cầu kỳ)
- ❌ No filtering (thiếu filter data)
- ❌ Emoji icons
- ❌ Missing cursor feedback
- ❌ Inconsistent fonts

---

## 🔧 Fix Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Replace emoji icons | 1h | HIGH |
| P0 | Add cursor-pointer to all buttons | 2h | HIGH |
| P1 | Standardize fonts (Fira Sans/Code) | 2h | MEDIUM |
| P1 | Add hover transitions | 2h | MEDIUM |
| P1 | Add aria-labels to icon buttons | 1h | HIGH (a11y) |
| P2 | Focus state improvements | 1h | MEDIUM |
| P2 | prefers-reduced-motion check | 30m | LOW |

**Total Estimated**: 8-10 hours

---

## ✅ Pre-Delivery Checklist

Copy/paste checklist từ UI/UX Pro Max skill:

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] Brand logos are correct (verified from Simple Icons)
- [ ] Hover states don't cause layout shift
- [ ] Use theme colors directly (bg-primary) not var() wrapper

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation

### Light/Dark Mode
- [ ] Light mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Test both modes before delivery

### Layout
- [ ] Floating elements have proper spacing from edges
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected

---

## 📝 Next Steps

1. **Replace emoji icons** — Use Heroicons/Lucide SVG
2. **Add cursor-pointer** — To all onClick elements
3. **Standardize fonts** — Switch to Fira Sans/Code
4. **Add hover transitions** — duration-200 to all interactive
5. **Add aria-labels** — To icon-only buttons
6. **Verify responsive** — Test 375px, 768px, 1024px, 1440px

---

*Audit completed at 2026-03-03 20:10:45 UTC+7*
*WellNexus RaaS Platform*
