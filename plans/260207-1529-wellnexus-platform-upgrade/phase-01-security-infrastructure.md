# Phase 1: Security & Infrastructure Hardening

## Context Links
- [Plan Overview](./plan.md)
- [System Architecture](../../docs/system-architecture.md)
- [Code Standards](../../docs/code-standards.md)
- [Current vercel.json](../../vercel.json)

## Overview

**Priority:** P1 Critical
**Status:** ⏳ Pending
**Effort:** 5 hours
**Dependencies:** None (Foundation phase)

Foundation security and infrastructure hardening to ensure enterprise-grade protection before any feature work.

## Key Insights

1. **Current CSP Missing PayOS**: CSP header doesn't include PayOS domains, will block payment integration
2. **Security Headers Baseline**: HSTS, X-Frame-Options, X-Content-Type-Options already present
3. **RLS Gaps**: Some sensitive tables (transactions, team_members) may lack comprehensive RLS
4. **Admin Auth**: Protected routes exist but need role-based middleware strengthening

## Requirements

### Functional Requirements
- FR1: CSP must allow PayOS API domains (api.payos.vn, my.payos.vn)
- FR2: All security headers must meet OWASP recommendations
- FR3: RLS policies must enforce row-level isolation for multi-tenant data
- FR4: Admin routes must verify role='admin' before rendering
- FR5: SSL/TLS configuration must achieve SSL Labs A+ rating

### Non-Functional Requirements
- NFR1: Zero performance degradation from security headers
- NFR2: Automated verification for security header compliance
- NFR3: RLS policies must not break existing user flows
- NFR4: Changes must be backward compatible with existing sessions

## Architecture

### Security Headers Flow
```
Client Request → Vercel Edge → vercel.json headers[] → Response with CSP/HSTS/etc.
```

### RLS Policy Architecture
```
User Request → Supabase Client → RLS Policy Check → Database Query
                                        ↓
                               auth.uid() = user_id
```

### Admin Route Protection
```
Route Access → useAuth() hook → Check role === 'admin' → Render/Redirect
```

## Related Code Files

### Files to Modify
- `vercel.json` - Add PayOS domains to CSP, audit all headers
- `supabase/migrations/` - Add/update RLS policies (new migration file)
- `src/hooks/useAuth.ts` - Strengthen admin role verification
- `src/components/ProtectedRoute.tsx` - Add role-based guards
- `src/pages/Admin*.tsx` - Add auth guards to all admin pages

### Files to Create
- `scripts/verify-security-headers.ts` - Automated header validation script
- `supabase/migrations/20260207_add_comprehensive_rls.sql` - RLS policies
- `src/middleware/admin-auth-guard.tsx` - Reusable admin auth component

## Implementation Steps

### Step 1: Update CSP Headers (1h)

1. **Update vercel.json CSP**:
   ```typescript
   // Add to connect-src in vercel.json line 18:
   connect-src 'self'
     https://*.supabase.co
     wss://*.supabase.co
     https://api.payos.vn          // NEW
     https://my.payos.vn            // NEW
     https://pay.payos.vn           // NEW
     [... existing domains ...]
   ```

2. **Verify CSP syntax**:
   ```bash
   # Use CSP validator
   npx csp-evaluator --file vercel.json
   ```

3. **Test payment flow**:
   ```bash
   # After deployment, test PayOS integration
   npm run test:integration -- payos
   ```

### Step 2: Audit Security Headers (1h)

1. **Create automated verification script**:
   ```typescript
   // scripts/verify-security-headers.ts
   const requiredHeaders = {
     'Content-Security-Policy': /default-src.*connect-src.*payos/,
     'Strict-Transport-Security': /max-age=31536000.*includeSubDomains/,
     'X-Frame-Options': /DENY/,
     'X-Content-Type-Options': /nosniff/,
     'Referrer-Policy': /strict-origin/,
   };
   ```

2. **Run verification**:
   ```bash
   tsx scripts/verify-security-headers.ts
   # Must exit 0 for CI/CD
   ```

3. **Add to GitHub Actions**:
   ```yaml
   # .github/workflows/ci.yml
   - name: Verify Security Headers
     run: npm run verify:security
   ```

### Step 3: Implement Comprehensive RLS (2h)

1. **Create migration file**:
   ```sql
   -- supabase/migrations/20260207_add_comprehensive_rls.sql

   -- Users table: Users can only read/update their own record
   CREATE POLICY "Users can view own profile"
     ON users FOR SELECT
     USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile"
     ON users FOR UPDATE
     USING (auth.uid() = id);

   -- Transactions: Users can only see their own transactions
   CREATE POLICY "Users view own transactions"
     ON transactions FOR SELECT
     USING (auth.uid() = user_id);

   -- Team members: Users can view their network
   CREATE POLICY "Users view own team network"
     ON team_members FOR SELECT
     USING (
       auth.uid() = user_id OR
       auth.uid() = sponsor_id
     );

   -- Admin override: Admins can view all
   CREATE POLICY "Admins view all users"
     ON users FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM users
         WHERE id = auth.uid()
         AND role = 'admin'
       )
     );
   ```

2. **Apply migration**:
   ```bash
   npx supabase db push
   ```

3. **Verify RLS with tests**:
   ```typescript
   // src/__tests__/rls-policies.test.ts
   test('User cannot access other user data', async () => {
     // Test isolation
   });
   ```

### Step 4: Strengthen Admin Auth Guards (1h)

1. **Create admin guard middleware**:
   ```typescript
   // src/middleware/admin-auth-guard.tsx
   export const AdminAuthGuard: React.FC<PropsWithChildren> = ({ children }) => {
     const { user } = useAuth();

     if (!user) {
       return <Navigate to="/login" />;
     }

     if (user.role !== 'admin') {
       return <Navigate to="/dashboard" />;
     }

     return <>{children}</>;
   };
   ```

2. **Apply to all admin routes**:
   ```typescript
   // src/App.tsx
   <Route path="/admin/*" element={
     <AdminAuthGuard>
       <AdminLayout />
     </AdminAuthGuard>
   } />
   ```

3. **Add role check to useAuth hook**:
   ```typescript
   // src/hooks/useAuth.ts
   export const useAuth = () => {
     // ...
     const isAdmin = user?.role === 'admin';
     return { user, isAdmin, /* ... */ };
   };
   ```

## Todo List

- [ ] Update vercel.json with PayOS CSP domains
- [ ] Create verify-security-headers.ts script
- [ ] Run CSP validator and fix any issues
- [ ] Create RLS migration file (20260207_add_comprehensive_rls.sql)
- [ ] Apply RLS migration to Supabase
- [ ] Write RLS policy tests
- [ ] Create AdminAuthGuard component
- [ ] Apply AdminAuthGuard to all admin routes
- [ ] Update useAuth hook with isAdmin flag
- [ ] Run automated security header verification
- [ ] Test admin route protection manually
- [ ] Test RLS policies with different user roles
- [ ] Verify build passes: `npm run build`
- [ ] Verify tests pass: `npm run test:run`
- [ ] Deploy to preview and test payment flow
- [ ] Document security changes in SECURITY.md

## Success Criteria

### Automated Verification
```bash
# All must pass:
npm run build                    # 0 TypeScript errors
npm run test:run                 # 100% pass rate
npm run verify:security          # Security headers validated
npm run test:integration -- rls  # RLS policies verified
```

### Manual Verification
- [ ] PayOS payment flow works in preview deployment
- [ ] Admin routes redirect non-admin users
- [ ] SSL Labs scan shows A+ rating
- [ ] Non-admin users cannot access admin API endpoints
- [ ] RLS prevents cross-user data access

### Security Checklist
- [ ] CSP includes all required PayOS domains
- [ ] HSTS max-age >= 31536000 (1 year)
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] RLS enabled on: users, transactions, team_members, agent_logs
- [ ] Admin role verified on all admin routes

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CSP blocks PayOS API | High | Medium | Test payment flow immediately after deploy |
| RLS breaks user queries | High | Low | Comprehensive test suite before migration |
| Admin guard blocks legitimate admins | Medium | Low | Role assignment verification script |
| Performance degradation from RLS | Low | Low | Benchmark queries before/after |

## Security Considerations

### CSP Configuration
- **Principle**: Allowlist only required domains
- **Verification**: Test all external API calls post-deployment
- **Rollback**: Remove PayOS domains from CSP if payment flow breaks

### RLS Policies
- **Principle**: Deny by default, explicit allow policies
- **Testing**: Every policy must have corresponding test
- **Admin Override**: Separate admin policies, don't weaken user policies

### Admin Authentication
- **Principle**: Defense in depth (frontend + backend checks)
- **Token Security**: Verify JWT contains admin role claim
- **Audit Trail**: Log all admin route access attempts

## Next Steps

After Phase 1 completion:

1. **Proceed to Phase 2**: PayOS Integration Hardening
2. **Update Dependencies**: Phase 2 depends on CSP updates from this phase
3. **Documentation**: Update security documentation with new policies
4. **Monitoring**: Set up alerts for CSP violations and admin access attempts

---

**Phase Effort:** 5 hours
**Critical Path:** Yes (blocks Phase 2)
**Automation Level:** High (70% automated verification)
