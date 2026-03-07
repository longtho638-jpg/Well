---
title: ROIaaS Phase 5 - Analytics Dashboard
description: Dual-stream revenue + usage analytics with ROI calculator, premium visualizations, and 7 dashboard enhancements
status: complete
priority: P1
effort: 4h
branch: main
tags: [roiaas, analytics, revenue, roi, dashboard, phase-5, phase-6]
created: 2026-03-07
completed: 2026-03-07T21:45+07:00
progress: 100%
---

# ROIaaS Phase 5: Analytics Dashboard

## Implementation Summary

✅ **COMPLETE** - All phases implemented and tested

| Phase | Status | Files |
|-------|--------|-------|
| 1. Revenue Schema | ✅ | `supabase/migrations/202603071500_revenue_analytics_schema.sql` |
| 2. Revenue Hooks | ✅ | `src/hooks/analytics/use-revenue.ts` |
| 3. Revenue Dashboard | ✅ | `src/components/analytics/RevenueMetricsCards.tsx` |
| 4. User Metrics | ✅ | `src/components/analytics/UserMetricsDashboard.tsx` |
| 5. ROI Calculator | ✅ | `src/components/analytics/ROICalculator.tsx` |
| 6. Premium Viz | ✅ | `src/components/analytics/PremiumCharts.tsx` |
| Main Page | ✅ | `src/pages/AnalyticsDashboard.tsx` |
| Types | ✅ | `src/types/revenue-analytics.ts` |
| i18n | ✅ | `src/locales/en|vi/analytics.ts` |
| 7. Analytics Dashboard Enhancements | ✅ | `src/hooks/use-top-endpoints.ts`, `src/components/analytics/TopEndpointsChart.tsx`, `src/components/analytics/RevenueByTierChart.tsx`, `src/components/admin/LicenseAnalyticsDashboard.tsx` |

## Verification

- **TypeScript:** 0 errors
- **Lint:** 0 critical (minor file-size warnings)
- **Build:** READY

## Overview

Build comprehensive analytics dashboard following HIẾN PHÁP ROIaaS dual-stream model:
1. **Engineering ROI** - API usage, agent metrics, ROI per license key
2. **Operational ROI** - Revenue tracking (GMV/MRR/ARR), user metrics, conversion rates

## Context

- **Existing:** `usage-analytics.ts`, `UsageGaugeCard`, `TopConsumersTable`, `usage-metering`
- **Phase 5 Legacy:** `plans/260307-1123-usage-metering-dashboard/plan.md` (evolved into ROIaaS)
- **Schema:** `raas_licenses`, `usage_records`, `usage_events`, `stripe_usage_audit_log`

## ROIaaS Dual-Stream Requirements

### Engineering ROI (Dev Key)
| Metric | Purpose | Data Source |
|--------|---------|-------------|
| API Calls/Key | Track developer usage | `usage_records` |
| Agent Executions | ROI per agent type | `usage_events` |
| Model Inferences | AI consumption analytics | `usage_records.metadata` |
| Cost/Key | Calculate infrastructure cost | Stripe sync logs |
| ROI/Key | Revenue vs cost per license | Revenue - Cost |

### Operational ROI (User UI)
| Metric | Purpose | Data Source |
|--------|---------|-------------|
| GMV | Gross merchandise value | Subscription payments |
| MRR | Monthly recurring revenue | Active subscriptions |
| ARR | Annual recurring revenue | MRR × 12 |
| Conversion Rate | Tier upgrade rate | License tier changes |
| Churn Rate | Cancellation tracking | License revocations |
| DAU/MAU | Active user metrics | Daily usage records |

## Phases

| # | Phase | Status | Deliverables | Effort |
|---|-------|--------|--------------|--------|
| 1 | Revenue Schema | complete | Revenue tables, ROI types, i18n keys | 2h |
| 2 | Revenue Hooks | complete | `useRevenue`, `useMetrics`, `useROI` | 2.5h |
| 3 | Revenue Dashboard | complete | GMV/MRR/ARR cards, revenue trends | 3h |
| 4 | User Metrics | complete | DAU/MAU, cohorts, churn, funnels | 2.5h |
| 5 | ROI Calculator | complete | ROI engine, cost calculator, margins | 2h |
| 6 | Premium Viz | complete | Aura Elite charts, gauges, export | 2h |

## Effort Breakdown

- **Phase 1:** 2h - Schema, types, i18n, views ✅
- **Phase 2:** 2.5h - Hooks, context, data fetching ✅
- **Phase 3:** 3h - Revenue dashboard UI components ✅
- **Phase 4:** 2.5h - User analytics, cohort analysis ✅
- **Phase 5:** 2h - ROI calculation engine + UI ✅
- **Phase 6:** 2h - Premium visualizations, export ✅
- **Total:** 14h

## Dependencies

- **Blocks:** Phase 6 (Usage-based billing), Phase 7 (RaaS monetization)
- **Blocked by:** None - existing usage tracking ready
- **Related:** `raas_licenses`, `usage_records`, Stripe reconciliation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ROIaaS Analytics Dashboard               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Engineering ROI │  │  Operational ROI │                │
│  │  (Dev Key)       │  │  (User UI)       │                │
│  │  - API calls/key │  │  - GMV/MRR/ARR   │                │
│  │  - Agent exec    │  │  - Conversion    │                │
│  │  - Model inf     │  │  - Churn/DAU     │                │
│  │  - Cost/Key      │  │  - Cohorts       │                │
│  │  - ROI/Key       │  │  - Funnels       │                │
│  └──────────────────┘  └──────────────────┘                │
├─────────────────────────────────────────────────────────────┤
│                    ROI Calculator Engine                    │
│  Revenue - Cost = ROI | Margin % | LTV | CAC               │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│  Usage Records  │          │  Revenue Data   │
│  - api_calls    │          │  - subscriptions│
│  - tokens       │          │  - license fees │
│  - inferences   │          │  - upgrades     │
└─────────────────┘          └─────────────────┘
```

## Success Criteria

1. **Dual Dashboard:** Both Engineering + Operational ROI views live
2. **Real-time Data:** Metrics update within 30s of usage events
3. **ROI Accurate:** ROI calculations match Stripe reconciliation
4. **Premium Design:** Aura Elite glassmorphism applied consistently
5. **Export Ready:** PDF/CSV export for all dashboards
6. **Zero Errors:** TypeScript 0 errors, all tests passing

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex ROI calculations | Medium | Unit tests for each formula |
| Real-time performance | Medium | Incremental updates, caching |
| Data accuracy | High | Reconciliation with Stripe daily |
| Visual overload | Low | Progressive disclosure, tabs |

## Security Considerations

- RLS on revenue tables (org-level isolation)
- License key validation for Engineering ROI access
- Admin-only access for Operational ROI
- Audit log for all ROI calculations

## Analytics Dashboard Enhancements (Phase 6)

| Feature | Status | Description |
|---------|--------|-------------|
| AdminRoute Protection | ✅ | `/admin/analytics` protected |
| Top Endpoints Chart | ✅ | Top 10 endpoints by call volume |
| Revenue by Tier Chart | ✅ | Pie chart with tier breakdown |
| Real-time Auto Refresh | ✅ | 30s polling interval |
| Time Granularity Toggle | ✅ | Day/Week/Month views |
| Real Tier Distribution | ✅ | DB data (not mock) |
| Top Customers Toggle | ✅ | By Spend / By Usage |

## Next Steps

**All phases complete. Production deployment ready.**

---

_Last Updated: 2026-03-07T21:45+07:00_
_Author: Project Manager_
_Status: COMPLETE - All phases implemented, tested, and verified_
