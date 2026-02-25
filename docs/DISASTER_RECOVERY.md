# Disaster Recovery Plan - WellNexus 2.0

**Last Updated:** 2026-02-02
**Owner:** DevOps Team
**Review Cycle:** Quarterly (every 3 months)

---

## Executive Summary

This document defines recovery procedures for WellNexus 2.0 in the event of system failures, data loss, or service outages. It establishes Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) for critical systems.

**Quick Stats:**
- **Overall RPO:** 24 hours (Supabase daily backups)
- **Overall RTO:** 4-8 hours (depending on scenario)
- **Critical Data:** PostgreSQL database (users, transactions, orders)
- **Backup Frequency:** Daily automated (Supabase) + Weekly manual recommended

---

## Table of Contents

1. [Service Level Objectives](#service-level-objectives)
2. [Disaster Scenarios](#disaster-scenarios)
3. [Recovery Procedures](#recovery-procedures)
4. [Backup Verification](#backup-verification)
5. [Team Roles & Responsibilities](#team-roles--responsibilities)
6. [Emergency Contacts](#emergency-contacts)
7. [Testing Schedule](#testing-schedule)

---

## Service Level Objectives

### Recovery Point Objective (RPO)

**How much data are we willing to lose?**

| System | RPO | Backup Frequency | Max Data Loss |
|--------|-----|------------------|---------------|
| **Database (PostgreSQL)** | 24 hours | Daily automated | 1 day of transactions |
| **Codebase (Git)** | 0 (real-time) | Every commit | None |
| **Deployments (Vercel)** | 0 (versioned) | Every deploy | None |
| **Edge Functions** | 0 (versioned) | Every deploy | None |
| **User Uploads (Storage)** | 24 hours | Daily automated | 1 day of uploads |

### Recovery Time Objective (RTO)

**How quickly must we recover?**

| System | RTO | Priority | Impact if Down |
|--------|-----|----------|----------------|
| **Frontend (Vercel)** | 1 hour | **CRITICAL** | Users cannot access portal |
| **Database (Supabase)** | 4 hours | **CRITICAL** | Data unavailable, login fails |
| **Edge Functions** | 2 hours | **HIGH** | Background jobs fail |
| **Email Service** | 8 hours | **MEDIUM** | Emails delayed |
| **AI Chat** | 24 hours | **LOW** | AI features unavailable |

---

## Disaster Scenarios

### Scenario 1: Database Corruption/Loss

**Impact:** User data, transactions, orders lost or inaccessible
**Probability:** Low (Supabase managed service)
**RPO:** 24 hours | **RTO:** 4 hours

**Recovery Procedure:**

1. **Assess Damage** (15 minutes)
   ```bash
   # Check Supabase dashboard for error logs
   # Verify database connectivity
   psql $SUPABASE_DB_URL -c "SELECT 1"
   ```

2. **Identify Last Good Backup** (15 minutes)
   - Navigate to Supabase Dashboard > Database > Backups
   - Review backup list (daily backups, 7-day retention)
   - Select most recent backup before corruption

3. **Initiate Restore** (30 minutes)
   - **Via Supabase Dashboard:**
     1. Database → Backups → Select backup
     2. Click "Restore" → Confirm
     3. Wait for restore completion (10-20 minutes)

   - **Via CLI (if dashboard unavailable):**
     ```bash
     # Contact Supabase support for manual restore
     # support@supabase.com
     ```

4. **Verify Data Integrity** (1 hour)
   ```bash
   # Check critical tables
   psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM users"
   psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM transactions"
   psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM orders"

   # Verify latest data timestamp
   psql $SUPABASE_DB_URL -c "SELECT MAX(created_at) FROM transactions"
   ```

5. **Communicate Data Loss** (30 minutes)
   - Notify users of restore completion
   - Inform them of data loss window (last 24 hours)
   - Provide support contact for data recovery requests

6. **Post-Incident Review** (1 hour)
   - Document cause of corruption
   - Implement preventive measures
   - Update DR plan if needed

**Total Time:** ~4 hours

---

### Scenario 2: Vercel Deployment Failure/Outage

**Impact:** Frontend unavailable, users cannot access portal
**Probability:** Very Low (Vercel 99.99% uptime SLA)
**RPO:** 0 (instant rollback) | **RTO:** 1 hour

**Recovery Procedure:**

1. **Check Vercel Status** (5 minutes)
   - Visit: https://www.vercel-status.com
   - Check for ongoing incidents

2. **Rollback to Previous Deployment** (10 minutes)
   ```bash
   # Via Vercel Dashboard
   # Deployments → Select last working deployment → "Promote to Production"

   # Or via CLI
   vercel rollback
   ```

3. **Alternative: Deploy to Secondary Platform** (30 minutes)
   ```bash
   # Deploy to Netlify (backup CDN)
   netlify deploy --prod --dir=dist

   # Or Cloudflare Pages
   wrangler pages deploy dist --project-name=wellnexus
   ```

4. **Update DNS (if needed)** (15 minutes)
   - If switching providers, update DNS A/CNAME records
   - TTL: 300 seconds (5 minutes propagation)

5. **Verify Deployment** (5 minutes)
   ```bash
   curl -I https://wellnexus.vn
   # Check HTTP 200 status
   # Verify CSP headers present
   ```

**Total Time:** ~1 hour (rollback) or ~2 hours (alternative platform)

---

### Scenario 3: Supabase Service Outage

**Impact:** Database, Auth, Edge Functions unavailable
**Probability:** Very Low (Supabase 99.9% uptime SLA)
**RPO:** N/A (waiting for service) | **RTO:** 4-8 hours (manual failover)

**Recovery Procedure:**

**Option 1: Wait for Supabase Resolution** (fastest)
1. Check Supabase status: https://status.supabase.com
2. Monitor estimated recovery time
3. Communicate outage to users
4. Wait for service restoration

**Option 2: Failover to Backup Database** (complex, requires pre-setup)
1. Restore latest backup to alternative PostgreSQL provider (PlanetScale, Neon, AWS RDS)
2. Update connection strings in Vercel environment variables
3. Redeploy frontend with new database URL
4. **Note:** This requires pre-configured backup infrastructure (not currently implemented)

**Recommended Action:**
- For MVP stage: Wait for Supabase restoration
- For production scale: Implement multi-region read replicas

---

### Scenario 4: GitHub Repository Compromise

**Impact:** Code repository access lost or compromised
**Probability:** Very Low (with 2FA enabled)
**RPO:** 0 (local clones exist) | **RTO:** 2 hours

**Recovery Procedure:**

1. **Secure Account** (30 minutes)
   - Reset GitHub password immediately
   - Enable/verify 2FA
   - Revoke all personal access tokens
   - Review organization members

2. **Restore from Local Clone** (1 hour)
   ```bash
   # If repo deleted: Create new repo
   gh repo create wellnexus-vn/wellnexus-mvp --private

   # Push from local clone
   cd /path/to/local/wellnexus
   git remote set-url origin git@github.com:wellnexus-vn/wellnexus-mvp.git
   git push --all origin
   git push --tags origin
   ```

3. **Verify Code Integrity** (30 minutes)
   - Compare commit history
   - Verify no malicious commits
   - Run security scan

4. **Update Deployment Hooks** (15 minutes)
   - Reconnect Vercel to new repo
   - Update CI/CD workflows

**Total Time:** ~2 hours

---

### Scenario 5: Accidental Data Deletion

**Impact:** Critical user data deleted by admin or bug
**Probability:** Medium (human error)
**RPO:** 24 hours | **RTO:** 2 hours

**Recovery Procedure:**

1. **Stop Further Deletions** (5 minutes)
   - Identify deletion source (admin action, bug)
   - Disable admin access or deploy hotfix immediately

2. **Assess Scope** (15 minutes)
   ```sql
   -- Check what was deleted (if soft-delete implemented)
   SELECT * FROM users WHERE deleted_at IS NOT NULL AND deleted_at > NOW() - INTERVAL '1 hour';

   -- Check transaction logs
   SELECT * FROM audit_logs WHERE action = 'DELETE' AND created_at > NOW() - INTERVAL '1 hour';
   ```

3. **Selective Restore** (1 hour)
   ```bash
   # Restore full database to staging environment
   # Export specific deleted records
   pg_dump -t users --data-only staging_db > deleted_users.sql

   # Import to production
   psql $SUPABASE_DB_URL < deleted_users.sql
   ```

4. **Verify Restoration** (30 minutes)
   - Check restored record counts
   - Verify data integrity
   - Test user logins

**Total Time:** ~2 hours

---

## Backup Verification

### Monthly Verification Checklist

**Every 1st of the month:**

- [ ] **Database Backup Test** (30 minutes)
  ```bash
  # Restore latest backup to staging environment
  # Verify data completeness
  # Test critical queries
  ```

- [ ] **Environment Variables Backup** (10 minutes)
  ```bash
  # Export Vercel env vars
  vercel env pull .env.production

  # Store securely in password manager (1Password, Bitwarden)
  ```

- [ ] **Code Repository Health** (10 minutes)
  ```bash
  # Verify branch protection rules
  gh api repos/wellnexus-vn/wellnexus-mvp/branches/main/protection

  # Check backup remotes (if configured)
  git remote -v
  ```

### Quarterly Verification (Full DR Drill)

**Every 3 months:**

- [ ] **Full Database Restore Drill** (2 hours)
  1. Restore backup to isolated environment
  2. Verify all tables and data
  3. Test application against restored database
  4. Document restore time

- [ ] **Deployment Failover Test** (1 hour)
  1. Deploy to secondary platform (Netlify/Cloudflare)
  2. Test full application functionality
  3. Verify performance metrics

- [ ] **Update DR Documentation** (30 minutes)
  - Review all procedures
  - Update contact information
  - Incorporate lessons learned

---

## Team Roles & Responsibilities

### During Disaster Recovery

| Role | Name | Primary Responsibility |
|------|------|----------------------|
| **Incident Commander** | TBD | Overall coordination, decision-making |
| **Database Lead** | TBD | Database restore, data verification |
| **DevOps Lead** | TBD | Infrastructure recovery, deployment |
| **Communications Lead** | TBD | User notifications, stakeholder updates |
| **Security Lead** | TBD | Assess security implications, containment |

### Escalation Path

```
L1: On-Call Engineer
  ↓ (if unresolved in 30 min)
L2: Senior DevOps Engineer
  ↓ (if unresolved in 1 hour)
L3: CTO / Technical Director
  ↓ (if business impact critical)
L4: CEO / Incident Commander
```

---

## Emergency Contacts

### Service Providers

| Provider | Type | Support Contact | SLA |
|----------|------|----------------|-----|
| **Supabase** | Database + Functions | support@supabase.com | 24h (Pro plan) |
| **Vercel** | Frontend Hosting | support@vercel.com | 1h (Pro plan) |
| **Resend** | Email Service | support@resend.com | 24h (email) |
| **GitHub** | Code Repository | support@github.com | Varies |

### Internal Team

- **DevOps Team:** devops@wellnexus.vn
- **Security Team:** security@wellnexus.vn
- **Management:** management@wellnexus.vn

---

## Testing Schedule

| Test Type | Frequency | Next Due | Owner |
|-----------|-----------|----------|-------|
| **Database Restore** | Monthly | 2026-03-01 | DB Lead |
| **Deployment Rollback** | Monthly | 2026-03-01 | DevOps |
| **Full DR Drill** | Quarterly | 2026-05-01 | Incident Cmdr |
| **Communication Test** | Quarterly | 2026-05-01 | Comms Lead |
| **Security Incident** | Annually | 2026-12-01 | Security Lead |

---

## Post-Incident Procedures

After any disaster recovery event:

1. **Incident Report** (within 24 hours)
   - Timeline of events
   - Root cause analysis
   - Data loss assessment
   - Recovery steps taken

2. **Lessons Learned Meeting** (within 3 days)
   - What went well
   - What could improve
   - Action items for prevention

3. **Update DR Plan** (within 1 week)
   - Incorporate new findings
   - Update recovery procedures
   - Revise RTO/RPO if needed

4. **User Communication** (within 24 hours)
   - Transparency about incident
   - Explanation of impact
   - Steps taken to prevent recurrence

---

## Appendix

### A. Backup Commands Reference

```bash
# Manual database backup
pg_dump $SUPABASE_DB_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to Cloudflare R2 (if configured)
rclone copy backup-*.sql.gz r2:wellnexus-backups/

# List available backups
rclone ls r2:wellnexus-backups/

# Restore from backup
gunzip < backup-20260202.sql.gz | psql $SUPABASE_DB_URL
```

### B. Monitoring Alerts Setup

**Sentry Alert Rules:**
- Error rate > 1% of requests
- New error types detected
- Performance degradation (P95 > 1s)

**Uptime Monitoring:**
- Use UptimeRobot or Pingdom
- Check wellnexus.vn every 5 minutes
- Alert via email + Slack on downtime

### C. Critical Data Tables

```sql
-- Priority 1 (CRITICAL - financial data)
users (user accounts, balances)
transactions (payment records)
orders (purchase history)

-- Priority 2 (HIGH - business data)
products (catalog)
team_members (MLM network structure)
policy_config (business rules)

-- Priority 3 (MEDIUM - feature data)
rank_upgrades (achievement history)
notifications (user alerts)
```

---

**Document Version:** 1.0
**Approval:** Pending
**Next Review:** 2026-05-02
