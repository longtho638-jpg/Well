# Phase 01 — Hero Copy Rewrite + Primary CTA Fix

**Priority:** P0 · **Effort:** 1h · **Status:** pending

## Context Links
- `src/components/landing/landing-hero-section.tsx:103-136`
- `src/locales/vi.ts` → `landing.hero.*`
- Plan: `plan.md`

## Overview

Current hero headline "Xây dựng sự nghiệp / Với WellNexus" fails all 4-U criteria:
- Not Urgent (no time pressure)
- Not Ultra-specific (no number, no outcome)
- Not Unique (generic career-building language)
- Useful only vaguely

Secondary CTA "Tìm hiểu thêm" has no `onClick` handler — dead button.

## Key Insights

- Primary conversion goal = partner registration (`/venture` route)
- Audience: Vietnamese aspiring entrepreneurs/distributors seeking side income
- Strongest proof point available: 157 slots remaining + 1,243+ active partners + 320% YoY growth
- Passive income amount shown in bento: 12,450,000₫/month average — this is the REAL hook
- Copy should lead with **income outcome**, not brand/platform name

## Requirements

### Functional
- Headline must state specific income outcome or opportunity cost
- Primary CTA must be 1st-person or action-specific (not "Bắt đầu ngay")
- Secondary CTA must scroll to `#roadmap` section (already exists as section id)
- Badge text should create urgency context

### Non-functional
- No layout changes — copy swap only (low risk)
- Must remain i18n-compatible (update vi.ts keys only)
- Both vi/en locale files must be updated

## Architecture

Copy-only change:
```
vi.ts landing.hero.* → updated strings
en.ts landing.hero.* → updated strings (English equivalent)
```

No component changes needed. `landing-hero-section.tsx` secondary button already rendered but missing `onClick`:
```tsx
// Line 133 - currently missing onClick
<button className="btn-aura-outline w-full sm:w-auto">
  {content.hero.secondaryCta}
</button>
```
Fix: add `onClick={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })}` or wire through `onLearnMore` prop.

## Related Code Files

- **Modify:** `src/locales/vi.ts` — hero copy strings
- **Modify:** `src/locales/en.ts` — hero copy strings
- **Modify:** `src/components/landing/landing-hero-section.tsx:133` — add onClick to secondary CTA
- **Modify:** `src/pages/LandingPage.tsx` — pass `onLearnMore` handler to HeroSection

## Implementation Steps

1. Update `vi.ts`:
   ```
   title: "Thu Nhập 12 Triệu/Tháng"  (from bento passive_income amount)
   badge_ultimate: "157 Slot Còn Lại Hôm Nay"
   headlineAccent: "Bắt đầu Thu Nhập Thụ Động"
   subtitle: "1,243 Đối tác đang kiếm trung bình 12,450,000₫/tháng với AI coaching, không cần vốn tồn kho."
   cta: "Nhận Slot Của Tôi"  (1st person: "Get MY Slot")
   learnMore: "Xem Lộ Trình"  (routes to roadmap section)
   ```
2. Update `en.ts` with equivalent English copy
3. In `landing-hero-section.tsx`: add `onLearnMore?: () => void` prop, wire secondary button
4. In `LandingPage.tsx`: pass `onLearnMore={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })}`

## Todo List

- [ ] Update `vi.ts` hero copy (badge_ultimate, title, headlineAccent, subtitle, cta, learnMore)
- [ ] Update `en.ts` hero copy
- [ ] Add `onLearnMore` prop to `LandingHeroSection` interface
- [ ] Wire secondary CTA `onClick` in hero component
- [ ] Verify no i18n key mismatches (run `npm run i18n:validate`)
- [ ] Run `npm run build` to confirm 0 errors

## Success Criteria

- Hero headline includes specific income figure (₫12,450,000) or slot count
- Primary CTA says "Nhận Slot Của Tôi" or first-person equivalent
- Secondary CTA scrolls to #roadmap (no dead links)
- `npm run i18n:validate` passes
- `npm run build` exits 0

## Risk Assessment

- **LOW** — copy-only change, no logic affected
- Risk: passive income figure (12,450,000₫) must match bento display for message match
- Mitigation: use same key `landing.bento.passive_income.amount` or hardcode consistent value

## Security Considerations

- No data handling changes
- Ensure no XSS via string injection (i18n strings are safe by React escaping)

## Next Steps

→ Phase 02: Reorder bento grid to lead with income proof card
