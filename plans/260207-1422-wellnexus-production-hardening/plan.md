---
title: "WellNexus Production Hardening"
description: "Security, polish, performance optimization for production readiness"
status: pending
priority: P1
effort: 16h
branch: main
tags: [security, performance, i18n, pwa, production]
created: 2026-02-07
---

# WellNexus Production Hardening - Implementation Plan

## Overview

Comprehensive production hardening addressing security vulnerabilities, UI/UX polish, i18n completion, PWA enablement, and performance optimization.

**Goal:** Transform WellNexus from "Go-Live Ready" to "Enterprise-Grade Production"

**Effort:** ~16 hours across 4 phases

---

## Phase Status

| Phase | Focus | Status | Effort | Priority |
|-------|-------|--------|--------|----------|
| [Phase 1](./phase-01-payos-security-hardening.md) | PayOS Security + RLS | ⏳ Pending | 4h | P1 Critical |
| [Phase 2](./phase-02-admin-dashboard-polish.md) | Admin Dashboard Polish | ⏳ Pending | 4h | P1 High |
| [Phase 3](./phase-03-i18n-pwa-completion.md) | i18n + PWA Completion | ⏳ Pending | 4h | P2 Medium |
| [Phase 4](./phase-04-performance-final-polish.md) | Performance + SDK | ⏳ Pending | 4h | P2 Medium |

---

## Key Improvements

### Security Enhancements
- Move PayOS logic to Supabase Edge Functions (eliminate client-side secrets)
- Implement comprehensive RLS policies for all sensitive tables
- Add admin role verification for protected routes

### UI/UX Polish
- Standardize admin dashboard to "Aura Elite" design system
- Implement consistent glassmorphism across all components
- Add protected route guards with role checks

### Internationalization
- Create complete English translation file (`en.ts`)
- Audit and fix all hardcoded strings
- Ensure key path consistency across codebase

### Performance Optimization
- Enable VitePWA plugin with proper service worker
- Implement code splitting for routes and CSS
- Lighthouse audit fixes for Core Web Vitals

### Integration
- Connect Mekong-cli Hub SDK for agent orchestration
- Implement proper error boundaries and monitoring

---

## Success Criteria

- ✅ Zero client-side payment secrets (all in Edge Functions)
- ✅ RLS policies enforced on all sensitive tables
- ✅ Admin dashboard matches Aura Elite design system
- ✅ 100% i18n coverage (0 hardcoded strings)
- ✅ PWA installable with offline support
- ✅ Lighthouse score: 90+ Performance, 100 Accessibility
- ✅ Mekong-cli SDK integrated and functional

---

## Dependencies

**External:**
- Supabase Edge Functions runtime
- Vercel deployment environment
- PayOS API credentials (server-side only)

**Internal:**
- Existing Aura Elite components library
- Current i18n infrastructure (react-i18next)
- VitePWA plugin configuration

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Edge Function deployment failures | High | Test locally with Supabase CLI first |
| RLS policy breaking existing flows | High | Comprehensive testing before deploy |
| i18n key mismatches | Medium | Automated key validation script |
| PWA caching issues | Medium | Clear cache strategy in sw.ts |
| Performance regression | Low | Lighthouse CI monitoring |

---

## Next Steps

1. Start with Phase 1 (Security) - highest priority
2. Parallel work possible on Phase 3 (i18n) if separate developer
3. Phase 2 and 4 depend on Phase 1 completion
4. Full QA cycle after Phase 4

---

**Plan Created:** 2026-02-07
**Target Completion:** 2026-02-09
**Estimated Total Effort:** 16 hours
