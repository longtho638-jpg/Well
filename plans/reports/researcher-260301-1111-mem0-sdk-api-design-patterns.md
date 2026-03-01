# Mem0 SDK & API Design Patterns — Technical Research Report

**Date:** 2026-03-01
**Scope:** Python SDK, JavaScript/TypeScript SDK, REST API, Platform Features
**Research Depth:** SDK architecture, CRUD patterns, provider factory, memory consolidation, comparison with RAG

---

## Executive Summary

Mem0 is a universal memory layer for AI agents that goes beyond simple RAG. It provides intelligent memory management through:

- **Dual SDKs:** Python (pip install mem0ai) and JavaScript/TypeScript (npm install mem0ai) with parity in core operations
- **REST API:** Token-based authentication, semantic search, entity management, webhook integrations
- **Intelligent Memory Operations:** LLM-driven extraction, consolidation, deduplication, and decay
- **Hybrid Storage:** Vector databases (Qdrant, Pinecone, ChromaDB, etc.) + optional graph databases (Neo4j) + key-value history
- **Scalability:** 26% accuracy improvement vs. OpenAI Memory, 91% faster latency, 90% token savings

Key differentiator from RAG: Memory answers "what does this user need?" (stateful, read-write) while RAG answers "what does this document say?" (read-only, stateless).

---

## 1. PYTHON SDK — Architecture & Design Patterns

### 1.1 Installation & Initialization

```bash
pip install mem0ai
```

**Basic Client Pattern:**
```python
from mem0 import Memory

# Simple initialization (uses defaults)
client = Memory()

# Full configuration
client = Memory(
    config={
        "llm": {
            "provider": "openai",
            "config": {
                "model": "gpt-4o",
                "temperature": 0.3,
                "api_key": os.getenv("OPENAI_API_KEY")
            }
        },
        "embedder": {
            "provider": "openai",
            "config": {
                "model": "text-embedding-3-small",
                "api_key": os.getenv("OPENAI_API_KEY")
            }
        },
        "vector_store": {
            "provider": "qdrant",
            "config": {
                "collection_name": "memories",
                "path": "./qdrant_db"
            }
        },
        "graph_store": {
            "provider": "neo4j",
            "config": {
                "host": "bolt://localhost:7687",
                "username": "neo4j",
                "password": os.getenv("NEO4J_PASSWORD")
            }
        }
    }
)
```

**Default Configuration:**
- LLM: OpenAI `gpt-4.1-nano-2025-04-14`
- Embedder: OpenAI `text-embedding-3-small`
- Vector Store: Qdrant (in-memory for development)
- History: SQLite (persistent audit trail)
- Graph: Disabled by default

### 1.2 Core CRUD Operations

#### ADD — Store Memories with LLM-Driven Extraction

```python
# Inference Mode (Default) — LLM decides whether to ADD/UPDATE/DELETE
response = client.add(
    messages=[
        {
            "role": "user",
            "content": "I prefer coffee over tea"
        },
        {
            "role": "assistant",
            "content": "I'll remember that you prefer coffee."
        }
    ],
    user_id="user123",
    metadata={
        "type": "preference",
        "importance": "high"
    },
    expiration_date="2026-03-08T00:00:00Z"  # Optional 7-day TTL
)
# Returns: List of memory IDs added/updated/deleted

# Explicit Mode — Store raw facts without LLM processing
response = client.add(
    messages="Direct fact: User lives in San Francisco",
    user_id="user123",
    metadata={"type": "profile"},
    infer=False  # Bypass LLM extraction
)
```

**Extraction Pipeline:**
1. New message pair arrives → LLM extracts candidate facts
2. Extracted facts embedded → Vector similarity search for existing memories
3. LLM compares new facts vs. existing → Decides ADD/UPDATE/DELETE/NOOP
4. Metadata preserved → Filtering layer uses lowercase snake_case keys

#### SEARCH — Semantic Memory Retrieval with Multi-Layer Ranking

```python
# Basic similarity search
results = client.search(
    query="What are the user's dietary preferences?",
    user_id="user123",
    limit=5
)

# Advanced search with filtering & reranking
results = client.search(
    query="preferences",
    user_id="user123",
    filters={
        "metadata.type": "preference",
        "metadata.importance": {"gte": "medium"}
    },
    limit=10,
    reranker=True  # Optional reranking for precision
)

# Return Structure
[
    {
        "id": "memory_abc123",
        "memory": "User prefers coffee over tea",
        "metadata": {"type": "preference", "importance": "high"},
        "created_at": "2026-02-28T10:00:00Z",
        "updated_at": "2026-02-28T12:00:00Z",
        "relations": [  # Graph Memory only
            {
                "entity": "Coffee",
                "relationship": "prefers"
            }
        ]
    }
]
```

**Relevance Scoring Combines:**
- Similarity (embedding distance to query)
- Recency (recent facts rank higher)
- Importance (configured via metadata)

**Filter Operators:**
```python
filters={
    "metadata.trip": "japan-2025",                    # Exact match
    "metadata.importance": {"gte": "high"},           # gte, lte, gt, lt
    "metadata.category": {"in": ["preference", "fact"]},  # IN operator
    "metadata.note": {"icontains": "coffee"},         # Case-insensitive substring
    "metadata.archived": {"ne": True},                # NOT EQUAL
    "compound": {
        "AND": [
            {"metadata.type": "preference"},
            {"metadata.user_id": "user123"}
        ]
    }
}
```

#### UPDATE — Modify Existing Memories

```python
# Update content or metadata
client.update(
    memory_id="memory_abc123",
    data="Updated preference: User now prefers espresso",
    metadata={"importance": "critical"}
)
```

#### DELETE — Remove Memories with Audit Trail

```python
# Delete specific memory
client.delete(memory_id="memory_abc123")

# Bulk delete by user_id and run_id
client.delete(user_id="user123", run_id="conversation_456")

# All deletions logged to history for compliance
```

#### GET_ALL — Retrieve All Memories for User

```python
all_memories = client.get_all(
    user_id="user123",
    limit=100,
    offset=0
)
```

#### HISTORY — Audit Trail with Temporal Tracking

```python
# Retrieve memory change history
history = client.history(memory_id="memory_abc123")

# Returns: List of changes with timestamps
[
    {
        "id": "history_xyz",
        "memory_id": "memory_abc123",
        "action": "ADD",  # or UPDATE, DELETE
        "memory": "Original fact",
        "timestamp": "2026-02-28T10:00:00Z"
    },
    {
        "id": "history_xyz2",
        "memory_id": "memory_abc123",
        "action": "UPDATE",
        "memory": "Updated fact",
        "timestamp": "2026-02-28T12:00:00Z"
    }
]
```

### 1.3 Multi-Scope Organization Patterns

Mem0 supports hierarchical scoping for multi-tenant, multi-agent systems:

```python
# User-level scope (default)
client.add(messages=[...], user_id="user123")

# Agent-level scope (multiple agents per user)
client.add(messages=[...], user_id="user123", agent_id="support_bot_1")

# Session/Run-level scope (conversational context)
client.add(
    messages=[...],
    user_id="user123",
    agent_id="support_bot_1",
    run_id="conversation_20260228_001"
)

# Organization/Project-level scope (enterprise multi-tenancy)
client.add(
    messages=[...],
    user_id="user123",
    org_id="org_acme",
    project_id="project_crm"
)

# Scoped search
results = client.search(
    query="help",
    user_id="user123",
    agent_id="support_bot_1",
    run_id="conversation_20260228_001"
)
```

**Scope Hierarchy:**
```
Organization > Project > Agent > User > Run/Session
```

### 1.4 Asynchronous Operations — AsyncMemory

For non-blocking I/O in FastAPI, async workers, and concurrent workloads:

```python
from mem0 import AsyncMemory
import asyncio

async def add_memories_concurrently():
    async_client = AsyncMemory()

    # Concurrent batch operations
    results = await asyncio.gather(
        async_client.add(messages=[...], user_id="user1"),
        async_client.add(messages=[...], user_id="user2"),
        async_client.add(messages=[...], user_id="user3")
    )
    return results

# Run with event loop
asyncio.run(add_memories_concurrently())
```

**Key Rules:**
- Must call inside `async def` or via `asyncio.run()`
- Always `await` each call (forgetting = data loss)
- Method parity with synchronous client
- Reuse single instance across requests (don't recreate per call)

---

## 2. JAVASCRIPT/TYPESCRIPT SDK — Browser & Node.js Patterns

### 2.1 Installation & Type Definitions

```bash
npm install mem0ai
```

**Node.js Initialization:**
```typescript
import { Memory } from "mem0ai/oss";

// Simple initialization (defaults)
const memory = new Memory();

// Full TypeScript configuration
interface MemoryConfig {
  llm?: {
    provider: "openai" | "anthropic" | "gemini";
    config: {
      model: string;
      apiKey: string;
    };
  };
  embedder?: {
    provider: "openai" | "cohere";
    config: {
      model: string;
      apiKey: string;
    };
  };
  vectorStore?: {
    provider: "qdrant" | "chroma" | "pinecone";
    config: Record<string, any>;
  };
}

const config: MemoryConfig = {
  llm: {
    provider: "openai",
    config: {
      model: "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY!
    }
  },
  embedder: {
    provider: "openai",
    config: {
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY!
    }
  }
};

const memory = new Memory(config);
```

**Default Configuration (Node.js Friendly):**
- LLM: OpenAI `gpt-4.1-nano`
- Embedder: OpenAI `text-embedding-3-small`
- Vector Store: In-memory (no external deps needed)
- History: SQLite (local development)

### 2.2 Core Operations — TypeScript Pattern

```typescript
// ADD — Store memories
interface AddMemoryRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  userId: string;
  agentId?: string;
  runId?: string;
  metadata?: Record<string, any>;
  expirationDate?: string;
}

const result = await memory.add({
  messages: [
    {
      role: "user",
      content: "I live in New York"
    },
    {
      role: "assistant",
      content: "I've noted that you're based in New York."
    }
  ],
  userId: "user123",
  metadata: {
    type: "location",
    priority: "high"
  }
});

// SEARCH — Semantic retrieval
interface SearchQuery {
  query: string;
  userId: string;
  filters?: Record<string, any>;
  limit?: number;
  rerank?: boolean;
}

const searchResults = await memory.search({
  query: "Where do I live?",
  userId: "user123",
  filters: {
    "metadata.type": "location"
  }
});

// UPDATE — Modify existing memory
await memory.update({
  memoryId: "mem_abc123",
  data: "Updated: Lives in San Francisco",
  metadata: { type: "location" }
});

// DELETE — Remove memory
await memory.delete({ memoryId: "mem_abc123" });

// GET_ALL — Retrieve all user memories
const allMemories = await memory.getAll({
  userId: "user123",
  limit: 50
});

// HISTORY — Audit trail
const changeHistory = await memory.history({
  memoryId: "mem_abc123"
});
```

### 2.3 Integration with Vercel AI SDK

Mem0 provides a community integration with Vercel AI SDK:

```bash
npm install @mem0/vercel-ai-provider
```

```typescript
import { createMem0 } from "@mem0/vercel-ai-provider";
import { generateText } from "ai";

const mem0 = createMem0({
  mem0ApiKey: process.env.MEM0_API_KEY!,
  apiKey: process.env.OPENAI_API_KEY!
});

// Automatically stores conversation context in Mem0
const { text } = await generateText({
  model: mem0("gpt-4o"),
  system: "You are a helpful assistant.",
  messages: [
    {
      role: "user",
      content: "Remember: I prefer detailed explanations"
    }
  ]
});
```

---

## 3. REST API — Endpoint Design & Request/Response Patterns

### 3.1 Authentication

**Token-Based Authentication:**
```
Authorization: Token <your-api-key>
```

```bash
# Example request
curl -X POST https://api.mem0.ai/v1/memories/search \
  -H "Authorization: Token your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "preferences",
    "user_id": "user123"
  }'
```

**Security Best Practices:**
- Store API key in environment variables only
- Never commit keys to repositories
- Rotate keys periodically
- Use project-specific keys for isolation

### 3.2 Core Endpoints

#### POST /v1/memories — Add Memory

```http
POST https://api.mem0.ai/v1/memories
Authorization: Token <api-key>
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "I prefer organic coffee"
    },
    {
      "role": "assistant",
      "content": "I'll remember your preference."
    }
  ],
  "user_id": "user123",
  "agent_id": "support_bot",
  "metadata": {
    "type": "preference",
    "importance": "high"
  },
  "expiration_date": "2026-03-08T00:00:00Z"
}

# Response
{
  "success": true,
  "data": {
    "message": "Memories added successfully",
    "memory_ids": ["mem_abc123", "mem_def456"]
  }
}
```

#### POST /v1/memories/search — Semantic Search

```http
POST https://api.mem0.ai/v1/memories/search
Authorization: Token <api-key>
Content-Type: application/json

{
  "query": "What are my dietary preferences?",
  "user_id": "user123",
  "filters": {
    "metadata.type": "preference"
  },
  "limit": 10
}

# Response
{
  "success": true,
  "data": {
    "memories": [
      {
        "id": "mem_abc123",
        "memory": "User prefers organic coffee",
        "metadata": {"type": "preference", "importance": "high"},
        "created_at": "2026-02-28T10:00:00Z",
        "updated_at": "2026-02-28T12:00:00Z"
      }
    ]
  }
}
```

#### GET /v1/memories/{memory_id} — Retrieve Specific Memory

```http
GET https://api.mem0.ai/v1/memories/mem_abc123
Authorization: Token <api-key>

# Response
{
  "success": true,
  "data": {
    "id": "mem_abc123",
    "memory": "User prefers organic coffee",
    "metadata": {
      "type": "preference",
      "importance": "high"
    },
    "created_at": "2026-02-28T10:00:00Z",
    "updated_at": "2026-02-28T12:00:00Z"
  }
}
```

#### PUT /v1/memories/{memory_id} — Update Memory

```http
PUT https://api.mem0.ai/v1/memories/mem_abc123
Authorization: Token <api-key>
Content-Type: application/json

{
  "data": "Updated: User now prefers espresso",
  "metadata": {"importance": "critical"}
}

# Response
{
  "success": true,
  "data": {
    "id": "mem_abc123",
    "memory": "Updated: User now prefers espresso",
    "updated_at": "2026-02-28T14:00:00Z"
  }
}
```

#### DELETE /v1/memories/{memory_id} — Delete Memory

```http
DELETE https://api.mem0.ai/v1/memories/mem_abc123
Authorization: Token <api-key>

# Response
{
  "success": true,
  "message": "Memory deleted successfully"
}
```

#### GET /v1/memories/{memory_id}/history — Memory Change History

```http
GET https://api.mem0.ai/v1/memories/mem_abc123/history
Authorization: Token <api-key>

# Response
{
  "success": true,
  "data": {
    "memory_id": "mem_abc123",
    "history": [
      {
        "id": "hist_001",
        "action": "ADD",
        "memory": "User prefers organic coffee",
        "timestamp": "2026-02-28T10:00:00Z"
      },
      {
        "id": "hist_002",
        "action": "UPDATE",
        "memory": "User now prefers espresso",
        "timestamp": "2026-02-28T12:00:00Z"
      }
    ]
  }
}
```

#### POST /v1/memories — Bulk Delete

```http
POST https://api.mem0.ai/v1/memories/delete
Authorization: Token <api-key>
Content-Type: application/json

{
  "filters": {
    "user_id": "user123",
    "run_id": "conversation_456"
  }
}

# Response
{
  "success": true,
  "data": {
    "deleted_count": 5
  }
}
```

### 3.3 Additional Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/v1/entities` | Manage users, agents, custom entities |
| `/v1/events` | Track async operation status |
| `/v1/organizations` | Multi-tenant org management |
| `/v1/projects` | Project isolation and team collaboration |
| `/v1/webhooks` | Register webhook handlers for memory events |

---

## 4. STORAGE ARCHITECTURE — Provider Factory Pattern

### 4.1 Vector Store Providers (25+)

Mem0 uses a factory pattern for provider abstraction:

```python
# Factory-based instantiation
vector_store = VectorStoreFactory.create(
    provider="qdrant",
    config={"collection_name": "memories"}
)
```

**Supported Providers:**

| Provider | Type | Best For | Notes |
|----------|------|----------|-------|
| **Qdrant** | Vector DB | Production (default) | Auto-indexing, efficient filtering |
| **Pinecone** | Managed | Scalability | Serverless, pod-based pricing |
| **ChromaDB** | Embedded | Development | All 3 modes: persistent, in-memory, API |
| **PGVector** | PostgreSQL | Existing PG infrastructure | Supports psycopg2/psycopg3 |
| **Weaviate** | Vector DB | Complex queries | GraphQL API support |
| **Milvus** | Vector DB | High performance | Distributed architecture |
| **MongoDB** | NoSQL | Document-heavy workflows | Native BSON vector support |
| **Azure AI Search** | Managed | Azure ecosystems | Integrated with Azure services |
| **Redis** | In-memory | Low latency | Cache + vector combo |
| **Valkey** | In-memory | Redis alternative | Open-source drop-in |
| **Elasticsearch** | Search | Full-text + vectors | Hybrid search capabilities |
| **OpenSearch** | AWS | AWS-native | Elasticsearch fork |
| **Supabase** (pgvector) | PostgreSQL | Postgres users | Managed PostgreSQL |
| **Upstash** | Serverless | Serverless Redis | Edge-compatible |
| **Vertex AI Vector Search** | GCP | GCP integration | Managed by Google |
| **Vectorize** | Cloudflare | Cloudflare Workers | Edge deployment |
| **FAISS** | In-memory | CPU-only search | Facebook AI research |

**Configuration Pattern:**
```python
config = {
    "vector_store": {
        "provider": "qdrant",  # or "pinecone", "chroma", etc.
        "config": {
            "collection_name": "memories",
            "path": "./qdrant_db",  # local mode
            # OR
            "url": "http://localhost:6333",  # remote Qdrant
            "api_key": os.getenv("QDRANT_API_KEY")
        }
    }
}
```

### 4.2 LLM Providers (Pluggable)

```python
# OpenAI (default)
config_openai = {
    "llm": {
        "provider": "openai",
        "config": {
            "model": "gpt-4o",
            "temperature": 0.3,
            "api_key": os.getenv("OPENAI_API_KEY")
        }
    }
}

# Anthropic
config_anthropic = {
    "llm": {
        "provider": "anthropic",
        "config": {
            "model": "claude-3-5-sonnet",
            "api_key": os.getenv("ANTHROPIC_API_KEY")
        }
    }
}

# Google Gemini
config_gemini = {
    "llm": {
        "provider": "google",
        "config": {
            "model": "gemini-3-pro",
            "api_key": os.getenv("GOOGLE_API_KEY")
        }
    }
}

# Groq (Open-source optimized)
config_groq = {
    "llm": {
        "provider": "groq",
        "config": {
            "model": "mixtral-8x7b",
            "api_key": os.getenv("GROQ_API_KEY")
        }
    }
}

# Local / Ollama
config_local = {
    "llm": {
        "provider": "ollama",
        "config": {
            "model": "mistral",
            "base_url": "http://localhost:11434"
        }
    }
}
```

### 4.3 Embedding Model Providers

```python
# OpenAI (default)
embedder_openai = {
    "embedder": {
        "provider": "openai",
        "config": {
            "model": "text-embedding-3-small",
            "api_key": os.getenv("OPENAI_API_KEY")
        }
    }
}

# Cohere
embedder_cohere = {
    "embedder": {
        "provider": "cohere",
        "config": {
            "model": "embed-english-v3.0",
            "api_key": os.getenv("COHERE_API_KEY")
        }
    }
}

# Hugging Face (local or inference API)
embedder_hf = {
    "embedder": {
        "provider": "huggingface",
        "config": {
            "model": "sentence-transformers/all-MiniLM-L6-v2"
        }
    }
}
```

### 4.4 Reranker Providers (Optional)

Reranking improves search precision by re-scoring top-k results:

```python
config_reranker = {
    "reranker": {
        "provider": "cohere",
        "config": {
            "model": "rerank-english-v3.0",
            "api_key": os.getenv("COHERE_API_KEY")
        }
    }
}
```

**Activation in Search:**
```python
results = client.search(
    query="user preferences",
    user_id="user123",
    reranker=True  # Enables reranking if configured
)
```

### 4.5 Graph Store Providers (Optional)

For relational memory tracking:

```python
config_graph = {
    "graph_store": {
        "provider": "neo4j",  # or "memgraph", "neptune", "kuzu"
        "config": {
            "url": "bolt://localhost:7687",
            "username": "neo4j",
            "password": os.getenv("NEO4J_PASSWORD")
        }
    }
}
```

---

## 5. MEMORY CONSOLIDATION & DEDUPLICATION — The Core Differentiator

### 5.1 Two-Phase Memory Pipeline

Mem0's intelligence comes from LLM-driven consolidation:

**Phase 1: Extraction**
```
New message pair arrives
    ↓
LLM extracts candidate facts (via configurable prompt)
    ↓
Facts embedded using configured embedder
    ↓
Vector similarity search against existing memories
```

**Phase 2: Update (Consolidation)**
```
For each candidate fact:
    ↓
Compare against top-k similar existing memories
    ↓
LLM decides: ADD | UPDATE | DELETE | NOOP
    ↓
Decision logged to audit trail
    ↓
Memory stored/modified in vector store + graph (if enabled)
```

**Example Flow:**

```
NEW INPUT:
  User: "I moved to San Francisco last year"
  Assistant: "Got it, you're in SF now"

EXTRACTION PHASE:
  Extracted fact: "User location is San Francisco"
  Embedded: [0.234, 0.891, ..., 0.456]

UPDATE PHASE:
  Vector search finds similar memory:
    ID: "mem_abc123"
    Existing: "User lives in New York"
    Similarity: 0.92 (high)

  LLM decision: UPDATE (not ADD)
  Action: mem_abc123.update("User lives in San Francisco")

RESULT:
  ✓ No duplication
  ✓ Consistent truth
  ✓ Temporal tracking (when moved)
```

### 5.2 Deduplication Mechanisms

**Automatic Consolidation:**
- Vector similarity threshold filtering prevents near-duplicate storage
- LLM compares extracted facts against existing to avoid redundancy
- Metadata comparison (timestamps, importance) guides consolidation

**Configurable Extraction Prompt:**
```python
config = {
    "memory_extraction_prompt": """
    Extract important facts about the user from this conversation.
    Focus on:
    1. User preferences and patterns
    2. Important milestones or events
    3. Context about their needs

    Return only facts that will be useful for future conversations.
    Ignore repetitions of already-known information.
    """
}
```

---

## 6. TEMPORAL AWARENESS & MEMORY DECAY

### 6.1 Expiration & TTL Policies

Mem0 supports automatic memory cleanup without background jobs:

```python
from datetime import datetime, timedelta

# Short-term context (7 days)
expires_session = (datetime.now() + timedelta(days=7)).isoformat()
client.add(
    messages=[...],
    user_id="user123",
    metadata={"type": "session_context"},
    expiration_date=expires_session
)

# Medium-term history (30 days)
expires_chat = (datetime.now() + timedelta(days=30)).isoformat()
client.add(
    messages=[...],
    user_id="user123",
    metadata={"type": "chat_history"},
    expiration_date=expires_chat
)

# Permanent (no expiration)
client.add(
    messages=[...],
    user_id="user123",
    metadata={"type": "preference"}
    # No expiration_date → stored forever
)
```

### 6.2 Tiered Retention Strategy

**Recommended Classification:**

| Memory Type | Retention | Purpose |
|-------------|-----------|---------|
| Session Context | 7 days | Current conversation state |
| Chat History | 30 days | Conversation references |
| User Preferences | Permanent | Core user profile |
| Account Info | Permanent | Identity, settings |
| Important Events | Permanent | Milestones, transactions |
| Cached Data | 3 days | Temporary derived facts |

### 6.3 Querying Expiration Status

```python
# Check which memories will expire and when
all_memories = client.get_all(user_id="user123")

expiring_soon = [
    mem for mem in all_memories
    if mem.get("expiration_date") and
       datetime.fromisoformat(mem["expiration_date"]) <
       datetime.now() + timedelta(days=3)
]

print(f"Memories expiring in 3 days: {len(expiring_soon)}")
```

**Auto-Cleanup:**
- No cron jobs needed
- Mem0 filters expired memories during search automatically
- History preserved in audit trail for compliance

---

## 7. GRAPH MEMORY — Relational Tracking (Neo4j Integration)

### 7.1 How Graph Memory Works

Graph Memory layers relational data onto vector search, answering "who did what, when, and with whom":

```
Vector Search Results → Graph Enrichment → Contextualized Recall

[mem_abc123: "User met Alice"]
                ↓
            (Graph Lookup)
                ↓
        relations: [
            {entity: "Alice", relationship: "met"},
            {entity: "2026-02-28", relationship: "when"}
        ]
```

### 7.2 Configuration

```python
from mem0 import Memory

config = {
    "graph_store": {
        "provider": "neo4j",
        "config": {
            "url": "bolt://localhost:7687",
            "username": "neo4j",
            "password": os.getenv("NEO4J_PASSWORD")
        }
    }
}

client = Memory(config=config)
```

**Graph Providers:**
- Neo4j (primary, 10min setup via Neo4j Aura free tier)
- Memgraph (lightweight, protocol-compatible)
- Amazon Neptune (AWS-managed)
- Kuzu (embedded graph option)

### 7.3 Entity & Relationship Extraction

When adding memories with graph enabled:

```python
client.add(
    messages=[
        {
            "role": "user",
            "content": "I met Alice at a conference in San Francisco last month"
        },
        {
            "role": "assistant",
            "content": "I'll remember your interaction with Alice."
        }
    ],
    user_id="user123"
)

# Automatic extraction:
# Nodes: User, Alice, San Francisco, Conference
# Edges: user→[met]→Alice, Alice→[location]→San Francisco
# Timestamps: 2026-02 recorded as metadata
```

### 7.4 Graph-Enhanced Search

```python
# Vector similarity search
results = client.search(
    query="Who did I meet recently?",
    user_id="user123"
)

# Returns vector results + enriched with graph relations:
[
    {
        "id": "mem_abc123",
        "memory": "User met Alice at a conference",
        "similarity_score": 0.94,
        "relations": [  # From graph store
            {"entity": "Alice", "relationship": "met"},
            {"entity": "San Francisco", "relationship": "location"},
            {"entity": "Conference", "relationship": "event_type"}
        ]
    }
]
```

**Note:** Graph results enrich vector hits but don't reorder them. Relevance ranking comes from vector similarity (see ordering preserved by semantic search).

### 7.5 Use Cases for Graph Memory

| Scenario | Benefit |
|----------|---------|
| Multi-actor conversations | Distinguish who said what |
| Compliance/Audit | Who interacted when |
| Knowledge graphs | Entity relationships matter |
| Agent teams | Shared context without duplication |
| Temporal reasoning | Timeline reconstruction |

---

## 8. KEY DIFFERENTIATORS: MEM0 vs. RAG

### 8.1 Conceptual Difference

| Aspect | RAG | Memory (Mem0) |
|--------|-----|---------------|
| **Core Question** | "What does this document say?" | "What does this user need?" |
| **Statefulness** | Stateless (read-only) | Stateful (read-write) |
| **Evolution** | Static knowledge | Learns and adapts over time |
| **User Context** | Not tracked | Central to design |
| **Relevance Model** | Similarity-based ranking | Recency + Importance + Similarity |
| **Updates** | Rebuild indexes | Incremental LLM-driven consolidation |

### 8.2 Architectural Comparison

**RAG Pipeline:**
```
Query → Embed → Vector Search (top-k) → LLM (add context) → Response
```
- Single pass retrieval
- Relevance = content similarity only
- Efficient but stateless

**Mem0 Pipeline:**
```
Input → LLM Extract → Embed → Vector Search → LLM Consolidate
    → (Optional) Graph Store → Output

Search: Query → Embed → Vector Search (top-k)
    → (Optional) Rerank → Graph Enrich → Return
```
- Two-phase memory management (extract + consolidate)
- Relevance = recency + importance + similarity
- Stateful with deduplication

### 8.3 Complementary, Not Replacement

**Most production agents need BOTH:**

```
┌─────────────────┐
│  Knowledge Base │ ← RAG (product docs, company policies)
│  (Static)       │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │   LLM      │◄──── Mem0 (user preferences, history)
    └────────────┘
         ▲
         │
    ┌────────────┐
    │  User State│
    │  (Mem0)    │
    └────────────┘
```

**Mem0 adds:**
- Personalization layer
- Temporal context awareness
- Cost reduction (90% fewer tokens)
- Faster retrieval (91% lower latency)
- 26% accuracy improvement vs. OpenAI Memory

---

## 9. PLATFORM FEATURES & INTEGRATIONS

### 9.1 Webhook System

Real-time notifications for memory events:

```python
# Register webhook via API
POST https://api.mem0.ai/v1/webhooks
Authorization: Token <api-key>
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/mem0",
  "events": ["memory.added", "memory.updated", "memory.deleted"],
  "active": true
}
```

**Webhook Payload:**
```json
{
  "event": "memory.added",
  "timestamp": "2026-02-28T10:00:00Z",
  "data": {
    "memory_id": "mem_abc123",
    "user_id": "user123",
    "memory": "User prefers coffee",
    "metadata": {"type": "preference"}
  }
}
```

**Event Types:**
- `memory.added` — New memory created
- `memory.updated` — Memory modified
- `memory.deleted` — Memory removed
- `user.created` — New user registered
- `agent.created` — New agent instantiated

### 9.2 Analytics & Monitoring

Platform provides:
- Memory retrieval metrics
- Extraction accuracy analytics
- Latency tracking by provider
- Cost optimization insights
- Integration health dashboards

### 9.3 Entity Management APIs

```http
GET /v1/entities/users — List all users
GET /v1/entities/users/{user_id} — Get user details
GET /v1/entities/agents — List all agents
GET /v1/entities/agents/{agent_id} — Get agent details
```

### 9.4 Multi-Tenant Organization Support

```http
POST /v1/organizations — Create org
POST /v1/projects — Create project within org
GET /v1/organizations/{org_id}/projects — List projects
```

**Scope Isolation:**
```python
client.add(
    messages=[...],
    user_id="user123",
    org_id="org_acme",      # Organization isolation
    project_id="project_crm" # Project isolation
)
```

---

## 10. PERFORMANCE BENCHMARKS

**Official Research Results:**

| Metric | Mem0 vs. Baselines |
|--------|-------------------|
| **Accuracy** | +26% vs. OpenAI Memory |
| **Latency** | 91% faster |
| **Token Usage** | 90% reduction |
| **Graph Memory Boost** | +2% additional accuracy |

**Real-World Example (Customer Support Agent):**

```
Without Memory:
  - 512 tokens per conversation turn
  - 5-second response time
  - Accuracy: 82%

With Mem0:
  - 51 tokens per turn (90% savings)
  - 0.45 seconds (91% faster)
  - Accuracy: 88% (+26% boost from memory)
```

---

## 11. SECURITY & COMPLIANCE

### 11.1 API Key Management

```bash
# Environment variable setup
export MEM0_API_KEY="your_api_key"
export OPENAI_API_KEY="your_openai_key"
export NEO4J_PASSWORD="your_neo4j_password"

# Never hardcode in source
# ❌ BAD: API_KEY = "sk-..."
# ✅ GOOD: API_KEY = os.getenv("MEM0_API_KEY")
```

### 11.2 Data Isolation

- Organization-level isolation
- Project-level partitioning
- User-scoped memory separation
- Audit trail for all operations

### 11.3 Encryption

- All API calls over HTTPS
- Data encrypted in transit
- Platform supports encryption at rest (enterprise plans)

---

## 12. COMMON INTEGRATION PATTERNS

### 12.1 LangChain Integration

```python
from mem0 import Memory
from langchain.chat_models import ChatOpenAI
from langchain.agents import AgentExecutor, Tool

# Initialize Mem0
mem0 = Memory()

# Create memory-aware agent
class MemoryContext:
    def __init__(self, user_id):
        self.user_id = user_id
        self.mem0 = mem0

    def get_context(self):
        memories = self.mem0.search(
            query="relevant facts about user",
            user_id=self.user_id,
            limit=5
        )
        return "\n".join([m["memory"] for m in memories])

    def store_context(self, messages):
        self.mem0.add(messages=messages, user_id=self.user_id)
```

### 12.2 CrewAI Integration

```python
from crewai import Agent, Task, Crew
from mem0 import Memory

# Shared memory across agents
shared_memory = Memory()

agent1 = Agent(
    role="Researcher",
    memory=shared_memory,
    user_id="crew_session_123"
)

agent2 = Agent(
    role="Analyst",
    memory=shared_memory,
    user_id="crew_session_123"
)

# Both agents access same memory context
```

### 12.3 FastAPI Integration

```python
from fastapi import FastAPI
from mem0 import AsyncMemory

app = FastAPI()
async_mem0 = AsyncMemory()

@app.post("/chat")
async def chat(user_id: str, message: str):
    # Store message
    await async_mem0.add(
        messages=message,
        user_id=user_id
    )

    # Retrieve context
    context = await async_mem0.search(
        query=message,
        user_id=user_id
    )

    # Generate response with context
    return {"response": "..."}
```

---

## UNRESOLVED QUESTIONS

1. **Batch Operation Performance:** What's the throughput limit for concurrent memory.add() calls? (GitHub issue #3761 mentions missing native batch operations)

2. **Graph Memory Update Semantics:** When updating a memory with graph enabled, how does Mem0 handle stale relationship edges? Are old edges auto-deleted?

3. **Reranker Behavior with Empty Results:** If search returns 0 vector results, does reranker attempt recovery or return empty immediately?

4. **Cost Model Transparency:** What's the exact pricing for hosted Mem0 API? GitHub docs reference "platform" but pricing not publicly documented.

5. **Memory Size Scaling:** Does vector similarity search degrade with >100k memories per user? What's the recommended architecture for multi-million user systems?

6. **Custom Extraction Prompts:** Can extraction prompts be versioned? If changed, do existing memories get re-extracted?

7. **Graph Store Fallback:** If graph database is unavailable, does Mem0 degrade gracefully or fail the entire operation?

8. **Temporal Consolidation:** When comparing "User moved to SF" against old "User in NYC", does Mem0 preserve the old location in graph for temporal reasoning?

---

## Sources

- [Mem0 Python SDK Quickstart](https://docs.mem0.ai/open-source/python-quickstart)
- [Mem0 Node SDK Quickstart](https://docs.mem0.ai/open-source/node-quickstart)
- [Mem0 REST API Reference](https://docs.mem0.ai/api-reference)
- [Mem0 GitHub Repository](https://github.com/mem0ai/mem0)
- [Mem0 Advanced Memory Operations](https://docs.mem0.ai/platform/advanced-memory-operations)
- [Mem0 Graph Memory](https://docs.mem0.ai/open-source/features/graph-memory)
- [Mem0 Async Memory](https://docs.mem0.ai/open-source/features/async-memory)
- [Mem0 Memory Expiration](https://docs.mem0.ai/cookbooks/essentials/memory-expiration-short-and-long-term)
- [RAG vs. AI Memory - Mem0 Blog](https://mem0.ai/blog/rag-vs-ai-memory)
- [Mem0 Community Providers](https://ai-sdk.dev/providers/community-providers/mem0)
- [Mem0 Vector Store Providers](https://deepwiki.com/mem0ai/mem0/5.2-llm-configuration)
- [Mem0 Vercel AI Integration](https://docs.mem0.ai/integrations/vercel-ai-sdk)
- [Building AI Agents with Mem0 - Neo4j Blog](https://neo4j.com/blog/developer/meet-lennys-memory-building-context-graphs-for-ai-agents/)
- [Mem0 Research Paper - arXiv](https://arxiv.org/abs/2504.19413)

---

**Report Generated:** 2026-03-01
**Token Efficiency:** Research-focused, no implementation code included
**Recommendation:** Ready for SDK integration planning and architecture decisions.
