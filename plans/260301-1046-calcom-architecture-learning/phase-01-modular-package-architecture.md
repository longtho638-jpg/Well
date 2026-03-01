# Phase 1: Modular Package Architecture

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: Cal.com's Turborepo monorepo with 50+ packages
- Docs: [system-architecture.md](../../docs/system-architecture.md), [code-standards.md](../../docs/code-standards.md)

## Overview
- **Date:** 2026-03-01
- **Priority:** P1 — Foundation for all other phases
- **Implementation:** pending
- **Review:** pending

Restructure src/ into clear module boundaries inspired by Cal.com's `packages/` pattern. Not a monorepo migration — just applying package-thinking to organize code.

## Key Insights

Cal.com organizes 50+ packages by domain: `@calcom/features/bookings`, `@calcom/prisma`, `@calcom/lib`, `@calcom/types`. Each has clear exports, own tsconfig. Turborepo caches builds per package.

**Applied to Well:** src/ currently flat. Reorganize into domain modules with barrel exports. Each module = self-contained unit with types, components, services, hooks.

## Requirements
- Zero behavior change — pure refactor
- All 254 tests continue passing
- Build time unchanged or improved
- Import paths use `@/modules/*` alias

## Architecture

```
src/
├── modules/
│   ├── auth/           # Login, signup, forgot-password, token management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts    # Barrel export
│   ├── dashboard/      # Stats, commission widget, hero card
│   ├── marketplace/    # Product catalog, quick purchase, checkout
│   ├── network/        # Team tree, downline visualization
│   ├── wallet/         # Withdrawal, bank management, history
│   ├── agents/         # Agent registry, copilot, coach (→ Phase 3)
│   └── settings/       # Profile, preferences, language
├── shared/
│   ├── ui/             # Reusable components (→ Phase 5)
│   ├── hooks/          # Shared hooks (useAuth, useI18n)
│   ├── services/       # Base service layer (→ Phase 2)
│   ├── types/          # Global types (User, Product, Order)
│   └── utils/          # Utilities (validation, formatting)
├── store.ts            # Zustand root store
└── App.tsx
```

## Related Code Files
- `src/components/` → split into `modules/*/components/`
- `src/pages/` → keep as route entry points, import from modules
- `src/services/` → split into `modules/*/services/` + `shared/services/`
- `src/types.ts` → split into `modules/*/types.ts` + `shared/types/`

## Implementation Steps
1. Create `src/modules/` directory structure with barrel exports
2. Move auth-related components/hooks/services into `modules/auth/`
3. Move dashboard components into `modules/dashboard/`
4. Move marketplace components into `modules/marketplace/`
5. Move network/wallet/settings into respective modules
6. Extract shared UI, hooks, utils into `src/shared/`
7. Update all import paths to use `@/modules/*` and `@/shared/*`
8. Add path aliases to vite.config.ts and tsconfig.json
9. Verify all tests pass, build succeeds

## Todo
- [ ] Create module directory structure
- [ ] Migrate auth module (components + services + types)
- [ ] Migrate dashboard module
- [ ] Migrate marketplace module
- [ ] Migrate network, wallet, settings modules
- [ ] Extract shared layer
- [ ] Update imports across codebase
- [ ] Configure path aliases
- [ ] Run tests + build verification

## Success Criteria
- `npm run build` — 0 errors
- `npm test` — 254/254 pass
- Each module has barrel export (index.ts)
- No circular dependencies between modules
- `grep -r "src/components" src/pages/` = 0 (all use module imports)

## Risk Assessment
- **Medium:** Large refactor touching many files — use IDE rename tools
- **Low:** Circular dependency risk — enforce unidirectional: modules → shared, never shared → modules

## Security Considerations
- No security impact — pure structural refactor
- Auth module encapsulation actually improves security boundary

## Next Steps
- Phase 2 depends on `shared/services/` structure created here
- Phase 5 depends on `shared/ui/` structure created here
