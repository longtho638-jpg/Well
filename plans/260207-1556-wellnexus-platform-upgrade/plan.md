---
title: "WellNexus Platform Upgrade - Production Hardening"
description: "PayOS security hardening, Aura Elite admin dashboard, i18n sync, PWA enhancement, SEO optimization, and security headers"
status: pending
priority: P1
effort: 12h
branch: main
tags: [security, pwa, i18n, seo, admin, payos]
created: 2026-02-07
---

# WellNexus Platform Upgrade - Production Hardening

## Overview

Comprehensive upgrade to WellNexus platform focusing on **production readiness**, **security hardening**, and **user experience optimization**. This plan addresses critical infrastructure gaps identified in recent audits.

**Target:** Enterprise-grade production deployment with 90+ audit score

## Context

- **Current Status:** Production deployed at wellnexus.vn with 230 tests passing
- **Stack:** React 19, TypeScript 5.7+, Vite 7, Supabase, PayOS integration
- **Design System:** Aura Elite (Glassmorphism, dark gradients)
- **Recent Work:** PayOS integration complete, email system operational

## Success Criteria

- [ ] **Security:** All headers properly configured (HSTS, CSP hardening)
- [ ] **i18n:** Zero raw translation keys in production (100% key coverage)
- [ ] **PWA:** Lighthouse PWA score 90+, installable on all platforms
- [ ] **SEO:** Meta tags complete, sitemap generated, structured data valid
- [ ] **Admin:** Aura Elite dashboard with PayOS transaction monitoring
- [ ] **Build:** TypeScript strict mode 0 errors, all tests passing

## Phase Overview

| Phase | Focus Area | Effort | Status |
|-------|-----------|--------|--------|
| [Phase 1](./phase-01-payos-security-hardening.md) | PayOS Security Hardening | 2h | Completed |
| [Phase 2](./phase-02-i18n-sync-validation.md) | i18n Sync & Validation | 2h | Completed |
| [Phase 3](./phase-03-pwa-enhancement.md) | PWA Enhancement | 2h | Completed |
| [Phase 4](./phase-04-seo-optimization.md) | SEO Optimization | 2h | Pending |
| [Phase 5](./phase-05-admin-dashboard-aura-elite.md) | Admin Dashboard (Aura Elite) | 3h | Pending |
| [Phase 6](./phase-06-security-headers-csp-hardening.md) | Security Headers & CSP | 1h | Pending |

**Total Effort:** 12 hours

## Key Dependencies

- Phase 2 (i18n) should complete before Phase 3 (PWA) - translation keys needed for offline mode
- Phase 1 (PayOS) must complete before Phase 5 (Admin) - transaction data needed for dashboard
- Phase 6 (Security) is final validation phase - runs after all features complete

## Architecture Changes

### 1. PayOS Integration Hardening
- Webhook signature verification (HMAC-SHA256)
- Transaction state machine with audit trail
- Retry logic with exponential backoff
- Error isolation (payment failures don't crash app)

### 2. i18n Validation Pipeline
- Pre-build translation key validation script
- Automated sync check between code `t()` calls and locale files
- CI/CD integration - fail build on missing keys
- Runtime fallback to prevent raw keys in production

### 3. PWA Service Worker Strategy
- **Precache:** Shell (HTML, CSS, JS) + critical assets
- **Runtime Cache:** API responses (Supabase), images (CDN)
- **Network-First:** User data (profiles, transactions)
- **Cache-First:** Static assets (fonts, icons)

### 4. SEO Structured Data
- Organization schema (WellNexus company info)
- Product schema (marketplace items with pricing)
- BreadcrumbList (navigation hierarchy)
- WebSite schema (search action)

### 5. Admin Dashboard Components
- **PayOS Transaction Monitor:** Real-time payment status tracking
- **Commission Analytics:** Visual breakdown of reward distribution
- **User Management:** Search, filter, role assignment (Aura Elite design)
- **Audit Log Viewer:** Security event tracking

### 6. Security Headers Enhancements
- **CSP Nonce:** Dynamic nonce generation for inline scripts
- **CORS Preflight:** Optimize for Supabase + PayOS domains
- **Subresource Integrity:** Add SRI hashes for CDN resources
- **Feature Policy:** Restrict camera, microphone, geolocation

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| PayOS webhook downtime | High | Retry queue with 24h persistence |
| i18n key mismatch in production | Critical | Automated validation in CI/CD pipeline |
| PWA cache stale data | Medium | Cache versioning with timestamp checks |
| CSP breaks third-party scripts | Medium | Gradual rollout with monitoring |
| Admin dashboard performance | Low | Lazy loading, pagination, virtual scrolling |

## Rollback Plan

1. **Phase 1-5:** Feature flags allow disabling new functionality
2. **Phase 6:** Security headers can be reverted via vercel.json update
3. **Emergency:** Git revert to commit before upgrade (`dc8d5f8`)

## Testing Strategy

- **Unit Tests:** All new utilities and hooks
- **Integration Tests:** PayOS webhook flow, i18n validation, PWA install
- **E2E Tests:** Admin dashboard workflows (Playwright)
- **Manual QA:** Browser testing (Chrome, Safari, Firefox), PWA install on iOS/Android
- **Security Scan:** `npm audit`, OWASP ZAP, CSP validator

## Deployment Checklist

- [ ] All 230+ existing tests pass
- [ ] New tests for PayOS hardening (10+ tests)
- [ ] i18n validation script passes with 0 errors
- [ ] PWA manifest valid (manifest.json schema check)
- [ ] Lighthouse audit: Performance 90+, PWA 90+, SEO 90+
- [ ] TypeScript build: 0 errors (strict mode)
- [ ] Security headers verified (securityheaders.com scan)
- [ ] PayOS test transaction successful
- [ ] Admin dashboard accessible to admin role only
- [ ] Browser verification: No console errors in production

## Related Documents

- [PayOS Documentation](https://payos.vn/docs)
- [Aura Elite Design System](../../docs/DESIGN_SYSTEM.md)
- [Code Standards](../../docs/code-standards.md)
- [Project Overview](../../docs/project-overview-pdr.md)

## Next Steps

1. Review and approve this plan
2. Execute phases sequentially (1 → 6)
3. Run verification after each phase
4. Deploy to production after Phase 6 completion
5. Monitor for 48h post-deployment

---

**Plan Created:** 2026-02-07
**Estimated Completion:** 2026-02-08
**Owner:** Planner Agent
**Status:** Ready for Execution
