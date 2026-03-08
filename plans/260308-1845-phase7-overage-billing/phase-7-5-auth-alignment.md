---
title: "Phase 7.5: JWT/API Key Auth Alignment"
description: "Extract tenant context from JWT claims and support mk_ API key authentication"
status: pending
priority: P1
effort: 1.5h
---

# Phase 7.5: JWT/API Key Auth Alignment

## Context Links

- Related: `src/middleware/tenant-context.ts` - Tenant context extraction
- Related: `src/lib/rbac-engine.ts` - RBAC with tenant claims
- Related: `src/lib/license-compliance-client.ts` - License validation

## Overview

Align authentication with overage billing by extracting tenant context from JWT claims and supporting mk_ API key authentication with rate limiting.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│  Request                                                │
│    ↓                                                    │
│  Extract Auth (JWT or API Key)                         │
│    ↓                                                    │
│  Validate Credentials                                   │
│    ↓                                                    │
│  Extract Tenant Context                                 │
│    ↓                                                    │
│  Apply Tenant-Specific Rate Limits                      │
│    ↓                                                    │
│  Check Quota + Overage                                  │
└─────────────────────────────────────────────────────────┘
```

## Requirements

### Functional
1. Extract tenant_id from JWT claims
2. Support mk_ API key authentication
3. Resolve API key to tenant context
4. Apply tenant-specific rate limits
5. Handle missing tenant context gracefully

### JWT Claims Structure
```typescript
interface TenantJwtClaims {
  sub: string          // User ID
  tenant_id: string    // Organization/Tenant ID
  license_tier: string // basic|premium|enterprise|master
  policy_id?: string   // Custom policy ID
  exp: number          // Expiration
}
```

### API Key Format
```
mk_tenant_<id>_<secret>
Example: mk_tenant_abc123_xxxxxxxxxxxx
```

## Implementation Steps

1. Add API key table with tenant mapping
2. Create `extractTenantFromApiKey()` function
3. Update tenant-context middleware for dual auth
4. Add API key rate limiting with tenant overrides
5. Create API key rotation mechanism

## Todo List

- [ ] Create API keys table
- [ ] Implement API key extraction
- [ ] Update tenant context middleware
- [ ] Add API key rate limiting
- [ ] Write authentication tests

## Success Criteria

1. JWT tenant extraction works
2. API key auth resolves to tenant
3. Rate limits applied per tenant
