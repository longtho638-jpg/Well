---
description: Code phase - Implementation, testing, and quality assurance
---

# /code Workflow

## Overview
This workflow phase focuses on implementing features, writing tests, and ensuring code quality.

## Steps

### 1. Implementation
// turbo
```bash
# Run dev server for testing
npm run dev
```

### 2. Type Safety Check
// turbo
```bash
# Verify TypeScript compilation
npx tsc --noEmit
```

### 3. Run Tests
// turbo
```bash
# Run test suite
npm run test:run
```

### 4. Code Review
Use `/code-review` command from `.claude/commands/code-review.md`:
- Check for type safety violations
- Verify component patterns
- Ensure test coverage

### 5. Validate & Fix
Use `/validate-and-fix` command:
- Auto-fix linting issues
- Resolve TypeScript errors
- Clean up imports

### 6. Performance Optimization
- Optimize React renders (memo, useMemo, useCallback)
- Verify Database query efficiency (indexes, policies)

### 7. Quality Agents
- `@code-review-expert` for comprehensive review
- `@vitest-testing-expert` for test coverage
- `@typescript-expert` for type hardening
- `@react-performance-expert` for render optimization
- `@database-postgres-expert` for schema/query checks

## Exit Criteria
- [ ] Feature implemented
- [ ] Tests passing (230+)
- [ ] No TypeScript errors
- [ ] Code review approved
- [ ] Performance check passed
- [ ] Ready for `/ship` phase

## Related Commands
- `.claude/commands/code-review.md`
- `.claude/commands/validate-and-fix.md`
- `.claude/agents/testing/vitest-testing-expert.md`
