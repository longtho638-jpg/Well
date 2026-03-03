# WellNexus CISO SOPs — Quy Trinh Bao Mat & An Ninh Thong Tin

> SOPs cho CISO (Chief Information Security Officer) — SECURITY, COMPLIANCE, INCIDENT RESPONSE, DATA PROTECTION.
> Cap nhat: 2026-03-03

---

## MUC LUC

1. [Security Framework](#1-security-framework)
2. [Access Control](#2-access-control)
3. [Application Security](#3-application-security)
4. [Data Protection](#4-data-protection)
5. [Incident Response](#5-incident-response)
6. [Compliance & Audit](#6-compliance--audit)
7. [Security Monitoring](#7-security-monitoring)
8. [KPI Bao Mat](#8-kpi-bao-mat)

---

## 1. SECURITY FRAMEWORK

### 1.1 Security layers

| Layer | Cong cu | Status |
|-------|--------|--------|
| Network | Vercel Edge + Cloudflare | ✅ |
| Application | CSP + HSTS + X-Frame-Options | ✅ |
| Authentication | Supabase Auth (MFA ready) | ✅ |
| Authorization | RLS (Row Level Security) | ✅ |
| Data | Encryption at rest + in transit | ✅ |
| Monitoring | Sentry error tracking | ✅ |
| Code | ESLint security rules + npm audit | ✅ |

### 1.2 Security principles

| Principle | Implementation |
|-----------|---------------|
| Least privilege | RLS policies, role-based access |
| Defense in depth | Multiple security layers |
| Zero trust | Verify every request |
| Fail secure | Error boundaries, safe defaults |
| Audit trail | Audit log for all admin actions |

---

## 2. ACCESS CONTROL

### 2.1 Role matrix

| Role | Admin Panel | Database | Vercel | GitHub | Supabase |
|------|------------|----------|--------|--------|----------|
| CEO | Read | No | View | No | No |
| CTO | Full | Full | Full | Full | Full |
| Dev | No | Read | Deploy | Write | Read |
| Admin | Full | No | No | No | No |
| Partner | Dashboard only | No | No | No | No |
| User | User pages only | No | No | No | No |

### 2.2 Access provisioning

| Buoc | Hanh dong | Ai thuc hien |
|------|-----------|-------------|
| 1 | Request access (email/ticket) | Requester |
| 2 | Approve (manager + CISO) | Manager |
| 3 | Provision account | IT/CTO |
| 4 | Set permissions | CISO |
| 5 | Verify access works | Requester |
| 6 | Log in audit trail | Auto |

### 2.3 Access revocation

| Trigger | SLA | Actions |
|---------|-----|---------|
| Employee offboarding | < 1h | Revoke all access |
| Role change | < 24h | Adjust permissions |
| Security incident | Immediate | Lock account |
| Inactive > 90 days | Review | Disable or delete |

### 2.4 Password policy

| Rule | Yeu cau |
|------|---------|
| Minimum length | 8 characters |
| Complexity | Upper + lower + number |
| Rotation | Khong bat buoc (NIST 2024) |
| MFA | Khuyen khich (TOTP) |
| Storage | bcrypt hash (Supabase Auth) |

---

## 3. APPLICATION SECURITY

### 3.1 Security headers (Vercel)

| Header | Value | Muc dich |
|--------|-------|----------|
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| Content-Security-Policy | Configured | XSS prevention |
| Referrer-Policy | strict-origin | Privacy |

### 3.2 OWASP Top 10 checklist

| # | Vulnerability | Mitigation | Status |
|---|--------------|------------|--------|
| 1 | Injection | Parameterized queries (Supabase) | ✅ |
| 2 | Broken Auth | Supabase Auth + MFA | ✅ |
| 3 | Sensitive Data | HTTPS + encryption | ✅ |
| 4 | XXE | No XML processing | N/A |
| 5 | Broken Access | RLS policies | ✅ |
| 6 | Misconfiguration | Security headers | ✅ |
| 7 | XSS | React auto-escape + DOMPurify | ✅ |
| 8 | Deserialization | No custom deserialization | N/A |
| 9 | Known Vulns | npm audit CI | ✅ |
| 10 | Logging | Sentry + Audit Log | ✅ |

### 3.3 Secure development

| Practice | Enforcement |
|----------|-------------|
| No secrets in code | CI grep check |
| npm audit | Every build |
| Dependency updates | Weekly |
| Code review | Every PR |
| Input validation | Zod schemas |
| Output encoding | React auto-escape |

---

## 4. DATA PROTECTION

### 4.1 Data classification

| Level | Vi du | Xu ly |
|-------|-------|-------|
| Public | Landing page, blog | No restriction |
| Internal | Admin data, reports | Auth required |
| Confidential | User PII, payment | Encrypted, RLS |
| Restricted | API keys, passwords | Secret storage only |

### 4.2 PII handling

| PII Field | Storage | Access | Retention |
|-----------|---------|--------|-----------|
| Email | Supabase Auth | RLS | Account lifetime |
| Phone | Users table | RLS | Account lifetime |
| Address | Orders table | RLS | 5 nam (thue) |
| Payment info | PayOS (not stored) | N/A | Not stored |
| Health data | Users table | RLS | Account lifetime |

### 4.3 Data retention & deletion

| Data | Retention | Deletion method |
|------|-----------|-----------------|
| User accounts | Until delete request | Supabase delete |
| Order history | 5 nam (legal) | Auto-archive |
| Logs | 90 ngay | Auto-purge |
| Analytics | 2 nam | Aggregated only |
| Backups | 30 ngay | Auto-rotate |

### 4.4 PDPA Vietnam compliance

| Yeu cau | Implementation |
|---------|---------------|
| Consent | Signup checkbox + Privacy Policy |
| Right to access | User can view all their data |
| Right to delete | Account deletion available |
| Data minimization | Only collect what's needed |
| Breach notification | Within 72h |

---

## 5. INCIDENT RESPONSE

### 5.1 Severity levels

| Level | Mo ta | Response time | Escalation |
|-------|-------|-------------|------------|
| SEV1 | Data breach, full outage | < 15 min | CISO + CEO + CTO |
| SEV2 | Partial outage, auth bypass | < 1h | CISO + CTO |
| SEV3 | Vulnerability discovered | < 24h | CISO + Dev |
| SEV4 | Minor security issue | < 1 week | Dev team |

### 5.2 Incident response plan

| Phase | Actions |
|-------|---------|
| 1. Detect | Sentry alert, user report, monitoring |
| 2. Contain | Isolate affected systems, revoke access |
| 3. Eradicate | Remove threat, patch vulnerability |
| 4. Recover | Restore services, verify integrity |
| 5. Review | Post-mortem, update procedures |
| 6. Communicate | Notify users if data affected (72h) |

### 5.3 Emergency contacts

| Role | Trach nhiem | Lien lac |
|------|-------------|----------|
| CISO | Lead response | Phone + Email |
| CTO | Technical remediation | Phone + Email |
| CEO | Communication, legal | Phone |
| Legal | Compliance, notification | Email |

### 5.4 Post-incident template

```
=== SECURITY INCIDENT REPORT ===
Date: [YYYY-MM-DD]
Severity: [SEV1-4]
Duration: [start → end]
Impact: [what was affected]
Root cause: [why it happened]
Response: [actions taken]
Prevention: [future measures]
Status: [resolved/monitoring]
```

---

## 6. COMPLIANCE & AUDIT

### 6.1 Security audit schedule

| Audit | Tan suat | Nguoi thuc hien |
|-------|----------|-----------------|
| Code security review | Moi PR | Dev + auto |
| npm audit | Moi build | CI pipeline |
| Access review | Hang quy | CISO |
| Penetration test | Hang nam | External |
| Compliance check | Hang quy | CISO |
| Backup verification | Hang thang | CTO |

### 6.2 Compliance frameworks

| Framework | Applicable | Status |
|-----------|-----------|--------|
| PDPA Vietnam | ✅ | Compliant |
| PCI DSS | Partial (PayOS handles) | N/A |
| OWASP Top 10 | ✅ | Compliant |
| NIST Password | ✅ | Compliant |

---

## 7. SECURITY MONITORING

### 7.1 Monitoring stack

| Tool | Muc dich | Alert |
|------|----------|-------|
| Sentry | Application errors | Email |
| Supabase | Auth logs, DB access | Dashboard |
| GitHub | Code changes, PRs | Email |
| npm audit | Dependency vulns | CI fail |
| Admin Audit Log | Admin actions | In-app |

### 7.2 Alert rules

| Event | Severity | Action |
|-------|----------|--------|
| Failed login > 5/min | High | Block IP, notify |
| New admin added | Medium | Verify with CEO |
| Large data export | Medium | Review purpose |
| API error spike | High | Investigate |
| Dependency vuln (critical) | High | Patch immediately |

---

## 8. KPI BAO MAT

| KPI | Muc tieu |
|-----|----------|
| Security incidents/quy | 0 (SEV1-2) |
| Vulnerability patch time | < 24h (critical) |
| npm audit high vulns | 0 |
| Access review compliance | 100% |
| Backup success rate | 100% |
| MTTR (security) | < 1h (SEV1) |
| Security training | 100% team/nam |
| Phishing test pass | > 90% |
| Data breach | 0 |

---

## PHU LUC

| Tai lieu | File |
|----------|------|
| CTO SOPs | `docs/cto-sops.md` |
| Disaster Recovery | `docs/DISASTER_RECOVERY.md` |
| System Architecture | `docs/system-architecture.md` |
| All SOPs | `docs/*-sops.md` |
