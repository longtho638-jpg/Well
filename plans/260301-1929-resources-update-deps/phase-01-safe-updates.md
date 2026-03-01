# Phase 1: Safe Updates (Patch/Minor)

## Context Links
- [Parent Plan](./plan.md)
- [package.json](../../package.json)

## Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Description:** Update packages within semver-safe range + lucide-react minor bump
- **Implementation Status:** pending
- **Review Status:** pending

## Key Insights
- All deps use `^` prefix — pnpm should already resolve latest minor/patch
- `lucide-react` 0.563→0.575 is only non-major outdated dep
- pnpm workspace lockfile at monorepo root — changes affect `pnpm-lock.yaml`

## Requirements
- Update lucide-react to ^0.575.0
- Run `pnpm install` to refresh lockfile
- No breaking changes allowed

## Related Code Files
- `package.json` — bump lucide-react version
- `/Users/macbookprom1/mekong-cli/pnpm-lock.yaml` — auto-updated by pnpm

## Implementation Steps
1. Update `package.json`: `lucide-react` → `^0.575.0`
2. Run `pnpm install` from monorepo root
3. Run `pnpm build` to verify no icon API changes broke anything
4. Check for any removed/renamed icons in changelog

## Todo
- [ ] Bump lucide-react in package.json
- [ ] pnpm install
- [ ] Build passes

## Success Criteria
- `pnpm build` exits 0
- No icon import errors

## Risk Assessment
- LOW — lucide-react minor bumps rarely break (icon additions only)
- Mitigation: build verify catches any removed icon names

## Next Steps
- Proceed to Phase 2
