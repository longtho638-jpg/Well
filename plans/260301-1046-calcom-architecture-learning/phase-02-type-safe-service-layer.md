# Phase 2: Type-Safe Service Layer

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-modular-package-architecture.md)
- Inspired by: Cal.com's tRPC routers with Zod validation, middleware chain
- Docs: [code-standards.md](../../docs/code-standards.md)

## Overview
- **Date:** 2026-03-01
- **Priority:** P1 — Core infrastructure
- **Implementation:** pending
- **Review:** pending

Apply Cal.com's tRPC router pattern to Well's Supabase service layer. Create type-safe service interfaces with Zod validation, middleware chain, and domain-grouped procedures.

## Key Insights

Cal.com uses tRPC with merged routers per domain (`viewer.bookings.get`, `viewer.teams.list`). Each procedure has Zod input schema, middleware for auth/rate-limit, and typed output. Context injection provides user, prisma, session.

**Applied to Well:** Create service layer with Zod-validated inputs, typed responses, middleware pattern for auth/error-handling. Group services by domain matching module structure.

## Requirements
- All Supabase calls go through typed service layer
- Zod validation on every service input
- Consistent error response format
- Middleware pattern for cross-cutting concerns

## Architecture

```typescript
// shared/services/base-service.ts — inspired by tRPC procedure
interface ServiceContext {
  user: User | null;
  supabase: SupabaseClient;
  locale: 'vi' | 'en';
}

interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

// modules/marketplace/services/product-service.ts
const getProducts = createService({
  input: z.object({ category: z.string().optional(), page: z.number().default(1) }),
  middleware: [withAuth, withRateLimit],
  handler: async (ctx, input) => { /* ... */ }
});

// modules/dashboard/services/commission-service.ts
const getCommissions = createService({
  input: z.object({ period: z.enum(['today', '7d', '30d']) }),
  middleware: [withAuth],
  handler: async (ctx, input) => { /* ... */ }
});
```

## Related Code Files
- `src/services/` → current flat service files
- `src/store.ts` → Zustand actions calling services
- `src/shared/services/base-service.ts` → NEW: base service factory
- `src/modules/*/services/` → domain-specific services

## Implementation Steps
1. Create `shared/services/base-service.ts` with `createService()` factory
2. Define `ServiceContext`, `ServiceResult<T>`, `ServiceError` types
3. Create middleware utilities: `withAuth`, `withErrorHandling`, `withLogging`
4. Migrate `marketplace` services to typed service pattern with Zod inputs
5. Migrate `dashboard/commission` services
6. Migrate `auth` services (login, signup, reset-password)
7. Migrate `wallet` services (withdrawal, bank accounts)
8. Migrate `network` services (team tree, downline)
9. Update Zustand store actions to use new typed services
10. Remove old untyped service files

## Todo
- [ ] Create base service factory with createService()
- [ ] Define ServiceContext, ServiceResult, ServiceError
- [ ] Implement withAuth, withErrorHandling middleware
- [ ] Migrate marketplace services
- [ ] Migrate dashboard services
- [ ] Migrate auth services
- [ ] Migrate wallet + network services
- [ ] Update store actions
- [ ] Verify type safety (tsc --noEmit)
- [ ] Run tests

## Success Criteria
- `tsc --noEmit` — 0 errors
- All API calls use Zod-validated input
- Consistent error handling across all services
- `grep -r "supabase\." src/modules/` only in service files (not components)

## Risk Assessment
- **Medium:** Large service migration — do module by module
- **Low:** Zod adds runtime validation overhead — negligible for SaaS

## Security Considerations
- Zod validation prevents injection attacks at service boundary
- withAuth middleware ensures no unauthenticated service calls
- Error responses never leak stack traces or internal details

## Next Steps
- Phase 3 (Agent Registry) uses this service pattern for agent APIs
- Phase 4 (Workflow Engine) triggers through service layer
