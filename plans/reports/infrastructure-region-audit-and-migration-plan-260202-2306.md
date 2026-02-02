# Infrastructure Region Audit & Asia Migration Plan

**Date:** 2026-02-02 23:06
**Project:** WellNexus Distributor Portal
**Target Users:** Vietnam (Primary), Southeast Asia (Secondary)
**Objective:** Minimize latency by migrating infrastructure to Asia-Pacific regions

---

## I. Current Infrastructure Audit

### A. Supabase Configuration

**Current Status:**
- **URL Pattern:** `https://placeholder.supabase.co` (from .env.example template)
- **Actual Region:** UNKNOWN (requires client to provide production VITE_SUPABASE_URL)
- **Connection:** Via `@supabase/supabase-js` client library
- **Auth Storage:** Encrypted in-memory with sessionStorage fallback

**To Determine Current Region:**
```bash
# Extract region from Supabase URL
# Format: https://[project-ref].[region].supabase.co
# Example: https://abcdefgh.supabase.co (US East)
# Example: https://abcdefgh.ap-southeast-1.supabase.co (Singapore)
```

**Action Required:** Client must provide production `VITE_SUPABASE_URL` to determine current region.

### B. Vercel Deployment

**Current Deployment Region:**
- **Build Region:** Portland, USA (West) – pdx1 (from deployment logs)
- **Edge Network:** Global CDN (automatic)
- **Domain:** https://wellnexus.vn
- **Framework:** Vite (static site generation)

**Deployment Characteristics:**
- Static assets served via Vercel Edge Network (100+ global locations)
- No server-side rendering (SSR) - pure client-side app
- CDN automatically routes to nearest edge location
- Build happens in US-West, but delivery is global

### C. Firebase Services

**Current Configuration:**
- **Auth Domain:** `your-project-id.firebaseapp.com`
- **Project ID:** Not configured in .env.example
- **Region:** Default (likely us-central1)
- **Usage:** Authentication, Firestore

**To Determine Firebase Region:**
```bash
# Check Firebase Console → Project Settings → General
# Default region for new projects: us-central1
# Cannot be changed after project creation for most services
```

### D. Third-Party Services

**Google Gemini AI:**
- **Endpoint:** `generativelanguage.googleapis.com`
- **Region:** Google Cloud global endpoints (automatic routing)
- **Latency:** ~50-150ms from Asia (acceptable)

**Resend Email:**
- **Endpoint:** Resend API
- **Region:** Global (US-based but fast globally)
- **Impact:** Email sending latency (non-critical for user experience)

**Sentry:**
- **Endpoint:** `sentry.io`
- **Region:** Global (US-based)
- **Impact:** Error reporting only (non-critical)

---

## II. Regional Latency Analysis

### A. Vietnam → Current Infrastructure

**Expected Latencies (Estimates):**

| Service | Current Region (US-West) | Latency (Vietnam) | Impact |
|---------|-------------------------|-------------------|---------|
| Vercel CDN | Singapore Edge (auto) | ~10-30ms | ✅ Excellent |
| Supabase (US-East) | us-east-1 | ~250-300ms | ⚠️ Noticeable |
| Supabase (US-West) | us-west-1 | ~200-250ms | ⚠️ Noticeable |
| Supabase (EU) | eu-west-1 | ~300-350ms | ⚠️ High |
| Firebase (US-Central) | us-central1 | ~200-250ms | ⚠️ Noticeable |
| Gemini AI | Global | ~50-150ms | ✅ Acceptable |

**Critical Path:**
- **Page Load:** Vercel CDN (10-30ms) ✅ Fast
- **Auth Login:** Supabase (200-300ms) + Firebase (200-250ms) ⚠️ Slow
- **Database Queries:** Supabase (200-300ms) ⚠️ Slow
- **AI Coach:** Gemini (50-150ms) ✅ Fast

### B. Vietnam → Asia-Pacific Infrastructure

**Optimized Latencies (Estimates):**

| Service | Asia Region | Latency (Vietnam) | Improvement |
|---------|-------------|-------------------|-------------|
| Vercel CDN | Singapore Edge | ~10-30ms | No change (already optimal) |
| Supabase Singapore | ap-southeast-1 | ~30-50ms | -220ms (82% faster) |
| Supabase Tokyo | ap-northeast-1 | ~80-120ms | -150ms (60% faster) |
| Firebase Singapore | asia-southeast1 | ~30-50ms | -200ms (80% faster) |
| Firebase Tokyo | asia-northeast1 | ~80-120ms | -130ms (52% faster) |

**Critical Path After Migration:**
- **Page Load:** 10-30ms ✅ (unchanged)
- **Auth Login:** 30-50ms ✅ (85% faster)
- **Database Queries:** 30-50ms ✅ (85% faster)
- **AI Coach:** 50-150ms ✅ (unchanged)

**User Experience Impact:**
- Login/Signup: 400-500ms → 60-100ms (4-5x faster)
- Dashboard Load: 600-800ms → 80-150ms (5-7x faster)
- Data Mutations: 200-300ms → 30-50ms (6-8x faster)

---

## III. Available Asia-Pacific Regions

### A. Supabase Regions (2026 Availability)

**Asia-Pacific Regions:**

| Region Code | Location | Latency (Vietnam) | Features | Recommended |
|-------------|----------|-------------------|----------|-------------|
| `ap-southeast-1` | Singapore | ~30-50ms | Full (Database, Auth, Storage, Edge Functions) | ✅ **PRIMARY** |
| `ap-northeast-1` | Tokyo, Japan | ~80-120ms | Full (Database, Auth, Storage, Edge Functions) | ⚠️ Backup |
| `ap-south-1` | Mumbai, India | ~150-200ms | Full (Database, Auth, Storage, Edge Functions) | ❌ Too far |
| `ap-southeast-2` | Sydney, Australia | ~200-250ms | Full (Database, Auth, Storage, Edge Functions) | ❌ Too far |

**Recommendation:** Singapore (`ap-southeast-1`)
- Closest to Vietnam (~1,200 km vs Tokyo ~3,500 km)
- Submarine cables: AAG, SJC, APG (redundant connectivity)
- Lower latency than all other Asia options
- Full feature parity with US regions

**Migration Path:**
- Database: Can migrate existing Postgres database
- Auth: Can migrate user accounts (requires careful planning)
- Storage: Can migrate files (S3-compatible)
- Edge Functions: Deploy to new region (no migration needed)

### B. Firebase Regions

**Asia-Pacific Regions:**

| Region Code | Location | Latency (Vietnam) | Services | Recommended |
|-------------|----------|-------------------|----------|-------------|
| `asia-southeast1` | Singapore | ~30-50ms | Firestore, Cloud Functions, Storage | ✅ **PRIMARY** |
| `asia-northeast1` | Tokyo, Japan | ~80-120ms | Firestore, Cloud Functions, Storage | ⚠️ Backup |
| `asia-east1` | Taiwan | ~100-150ms | Firestore, Cloud Functions, Storage | ❌ Moderate |
| `asia-south1` | Mumbai, India | ~150-200ms | Firestore, Cloud Functions, Storage | ❌ Too far |

**⚠️ CRITICAL CONSTRAINT:**
- Firebase region **CANNOT be changed** after project creation
- Must create **NEW Firebase project** to change region
- Requires data migration and reconfiguration

**Recommendation:** Singapore (`asia-southeast1`)
- Matches Supabase region for consistency
- Lowest latency to Vietnam
- Industry standard for Southeast Asia deployments

### C. Vercel Edge Network

**Asia-Pacific Edge Locations:**

| Location | Code | Coverage | Auto-Enabled |
|----------|------|----------|--------------|
| Singapore | `sin1` | Southeast Asia | ✅ Yes |
| Hong Kong | `hkg1` | Greater China | ✅ Yes |
| Tokyo | `hnd1` | Japan, Korea | ✅ Yes |
| Sydney | `syd1` | Australia, NZ | ✅ Yes |

**Current Status:** ✅ Already Optimal
- Vercel automatically routes Vietnam traffic to Singapore edge (`sin1`)
- No configuration needed
- Static assets cached at edge (instant delivery)
- Build region (pdx1) doesn't affect end-user latency

**No Action Required:** Vercel edge network already optimized for Asia.

---

## IV. Migration Strategy

### Phase 1: Supabase Migration to Singapore (HIGHEST IMPACT)

**Pre-Migration Checklist:**
- [ ] Create new Supabase project in `ap-southeast-1` (Singapore)
- [ ] Export existing database schema and data
- [ ] Test database migration in staging environment
- [ ] Prepare user communication (planned downtime)

**Migration Steps:**

**1. Create New Supabase Project (Singapore)**
```bash
# Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Select Organization
4. Project Name: "WellNexus-Asia" (or similar)
5. Database Password: [Generate strong password]
6. Region: "Southeast Asia (Singapore)" - ap-southeast-1
7. Pricing Plan: [Current plan - Free/Pro]
8. Click "Create new project"
```

**2. Export Current Database**
```bash
# Using Supabase CLI or pg_dump
supabase db dump --db-url [OLD_DATABASE_URL] > backup.sql

# Or via Dashboard:
# Settings → Database → Connection String → Use with pg_dump
pg_dump -h [old-host] -U postgres -d postgres -F c -f backup.dump
```

**3. Migrate Schema and Data**
```bash
# Import to new Singapore project
psql -h [new-singapore-host] -U postgres -d postgres -f backup.sql

# Or using Supabase CLI:
supabase db push --db-url [NEW_DATABASE_URL]
```

**4. Migrate Auth Users**
```bash
# Export users from old project
# Via Supabase Dashboard → Authentication → Users → Export
# Or via API:
curl -X GET '[OLD_SUPABASE_URL]/auth/v1/admin/users' \
  -H "apikey: [SERVICE_ROLE_KEY]" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"

# Import to new project
# Via Supabase Dashboard → Authentication → Users → Import
# Or via SQL (careful with password hashes)
```

**5. Migrate Storage Files**
```bash
# Use Supabase Storage API or AWS S3 sync
# Export from old bucket
supabase storage download --bucket-id public --prefix "" --destination ./storage-backup

# Upload to new bucket
supabase storage upload --bucket-id public --source ./storage-backup
```

**6. Update Environment Variables**
```bash
# Update Vercel Environment Variables
VITE_SUPABASE_URL=https://[new-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[new-anon-key]
SERVICE_ROLE_KEY=[new-service-role-key]

# Deploy to trigger rebuild
vercel --prod
```

**7. Verify Migration**
```bash
# Test authentication flow
# Test database queries
# Test storage file access
# Monitor error rates in Sentry
```

**Estimated Downtime:** 30-60 minutes (can be reduced with blue-green deployment)

**Rollback Plan:**
- Keep old Supabase project active for 7 days
- Switch back to old `VITE_SUPABASE_URL` if issues detected
- Data sync strategy for rollback (if needed)

### Phase 2: Firebase Migration to Singapore (MODERATE IMPACT)

**⚠️ CRITICAL CONSTRAINT:**
- Firebase region cannot be changed for existing project
- **MUST create new Firebase project** in Asia region
- Requires reconfiguring all Firebase services

**Migration Steps:**

**1. Create New Firebase Project (Singapore)**
```bash
# Via Firebase Console
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Project Name: "WellNexus-Asia" (or similar)
4. Enable Google Analytics: [Optional]
5. Click "Create project"
```

**2. Configure Project Region**
```bash
# During first Cloud Firestore setup:
1. Go to Firestore Database → Create database
2. Select "Start in production mode"
3. **CRITICAL**: Select "asia-southeast1 (Singapore)" as location
4. This region CANNOT be changed later
5. Click "Enable"
```

**3. Migrate Firebase Authentication**
```bash
# Export users from old project
firebase auth:export users.json --project [old-project-id]

# Import to new project
firebase auth:import users.json --project [new-project-id] \
  --hash-algo=SCRYPT \
  --hash-key=[hash-key] \
  --hash-salt-separator=[separator]

# Note: Password hashes must be compatible
```

**4. Migrate Firestore Data**
```bash
# Export Firestore data
gcloud firestore export gs://[old-bucket]/firestore-backup \
  --project=[old-project-id]

# Import to new project
gcloud firestore import gs://[old-bucket]/firestore-backup \
  --project=[new-project-id]
```

**5. Update App Configuration**
```bash
# Get new Firebase config from Console
# Project Settings → General → Your apps → Config

# Update .env and Vercel variables
VITE_FIREBASE_API_KEY=[new-api-key]
VITE_FIREBASE_AUTH_DOMAIN=[new-project-id].firebaseapp.com
VITE_FIREBASE_PROJECT_ID=[new-project-id]
VITE_FIREBASE_STORAGE_BUCKET=[new-project-id].appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=[new-sender-id]
VITE_FIREBASE_APP_ID=[new-app-id]

# Deploy to Vercel
vercel --prod
```

**6. Verify Migration**
```bash
# Test Firebase Auth
# Test Firestore queries
# Test Cloud Storage
# Monitor Firebase Console for errors
```

**Estimated Downtime:** 1-2 hours (complex migration)

**Rollback Plan:**
- Keep old Firebase project active for 30 days
- DNS-based routing if needed
- Dual-write strategy during transition (advanced)

### Phase 3: Optimize Vercel Edge Configuration (OPTIONAL)

**Current Status:** ✅ Already optimal (auto-routing to Singapore)

**Optional Optimizations:**
```json
// vercel.json (add regions configuration)
{
  "regions": ["sin1", "hkg1", "hnd1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10,
      "regions": ["sin1"]
    }
  }
}
```

**Note:** Only relevant if you add Vercel Serverless Functions in the future.

---

## V. Migration Timeline & Costs

### A. Recommended Migration Sequence

**Week 1: Planning & Preparation**
- Day 1-2: Audit current infrastructure (gather all credentials)
- Day 3-4: Create new Supabase/Firebase projects in Singapore
- Day 5-7: Test migration scripts in staging environment

**Week 2: Supabase Migration**
- Day 8: Database schema export
- Day 9: Database data migration
- Day 10: Auth user migration
- Day 11: Storage file migration
- Day 12: Update environment variables
- Day 13: Verification and monitoring
- Day 14: Buffer for rollback if needed

**Week 3: Firebase Migration (Optional)**
- Day 15-16: Firebase Auth export/import
- Day 17-18: Firestore data migration
- Day 19: Update app configuration
- Day 20-21: Verification and monitoring

**Total Timeline:** 2-3 weeks (conservative estimate)

### B. Cost Analysis

**Supabase Migration Costs:**
- **New Project:** Same tier as current (Free/Pro/Team/Enterprise)
- **Data Transfer:** Supabase → Supabase (usually free within same tier)
- **Temporary Dual-Running:** 1-7 days of running both projects (2x cost temporarily)
- **Estimated Extra Cost:** $0-50 (depending on tier)

**Firebase Migration Costs:**
- **New Project:** Free tier → Free tier (no cost)
- **Data Transfer:** Export/Import (within free tier limits)
- **Temporary Dual-Running:** 1-30 days (2x cost if exceeding free tier)
- **Estimated Extra Cost:** $0-30 (usually free for small projects)

**Vercel Costs:**
- **No Change:** Edge network already included in current plan
- **Extra Deployments:** Free (included in plan)

**Total Migration Cost:** $0-80 (one-time)

### C. Performance ROI

**Current Performance (US regions):**
- Auth latency: 200-300ms
- Database queries: 200-300ms
- Total user interaction time: 400-600ms

**After Migration (Singapore):**
- Auth latency: 30-50ms
- Database queries: 30-50ms
- Total user interaction time: 60-100ms

**Performance Improvement:**
- **Latency Reduction:** 85% faster (340-500ms → 50-80ms)
- **User Experience:** 5-8x faster for critical operations
- **Competitive Advantage:** Best-in-class speed for Vietnam market

**Business Impact:**
- Faster login → Higher conversion rate
- Faster dashboard → Better user retention
- Lower latency → Premium brand perception
- Regional compliance → Data sovereignty (if required)

---

## VI. Risk Assessment & Mitigation

### A. Migration Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Data Loss** | Low | Critical | Full backup before migration, verify checksums |
| **Downtime Exceeds Window** | Medium | High | Blue-green deployment, rollback plan ready |
| **Auth Migration Failure** | Medium | High | Export password hashes correctly, test with sample users |
| **Breaking Changes** | Low | Medium | Thorough testing in staging, gradual rollout |
| **Cost Overrun** | Low | Low | Monitor billing during dual-running period |
| **Latency Not Improved** | Very Low | Medium | Pre-migration latency testing from Vietnam |

### B. Rollback Scenarios

**Scenario 1: Database Migration Fails**
```bash
# Immediate rollback to old Supabase URL
# Update Vercel env vars → redeploy (5 minutes)
# Zero data loss (old project still running)
```

**Scenario 2: Auth Migration Fails**
```bash
# Users cannot login to new project
# Rollback to old Firebase project
# Update credentials → redeploy (10 minutes)
# Lose auth data created during migration window only
```

**Scenario 3: Performance Not Improved**
```bash
# Unexpected latency issues
# Investigate: DNS, routing, Supabase region config
# If unsolvable: rollback to old regions
# Lesson learned: test latency before full migration
```

### C. Testing Strategy

**Pre-Migration Testing:**
```bash
# 1. Latency verification from Vietnam
curl -w "@curl-format.txt" -o /dev/null -s https://[new-supabase-url].supabase.co

# 2. Load testing (simulate production traffic)
# Use k6 or Artillery to test new infrastructure

# 3. Functional testing (all features work)
npm test (run full test suite against new endpoints)

# 4. User acceptance testing (beta users in Vietnam)
# Deploy to staging with new Asia endpoints
```

**Post-Migration Monitoring:**
```bash
# 1. Vercel Analytics (response times)
# 2. Sentry (error rates)
# 3. Supabase Dashboard (query performance)
# 4. Firebase Console (API usage patterns)
# 5. Real User Monitoring (Chrome DevTools Network tab from Vietnam)
```

---

## VII. Recommendations & Next Steps

### A. Immediate Actions (This Week)

**Priority 1: Determine Current Regions**
```bash
# Ask client to provide:
1. Production VITE_SUPABASE_URL (check actual region)
2. Firebase Project ID (check actual region in Console)
3. Current user count (for auth migration planning)
4. Current database size (for data migration planning)
```

**Priority 2: Latency Baseline Test**
```bash
# From Vietnam (or Vietnam VPN):
1. Test current Supabase latency: `curl -w "@curl-format.txt" https://[current-url]`
2. Test current Firebase latency: Monitor Network tab during auth
3. Document baseline metrics for comparison
```

**Priority 3: Supabase Singapore Trial**
```bash
# Create free trial project in Singapore
# Test latency from Vietnam
# Confirm expected performance improvement
# If improvement confirmed → proceed with migration plan
```

### B. Medium-Term Actions (Next 2-3 Weeks)

**If Latency Test Shows Significant Improvement:**
1. Execute Supabase Migration (Week 2)
2. Execute Firebase Migration (Week 3) - Optional if Firebase not heavily used
3. Monitor performance for 7 days
4. Decommission old projects (after stability confirmed)

**If Latency Test Shows Minimal Improvement:**
1. Investigate: Is current Supabase already in Asia?
2. Investigate: Are there other bottlenecks (frontend, network, etc.)?
3. Re-evaluate migration necessity
4. Consider other performance optimizations (caching, CDN, etc.)

### C. Long-Term Considerations

**Data Sovereignty & Compliance:**
- Vietnam Personal Data Protection Decree (13/2023/ND-CP)
- Potential future requirements for data localization
- Singapore as regional hub (ASEAN compliance friendly)

**Multi-Region Strategy (Advanced):**
- Primary: Singapore (Asia-Pacific)
- Backup: Tokyo (disaster recovery)
- Future: Hong Kong (if expanding to China market)

**Edge Computing (Future):**
- Vercel Edge Functions in Singapore
- Cloudflare Workers for dynamic content
- Database read replicas in multiple regions

---

## VIII. Decision Matrix

### Should You Migrate to Asia Region?

**Migrate to Singapore if:**
- ✅ Current Supabase is in US/EU (latency >200ms from Vietnam)
- ✅ User base primarily in Southeast Asia
- ✅ Users complain about slow loading times
- ✅ Competitive advantage requires best-in-class speed
- ✅ Budget allows for 2-3 weeks of dual-running costs ($0-80)

**Do NOT migrate if:**
- ❌ Current Supabase already in Singapore (check first!)
- ❌ User base is global (not concentrated in Asia)
- ❌ Budget is extremely tight
- ❌ Cannot afford any downtime (no maintenance window)
- ❌ Other performance issues are higher priority (frontend optimization, etc.)

**Recommended Decision Tree:**
```
1. Check current region → Is it US/EU?
   ├─ Yes → Proceed to Step 2
   └─ No (already Asia) → Migration not needed

2. Test latency from Vietnam → Is it >150ms?
   ├─ Yes → Proceed to Step 3
   └─ No → Migration may not provide significant benefit

3. Business priority → Is speed critical for success?
   ├─ Yes → Proceed to Step 4
   └─ No → Defer migration, revisit in 6 months

4. Budget available → Can afford $0-80 + 2-3 weeks effort?
   ├─ Yes → ✅ MIGRATE TO SINGAPORE
   └─ No → Defer migration, plan for next quarter
```

---

## IX. Conclusion

**Current Infrastructure Assessment:**
- Vercel: ✅ Already optimal (Singapore edge auto-routing)
- Supabase: ❓ Unknown region (requires client verification)
- Firebase: ⚠️ Likely US region (default for old projects)

**Recommended Action Plan:**

**Step 1: Verify Current State**
```bash
# Get from client:
- Production VITE_SUPABASE_URL
- Firebase Project ID
- Test latency from Vietnam
```

**Step 2: If US/EU Region Confirmed**
```bash
# Execute phased migration:
1. Supabase → Singapore (highest impact)
2. Firebase → Singapore (optional, moderate impact)
3. Monitor performance improvement
```

**Step 3: Expected Outcome**
```bash
# Performance improvement:
- Auth latency: 200-300ms → 30-50ms (85% faster)
- Database queries: 200-300ms → 30-50ms (85% faster)
- User experience: 5-8x faster for critical operations
```

**Strategic Value:**
- Competitive advantage: Best-in-class speed for Vietnam market
- User retention: Faster experience → higher engagement
- Future-proof: Compliance with potential data localization laws
- Regional expansion: Foundation for Southeast Asia growth

**Final Recommendation:** ✅ **MIGRATE TO SINGAPORE** (after verifying current region is US/EU)

---

**Report Generated:** 2026-02-02 23:06
**Status:** READY FOR CLIENT REVIEW
**Next Action:** Obtain production credentials to verify current regions

---

## Unresolved Questions

1. **What is the actual production Supabase region?** (Need VITE_SUPABASE_URL to determine)
2. **What is the actual Firebase project region?** (Need Firebase Project ID to check Console)
3. **What is the current database size?** (Affects migration time and strategy)
4. **How many active users?** (Affects auth migration complexity)
5. **Is there a preferred maintenance window?** (For minimal user impact during migration)
6. **What is the client's risk tolerance?** (Affects blue-green vs direct migration strategy)

---

**END OF REPORT**
