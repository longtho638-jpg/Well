# lint-staged Configuration

## Overview

This document describes the lint-staged configuration and pre-commit hook behavior for the WellNexus project.

## Behavior

### Empty Staging Handling

When no files are staged for commit, the pre-commit hook will:
1. Detect empty staging area
2. Print: "No files staged for commit — skipping lint-staged"
3. Exit with code **0** (success)

This prevents errors when running `git commit` without staged files.

### Pre-commit Hook Flow

```
┌─────────────────────────────────┐
│   git commit initiated          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Check for staged files          │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐     ┌──────────────┐
│ Empty   │     │ Files staged │
│ staging │     │ detected     │
└────┬────┘     └──────┬───────┘
     │                 │
     ▼                 ▼
┌─────────┐     ┌──────────────┐
│ Print   │     │ Check i18n   │
│ message │     │ changes      │
│ exit 0  │     └──────┬───────┘
└─────────┘            │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        ┌───────────┐   ┌──────────────┐
        │ Run i18n  │   │ Skip i18n    │
        │ validation│   │ validation   │
        └─────┬─────┘   └──────┬───────┘
              │                 │
              └────────┬────────┘
                       │
                       ▼
              ┌────────────────┐
              │ Run lint-staged│
              │ (eslint)       │
              └────────────────┘
```

## Configuration Files

### .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate i18n keys only when locale files are staged
LOCALE_CHANGED=$(git diff --cached --name-only | grep 'src/locales/' | head -1)
if [ -n "$LOCALE_CHANGED" ]; then
  echo "Locale files changed — validating i18n keys..."
  node scripts/validate-i18n-keys.mjs
fi

# Check if any files are staged
STAGED_FILES=$(git diff --cached --name-only)
if [ -z "$STAGED_FILES" ]; then
  echo "No files staged for commit — skipping lint-staged"
  exit 0
fi

npx --no-workspaces lint-staged
```

### package.json (lint-staged section)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings=0 --no-warn-ignored"
    ]
  }
}
```

## Linting Rules

### TypeScript/TSX Files

- **eslint**: Runs with `--fix` to auto-fix issues
- **--max-warnings=0**: Fails on any warnings
- **--no-warn-ignored**: Suppresses warnings for ignored files

## Testing

Tests are located in `tests/lint-staged.test.ts`.

Run tests:
```bash
pnpm vitest run tests/lint-staged.test.ts
```

### Test Coverage

1. **Empty staging test**: Verifies exit code 0 when no files staged
2. **Hook content test**: Verifies empty staging check exists in hook
3. **Config presence test**: Verifies lint-staged config in package.json
4. **Flag test**: Verifies eslint uses `--no-warn-ignored` flag

## Troubleshooting

### "lint-staged could not find any staged files"

This message appears when running `lint-staged` directly with no staged files. The pre-commit hook handles this gracefully.

### i18n validation fails

If locale files are staged and validation fails:
```bash
# Fix missing translation keys
pnpm i18n:sync

# Validate keys
pnpm i18n:validate
```

### ESLint errors on commit

```bash
# Run lint manually to see errors
pnpm lint

# Auto-fix where possible
pnpm lint --fix
```

## Related Scripts

| Script | Command |
|--------|---------|
| Lint | `pnpm lint` |
| i18n validate | `pnpm i18n:validate` |
| i18n sync | `pnpm i18n:sync` |
| Test lint-staged | `pnpm vitest run tests/lint-staged.test.ts` |
