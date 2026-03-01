# Google/zx Architecture Research

## 1. Tagged Template Shell Execution
**Problem:** Shell scripts in Bash are fragile (no types, poor error handling, unquoted vars).
**Solution:** Template literals for shell commands: `` await $`git status` ``. Escaping handled automatically. Returns ProcessOutput with stdout, stderr, exitCode. Async/await for sequential commands.
**Key decisions:** Template tags = safe interpolation (auto-escaping prevents injection). ProcessOutput is typed. Pipe support: `$\`cmd1\`.pipe($\`cmd2\`)`. Environment variable access via `process.env`.
**Well lesson:** Build automation scripts in TypeScript instead of bash. CI/CD helpers, database migration runners, deployment scripts — all type-safe. Auto-escape user inputs in any shell operations.

## 2. Built-in Utilities (fetch, fs, glob, YAML)
**Problem:** Node.js scripts require importing many packages for basic operations.
**Solution:** zx re-exports common utilities: `fetch` (HTTP), `fs` (file system), `path`, `os`, `chalk` (colors), `minimist` (CLI args), `glob` (file matching), `YAML`/`CSV` parsers. Zero-config imports.
**Key decisions:** "Batteries included" — one import gives everything. Same APIs developers already know. No wrapper abstraction — direct access to native APIs.
**Well lesson:** Create a shared utilities module for Well scripts — build scripts, seed scripts, migration helpers. Bundle common imports. DX improvement for developer productivity.

## 3. Error Handling & Process Management
**Problem:** Shell command errors silently swallowed. Process cleanup on failure missing.
**Solution:** Failed commands throw ProcessOutput error (inspectable stdout/stderr). `nothrow()` wraps commands that may fail. `retry()` for flaky operations. `spinner()` for progress. Signal handling for cleanup.
**Key decisions:** Fail-fast by default (throw on non-zero exit). Opt-in to ignore errors. Retry with configurable attempts. Graceful shutdown handlers.
**Well lesson:** Service layer should fail-fast by default. Explicit error handling required (no silent swallowing). Retry pattern for flaky external APIs (Gemini, PayOS). Graceful degradation for non-critical failures.

## 4. Pipeline & Composition
**Problem:** Complex scripts need composable operations, not monolithic functions.
**Solution:** Pipe operator chains commands: `$\`cat file\`.pipe($\`grep pattern\`)`. Within/cd scoping: `within(async () => { cd('/tmp'); ... })`. Parallel execution: `Promise.all([$\`cmd1\`, $\`cmd2\`])`.
**Key decisions:** Unix philosophy — small tools composed. Scoped side effects (cd only within block). Parallel where independent. Sequential where dependent.
**Well lesson:** Service composition pattern — pipe data through transformation steps. Scoped contexts (within a transaction, within a user session). Parallel API calls where independent (fetch products + fetch user simultaneously).

## 5. TypeScript-First Scripting
**Problem:** JavaScript lacks types for script safety. Bash has no IDE support.
**Solution:** Full TypeScript support out of box. `.mts` extension. Top-level await. Auto-compilation. IDE autocomplete for all utilities. Type-safe CLI argument parsing.
**Key decisions:** TypeScript not optional — it's the default. No build step for scripts. Type hints for CLI args via minimist types.
**Well lesson:** All utility scripts in TypeScript. Type-safe build/deploy helpers. Type-safe database seed scripts. Developer productivity through IDE autocomplete everywhere.
