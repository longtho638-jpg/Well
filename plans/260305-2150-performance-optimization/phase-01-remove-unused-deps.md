---
title: "Phase 1: Remove Unused Dependencies"
status: pending
priority: P2
effort: 15min
---

# Phase 1: Remove Unused Dependencies

## Context
- Build time: ~15s with EPIPE errors
- Unused production deps detected
- Unused dev deps detected

## Unused Packages

### Production Dependencies (remove)
```
clsx
i18next-http-backend
react-scroll
tailwind-merge
```

### Dev Dependencies (remove)
```
tailwindcss
rollup
ts-node
sharp-cli
```

**Total: 8 packages**

## Implementation Steps

1. **Verify packages are unused**
   ```bash
   grep -r "from 'clsx'" src/
   grep -r "from 'tailwind-merge'" src/
   grep -r "react-scroll" src/
   ```

2. **Remove packages**
   ```bash
   pnpm remove clsx i18next-http-backend react-scroll tailwind-merge
   pnpm remove -D tailwindcss rollup ts-node sharp-cli
   ```

3. **Clean node_modules**
   ```bash
   rm -rf node_modules .pnpm-store
   pnpm install
   ```

4. **Verify build**
   ```bash
   time pnpm build
   ```

## Success Criteria
- [ ] Build passes without errors
- [ ] No EPIPE errors
- [ ] Build time reduced
- [ ] All routes render correctly

## Files to Check
- `package.json` - remove deps
- `pnpm-lock.yaml` - auto-updated
