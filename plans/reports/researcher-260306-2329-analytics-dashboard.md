# Analytics Dashboard Implementation Research

**Date:** 2026-03-06
**Work Context:** /Users/macbookprom1/mekong-cli/apps/well
**Status:** Complete

---

## 1. EXISTING DASHBOARD COMPONENTS

### Charting Library
- **Recharts** - Used across all dashboards (RevenueChart, TeamCharts, PartnerDashboard)
- Lazy-loaded via `components/charts/lazy-charts.tsx`
- Components: `AreaChart`, `PieChart`, `ResponsiveContainer`

### Dashboard Pages Found
| Page | Route | Ownership |
|------|-------|-----------|
| `Dashboard.tsx` | `/dashboard` | Distributor user dashboard |
| `LeaderDashboard.tsx` | `/leader-dashboard` | Team/Network dashboard |
| `CommissionDashboard.tsx` | `/commission-dashboard` | Earnings dashboard |
| `Overview.tsx` | `/admin` | Admin Mission Control |
| `VendorDashboard.tsx` | Marketplace vendor analytics |
| `PartnerDashboard` | Admin partners management |

### Admin Auth Pattern
```
AdminRoute → evaluateRouteGuard(user, requireAuth, requiredRoles) → AdminLayout
```
- Checks: isAuthenticated, role (admin/super_admin), RaaS license
- Uses `@/lib/vibe-auth` route guard system
- Email whitelist via `getAdminEmails()`

---

## 2. USAGE METERING INTEGRATION

### Edge Function: `supabase/functions/usage-analytics/index.ts`
**GET Endpoints:**
- `/usage-analytics?query=current&user_id=xxx` - Today's usage + quotas
- `/usage-analytics?query=quotas&user_id=xxx` - Tier-based quotas
- `/usage-analytics?query=breakdown&period=day|week|month` - Time-series data
- `/usage-analytics?query=summary&org_id=xxx&period=week` - Org-level analytics

**POST Endpoint:**
- Usage event ingestion (idempotency supported via RPC)

**Response Format:**
```typescript
{
  summary: { total_usage, total_events, unique_users, period },
  by_feature: [{ feature, total, count }],
  by_hour: [{ hour, usage }],
  top_users: [{ user_id, total_usage }],
  trend: [{ date, usage }]
}
```

### Client Service: `src/lib/usage-aggregator.ts`
- Real-time Supabase subscriptions
- `getRealTimeSummary()` - Aggregated usage stats
- `getHourlyTrend()` - Hour-level breakdown
- `getTopUsers()` - Top 10 users by usage
- Caching with auto-invalidation

---

## 3. ADMIN AUTH PATTERNS

### Route Guard (`lib/vibe-auth/auth-guard-utils.ts`)
```typescript
// Pure function, no React dependency
evaluateRouteGuard(config, user, isAuthenticated): 'allow' | 'redirect-login' | 'redirect-unauthorized'

checkAdminAccess(user, adminEmails): boolean
// Checks: user.isAdmin, role === 'admin/super_admin', email whitelist
```

### Protected Route Component
```tsx
<AdminRoute>
  <AdminLayout>
    <Outlet /> {/* Overview, AuditLog, Partners, Finance, etc. */}
  </AdminLayout>
</AdminRoute>
```

### Role Hierarchy
- `super_admin` - Full access
- `admin` - Standard admin
- `email whitelist` - Email-based access (for non-role users)

---

## 4. UI/UX PATTERNS

### Design System (Aura Elite - Glassmorphism)
- Background: `zinc-950/80` to `zinc-900/50`
- Borders: `white/5` to `white/20`
- Gradients: Teal (`#00575A`), Amber (`#FFBF00`), Emerald (`#10B981`)
- Typography: 10px-5xl, uppercase tracking-widest

### Date Range Pickers
- Simple `<select>` dropdowns in chart headers
- Options: `7d`, `30d`, `month`, `year`
- No external date picker library needed

### Export Functionality
**CSV Pattern** (`utils/csv-export-utility.ts`):
```tsx
import { exportToCSV, CSVColumn } from '@/utils/csv-export-utility';

const columns: CSVColumn[] = [
  { key: 'id', header: 'ID' },
  { key: 'amount', header: 'Amount', formatter: (v) => formatVND(v) }
];

exportToCSV(data, columns, 'filename.csv');
```

**Used in:**
- `CommissionWallet.tsx` - Earnings export
- `admin-panel/WithdrawalsPage.tsx` - Withdrawal export
- Partner table exports

---

## 5. CSV EXPORT

### Library Status
**No external dependency** - Custom utility at `src/utils/csv-export-utility.ts`

### Features
- `convertToCSV<T>(data, columns)` - Build CSV string
- `downloadCSV(csv, filename)` - Trigger download
- `exportToCSV<T>(data, columns, filename)` - One-call export
- Auto-quote handling for special characters
- Formatter support per column

---

## 6. RECOMMENDED IMPLEMENTATION APPROACH

### What Exists
| Component | Status |
|-----------|--------|
| Recharts integration | ✅ Already installed |
| CSV export utilities | ✅ Custom implementation |
| Admin auth guard | ✅ vibe-auth SDK |
| Usage analytics API | ✅ Edge Function ready |
| License gate | ✅ RaaS license check |
| Support for admin routes | ✅ AdminRoute component |

### Missing for Analytics Dashboard

**Priority 1 (Core Analytics):**
1. Usage analytics hook (`useUsageAnalytics.ts`) - fetch from edge function
2. Chart components for usage metrics:
   - Usage trends (AreaChart)
   - Feature breakdown (PieChart)
   - Top users table
3. Date range filter component
4. Real-time subscription for live updates

**Priority 2 (Export & UI):**
5. License usage card component
6. Period selector (7d/30d/90d)
7. Export CSV button (reuse existing utility)

**Priority 3 (Admin Features):**
8. Rate limit display (show tier limits alongside usage)
9. Alerts for high usage (>80%, >90%)
10. Detailed event breakdown table

---

## 7. FILES TO CREATE/MODIFY

### New Files
- `src/hooks/useUsageAnalytics.ts` - Analytics data fetching
- `src/components/Analytics/UsageTrendChart.tsx` - Usage trend visualization
- `src/components/Analytics/FeatureBreakdownChart.tsx` - Feature占比 charts
- `src/components/Analytics/ApiQuotaCard.tsx` - Quota display
- `src/components/Analytics/TopUsersTable.tsx` - Top users component

### Modified Files
- `src/pages/Admin/Overview.tsx` - Add usage metrics section
- `src/locales/en/admin.ts` + `vi.ts` - Add i18n keys for analytics
- `src/components/AdminRoute.tsx` - Already handles admin protection

---

## 8. I18N REQUIREMENTS

Add to `src/locales/en/admin.ts` and `src/locales/vi/admin.ts`:
```typescript
usageAnalytics: {
  title: 'Usage Analytics',
  overview: 'Overview',
  usageTrend: 'Usage Trend',
  featureBreakdown: 'Feature Breakdown',
  topUsers: 'Top Users',
  apiCalls: 'API Calls',
  tokens: 'Tokens',
  modelInference: 'Model Inference',
  agentExecutions: 'Agent Executions',
  quota: 'Quota',
  remaining: 'Remaining',
  used: 'Used',
  unlimited: 'Unlimited'
}
```

---

## 9. QUICK START IMPLEMENTATION

```bash
# 1. Create usage analytics hook
npx claude /code create src/hooks/useUsageAnalytics.ts

# 2. Add CSV i18n keys
npx claude /docs update src/locales/en/admin.ts

# 3. Build analytics components
npx claude /cook "Create analytics dashboard components"
```

---

## UNRESOLVED QUESTIONS

1. **Which additional chart types** are needed beyond trend/percentage?
2. **Real-time data**: Should dashboard auto-refresh or use Supabase Realtime?
3. **Export format**: CSV only, or also PDF (requirejsPDF)?
4. **Data retention**: How far back should analytics go? (Currently edge function supports 30 days)
5. **Multi-org support**: Will single admin manage multiple orgs? (requires org selector)

---

**Report generated:** 2026-03-06 23:29
**Researcher:** researcher-260306-2329
