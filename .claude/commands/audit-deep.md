---
description: Perform a deep structural and quality audit of the codebase
agent: codebase_investigator
---

# /audit-deep

## Usage
`/audit-deep`

## Goals
1. **Health Check**: Run standard linters and type checkers.
2. **Structure Check**: Verify that file organization follows the "10x Architecture" (e.g., no logic in UI components, hooks separated).
3. **Dead Code**: Identify unused files and exports.
4. **Security**: Scan for potential secrets or unsafe patterns.

## Workflow
1. **Static Analysis**: Run `npm run lint` and `npx tsc --noEmit`.
2. **Structure Scan**: Agent crawls `src/` to validate architectural patterns.
3. **Report**: Generate a markdown report in `docs/AUDIT_REPORT.md`.

## Example
- `/audit-deep` -> Returns a summary of codebase health.
