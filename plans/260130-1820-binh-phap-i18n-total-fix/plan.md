---
title: "🌐 Binh Pháp i18n Total Fix"
description: "Comprehensive i18n implementation fixing all translation keys, hardcoded text, and ensuring 100% Vietnamese/English support"
status: in_progress
priority: P0
effort: 1 day
issue: N/A
branch: binh-phap-i18n-fix
tags: [i18n, translation, ux, production-ready]
created: 2026-01-30
---

# 🌐 Binh Pháp i18n Total Fix

**Mission**: Fix ALL i18n translation issues - eliminate ALL visible translation keys and hardcoded text

## Executive Summary

**Critical Findings from Audit:**
- **CartSummary.tsx**: 100% hardcoded Vietnamese (checkout unusable for English users)
- **Landing page**: Uses t() with missing keys, falls back to hardcoded strings
- **Mock data**: Leaderboard, HealthCheck, Copilot have hardcoded Vietnamese arrays
- **Locale files**: vi.ts has 1000+ auto-generated keys, en.ts significantly behind
- **Structure**: Duplicate namespaces (landing/landingpage, marketing/marketingtools)

## Implementation Phases

| # | Phase | Effort | Status | Link |
|---|-------|--------|--------|------|
| 1 | Critical Fixes (CartSummary, Missing Keys) | 2h | Planned | [phase-01-critical-fixes.md](./phase-01-critical-fixes-cart-missing-keys.md) |
| 2 | Locale Cleanup & Consolidation | 1h | Planned | [phase-02-locale-cleanup.md](./phase-02-locale-file-cleanup-consolidation.md) |
| 3 | Mock Data Extraction | 1h | Planned | [phase-03-mock-data-extraction.md](./phase-03-extract-mock-data-to-i18n.md) |
| 4 | Verification & Testing | 0.5h | Planned | [phase-04-verification-testing.md](./phase-04-i18n-verification-testing.md) |

## Critical Issues (P0)

### 1. CartSummary.tsx - 100% Hardcoded
```tsx
// CURRENT (BROKEN)
<p>Giỏ hàng trống</p>
<h3>Đơn hàng của bạn</h3>

// TARGET
<p>{t('cart.empty')}</p>
<h3>{t('cart.yourOrder')}</h3>
```

### 2. Missing Translation Keys
Components using t() with non-existent keys:
- `landing.featured.badge` → Missing
- `landing.featured.title` → Missing
- `landing.featured.viewAll` → Missing
- All HealthCheck product names hardcoded

### 3. Hardcoded Mock Data
- Leaderboard: `generateMockLeaderboard()` creates Vietnamese names
- CopilotPage: `initialChats` and prompts hardcoded
- MarketingTools: `contentTemplates` full Vietnamese paragraphs

## Success Criteria

**Điều 50: Hoàn Hảo**
- ✅ Zero visible translation keys in UI
- ✅ CartSummary 100% i18n compliant
- ✅ All landing page keys exist in locale files
- ✅ Mock data extracted to translations
- ✅ Language switcher works for ALL pages
- ✅ en.ts has parity with vi.ts
- ✅ No duplicate namespaces (landing/landingpage consolidated)

## Dependencies

- i18next: ^25.7.4
- react-i18next: ^16.5.2
- Existing locale files: src/locales/vi.ts, src/locales/en.ts

## Risk Assessment

**Low Risk:**
- CartSummary refactoring (isolated component)
- Adding missing keys (additive only)
- Mock data extraction (no runtime changes)

**Medium Risk:**
- Locale file consolidation (namespace changes require code updates)

**Mitigation:**
- Run full test suite after each phase
- Verify UI manually in both languages
- Incremental commits with rollback points

---

**Next Step:** Execute Phase 1 - Critical Fixes
