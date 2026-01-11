---
description: Plan phase - Research, specification, and architecture design
---

# /plan Workflow

## Overview
This workflow phase focuses on understanding requirements, researching the codebase, and designing the solution before implementation.

## Steps

### 1. Research Requirements
// turbo
```bash
# Search for relevant patterns in codebase
grep -rn "PATTERN" src --include="*.ts" --include="*.tsx" | head -20
```

### 2. Invoke Research Agent
Use `/research` command to deep-dive into requirements:
- Analyze existing implementations
- Identify patterns and conventions
- Document findings

### 3. Generate Specifications
Use `/spec` commands from `.claude/commands/spec/`:
- Create technical specifications
- Define interfaces and types
- Document API contracts

### 4. Architecture Review
- Review with `@react-expert` for component design
- Review with `@typescript-expert` for type safety
- Review with `@testing-expert` for test strategy

## Exit Criteria
- [ ] Requirements documented
- [ ] Technical spec created
- [ ] Architecture approved
- [ ] Ready for `/code` phase

## Related Commands
- `.claude/commands/research.md`
- `.claude/commands/spec/*.md`
- `.claude/agents/react/react-expert.md`
