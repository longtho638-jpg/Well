# Auto-Agent System 100/100 - Implementation Plan

**Created:** 2026-03-11 | **Status:** In Progress | **Priority:** P0

## Overview

Full Auto-Agent System combining Mekong CLI PEV Engine + OpenClaw Swarm architecture.

## Architecture Components

| Component | Description | Source |
|-----------|-------------|--------|
| **Daemon** | Task queue + file watcher | OpenClaw + Mekong |
| **Dispatcher** | Agent routing + load balance | Mekong planner.py |
| **Executor** | Claude CLI + tmux swarm | OpenClaw worker |
| **Verifier** | Quality gates + rollback | Mekong verifier.py |
| **Logger** | Audit trail + metrics | WellNexus audit-log |

## Implementation Phases

- [ ] Phase 1: Core daemon (task queue, file watcher)
- [ ] Phase 2: Agent dispatcher (routing, load balance)
- [ ] Phase 3: Executor (tmux swarm, Claude CLI)
- [ ] Phase 4: Verifier (quality gates, tests)
- [ ] Phase 5: Logger (audit, metrics, dashboard)

## Tech Stack

- **Runtime:** Node.js 18+ (daemon), Python 3.9+ (agents)
- **Queue:** File-based (tasks/) + SQLite for state
- **Swarm:** tmux panes (3 workers default)
- **CLI:** Claude Code CLI (`claude --dangerously-skip-permissions`)

## Files to Create

```
src/auto-agent/
├── daemon/
│   ├── task-watcher.ts       # File watcher + dispatch
│   ├── queue-manager.ts      # Task queue + priority
│   └── health-monitor.ts     # Worker health + recovery
├── dispatcher/
│   ├── agent-router.ts       # Keyword → agent mapping
│   └── load-balancer.ts      # Round-robin dispatch
├── executor/
│   ├── tmux-swarm.ts         # Tmux pane management
│   └── claude-executor.ts    # Claude CLI wrapper
├── verifier/
│   ├── quality-gates.ts      # Pass/fail criteria
│   └── rollback.ts           # Auto-rollback on fail
└── logger/
    ├── audit-log.ts          # Execution audit trail
    └── metrics.ts            # Performance metrics
```

## Success Criteria

- [ ] Drop task file → auto-execute within 5s
- [ ] 3 parallel workers (configurable)
- [ ] 100% test coverage on core modules
- [ ] Self-healing on worker crash
- [ ] Full audit log for compliance
