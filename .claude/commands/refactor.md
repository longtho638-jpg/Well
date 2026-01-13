---
description: Automatically refactor code to improve structure, readability, and performance
agent: refactoring-expert
---

# /refactor

## Usage
`/refactor [path/to/file_or_directory] [goal]`

## Goals
1. **Cleanup**: Remove unused code, optimize imports, fix formatting.
2. **Modernize**: Convert Class components to Functional, use Hooks.
3. **Optimize**: Implement `useMemo`/`useCallback` where expensive calculations occur.
4. **Abstract**: Extract repeated logic into custom Hooks or utility functions.

## Workflow
1. **Analyze**: The agent reads the target code to understand current complexity.
2. **Plan**: Proposes a refactoring strategy (e.g., "Extract component X").
3. **Execute**: Applies changes safely.
4. **Verify**: Runs `tsc` and `test` to ensure no regression.

## Example
- `/refactor src/components/NetworkTree.tsx "Optimize render performance"`
- `/refactor src/utils/ "Extract common logic"`
