---
title: "mem0 RaaS AGI Memory System"
description: "Three-tier agent memory (vector + relational + history) for Well Agent-OS via vibe-memory SDK"
status: pending
priority: P1
effort: 16h
branch: main
tags: [agent-os, memory, ai, vibe-sdk, supabase, pgvector]
created: 2026-03-01
---

# mem0 RaaS AGI Memory — Implementation Plan

## Summary

Add persistent memory to Well's 24+ stateless agents. Adapted from mem0ai/mem0 three-tier architecture (vector + relational + history), implemented as `vibe-memory` SDK using Supabase pgvector. Agents will remember user preferences, conversation context, and sales history across sessions.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Agent (Coach, Copilot, etc.)       │
│                  execute(input) + memory context     │
├─────────────────────────────────────────────────────┤
│               MemoryAwareAgent mixin                 │
│    recall(userId) → inject context into prompt       │
│    memorize(userId, facts) → store after execution   │
├──────────┬──────────────────┬────────────────────────┤
│ Vector   │  Relational      │  History               │
│ (Search) │  (Entities)      │  (Audit Trail)         │
├──────────┼──────────────────┼────────────────────────┤
│ pgvector │  agent_memories  │  memory_history        │
│ embeddings│ (Supabase)      │  (Supabase)            │
│ table    │                  │                        │
└──────────┴──────────────────┴────────────────────────┘
           │                  │
           ▼                  ▼
┌─────────────────────────────────────────────────────┐
│         Supabase Edge Function: memory-worker        │
│  - Gemini embedding generation                       │
│  - LLM fact extraction (ADD/UPDATE/DELETE/NOOP)      │
│  - Deduplication + conflict resolution               │
└─────────────────────────────────────────────────────┘
```

## mem0 Pattern Mapping to Well

| mem0 Pattern | Well Adaptation | Rationale |
|---|---|---|
| Vector Store (Qdrant/Chroma) | Supabase pgvector | Already using Supabase; pgvector avoids new infra |
| Graph Memory (Neo4j) | **SKIP** | YAGNI — entity relationships not needed for MVP |
| LLM Fact Extraction | Gemini via Edge Function | Reuse existing gemini-chat pattern |
| User/Agent/Run scoping | userId + agentName + sessionId | Maps to existing auth + registry |
| Memory Consolidation | LLM-driven dedup in Edge Function | Prevent memory bloat |
| Python/TS SDK | vibe-memory SDK (TypeScript) | Follows vibe-* pattern |
| REST API | Supabase queries + Edge Functions | Frontend-only constraint |

## What We Skip (YAGNI)

- **Graph memory (Neo4j)** — No entity/relationship extraction needed for coaching + sales
- **TTL/Expiration** — Not needed for MVP; memories persist indefinitely
- **Multi-model embedding** — Single Gemini embedding model sufficient
- **Memory versioning** — History table provides audit trail, no versioning needed
- **Custom embedding dimensions** — Use Gemini's default 768-dim

## Phases

| Phase | Title | Effort | Status | Dependencies |
|---|---|---|---|---|
| 1 | [vibe-memory SDK Core](./phase-01-vibe-memory-sdk-core.md) | 4h | pending | None |
| 2 | [Memory Service Integration](./phase-02-memory-service-integration.md) | 4h | pending | Phase 1 |
| 3 | [Agent Memory Features](./phase-03-agent-memory-features.md) | 4h | pending | Phase 2 |
| 4 | [Memory UI Components](./phase-04-memory-ui-components.md) | 2h | pending | Phase 3 |
| 5 | [Testing & Go-Live](./phase-05-testing-and-golive.md) | 2h | pending | Phase 4 |

## Key Design Decisions

1. **pgvector over external vector DB** — Supabase already provisioned; pgvector extension avoids new infrastructure, billing, and latency
2. **Edge Function for embeddings** — Cannot call Gemini embedding API from browser (CORS + API key exposure); Edge Function mirrors gemini-chat pattern
3. **Mixin over inheritance** — `withMemory()` wrapper composes with existing BaseAgent without changing class hierarchy
4. **Lazy memory load** — Memories fetched on agent execute(), not on page load; prevents unnecessary API calls
5. **Memory limit per user/agent** — Cap at 100 memories per user-agent pair to prevent bloat; oldest auto-archived

## Database Tables (New)

```sql
-- Vector memory store
agent_memories (
  id uuid PK,
  user_id uuid FK → auth.users,
  agent_name text,
  content text,           -- The fact/memory text
  embedding vector(768),  -- Gemini embedding
  metadata jsonb,         -- { session_id, source, confidence }
  created_at timestamptz,
  updated_at timestamptz
)

-- Change history (audit trail)
memory_history (
  id uuid PK,
  memory_id uuid FK → agent_memories,
  action text,            -- ADD | UPDATE | DELETE
  old_content text,
  new_content text,
  actor text,             -- agent name or 'system'
  created_at timestamptz
)
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| pgvector extension not enabled | Low | High | Check in migration; Supabase enables it via `create extension if not exists vector` |
| Gemini embedding rate limits | Medium | Medium | Batch embeddings; cache in memory table; 1500 RPM free tier |
| Memory bloat (too many facts) | Medium | Medium | 100-memory cap per user-agent; consolidation job |
| Slow vector search on large tables | Low | Low | pgvector IVFFlat index; <10k rows initially |
| Edge Function cold start | Low | Low | Reuse gemini-chat warm function pattern |

## Success Criteria

- [ ] Coach agent recalls user's sales history + preferences across sessions
- [ ] Copilot agent remembers conversation context for returning customers
- [ ] Memory panel in dashboard shows agent memories for current user
- [ ] Build passes with 0 TS errors
- [ ] All new code has tests
- [ ] i18n keys synced (vi + en)
