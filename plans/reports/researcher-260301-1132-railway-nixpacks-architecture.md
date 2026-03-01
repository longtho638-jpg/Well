# Railway & Nixpacks Architecture Patterns for Well RaaS Platform
**Date:** 2026-03-01 | **Researcher:** AI Agent | **Target:** React/TypeScript Health Platform

## Executive Summary

Railway.app and Nixpacks demonstrate **three architectural patterns** applicable to Well's RaaS platform:
1. **Auto-Detection + Declarative Building** (Nixpacks Plan→Build→Deploy)
2. **Visual Service Composition** (Railway Canvas for infrastructure visualization)
3. **Agent-Based Dynamic Service Assembly** (modular capability composition)

**Key insight:** Zero-ops platforms win through assumption-free detection + visual transparency.

---

## Pattern 1: Nixpacks Plan→Build→Deploy (Detection-First Architecture)

### How It Works
- **Plan Phase:** Detect language/framework by analyzing files (package.json → Node.js, pyproject.toml → Python)
- **Build Phase:** Compose deterministic Nix environment + install dependencies → Docker image
- **Deploy Phase:** OCI-compliant image runs anywhere with reproducible guarantees

### Technology Stack
- Nix determinism (dependency resolution)
- Docker BuildKit (layered image generation)
- Extensible provider system (custom buildpacks via `nixpacks.toml`)

### Applicable to Well
**Use case:** Automated provider/clinic onboarding
- Detect clinic tech stack from uploaded config files
- Auto-generate deployment recipe (API keys, database, auth settings)
- Package as reproducible artifact → reduces setup time 80%

**Implementation:**
```yaml
# clinic-onboarding.toml (Well-specific)
providers = ["react", "typescript", "drizzle-orm"]
install = ["pg", "redis"]
build_command = "npm run build:clinic"
```

---

## Pattern 2: Railway Visual Canvas (Service Graph Abstraction)

### Architecture
- **Project Canvas:** Spatial interface showing services, databases, workers
- **Service Groups:** Logical clustering (frontend, backend, workers)
- **Automatic Networking:** Drag-drop database connection → auto env-var injection
- **Private networks:** All services in project auto-connected

### Developer Experience Win
Developers see **complete infrastructure at a glance** → reduces mental model overhead.

### Applicable to Well
**Use case:** Multi-tenant distributor portal architecture
```
Canvas Layout:
├── Frontend Service (React app)
├── Backend API (Node.js)
├── Auth Service (email/OAuth provider)
├── Database (PostgreSQL)
├── Cache Layer (Redis)
└── Background Workers (job queue)
```

**Actionable:** Implement **Well Architecture Canvas** in admin dashboard
- Visual representation of distributor network topology
- Real-time service health (green/red indicator per region)
- Drag-drop service scaling (increase replicas, adjust CPU)

---

## Pattern 3: Agent-Based Dynamic Service Composition

### Agentic Architecture Principles
1. **Modular Capabilities:** Each service = reusable capability (auth, payment, inventory)
2. **Dynamic Assembly:** Agent selects/composes capabilities based on request context
3. **Standardized Interfaces:** All capabilities expose uniform contract
4. **Self-Healing:** Failed compositions trigger rollback + retry with alternate path

### Multi-Agent System for RaaS
```
┌─────────────────────────────────────────┐
│  Distributor Request (health product X) │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Router Agent (NLU: what is needed?)     │
│ → inventory_service + payment_service  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Composer Agent (assemble pipeline)      │
│ → check_stock() → authorize_payment()  │
│    → fulfill_order() → send_receipt()   │
└────────────┬────────────────────────────┘
             │
             ▼
         [Result]
```

### Applicable to Well
- **DistributorIntent Agent:** Parse distributor request → required capabilities
- **CapabilityComposer:** Assemble service pipeline (auth→inventory→payment→fulfillment)
- **HealthCheckAgent:** Monitor service health, auto-fallback (primary region down → secondary)
- **ConfigurationAgent:** Auto-detect clinic setup, route to correct provider

---

## Pattern 4: 10x Productivity Principles

| Principle | Railway/Nixpacks | Well Application |
|-----------|-----------------|------------------|
| **Assumption-free detection** | Nixpacks reads package.json/Dockerfile | Clinic detection from uploaded config |
| **Visual transparency** | Canvas shows all services | Admin dashboard shows distributor topology |
| **Push-to-deploy simplicity** | Git push → auto CI/CD → production | API push → auto provider onboarding → live |
| **Sane defaults** | Zero-config for 80% use cases | Default clinic settings → customizable |
| **Private networks** | Services auto-connected | Clinics auto-networked within organization |
| **Zero-ops scaling** | Horizontal replicas + load balancing | Auto-scale distributor instances by region |

---

## Actionable Roadmap for Well

### Phase 1: Auto-Detection Engine (Week 1)
- Build `ClinicConfigDetector` (reads clinic config files)
- Output standardized `ClinicEnvironment` schema
- Tests: detect React/Node/Python clinic tech stacks

### Phase 2: Service Canvas (Week 2)
- Implement `DistributorArchitectureCanvas` component
- Show services (API, Auth, Inventory, Payment, Workers)
- Real-time health indicators + scaling controls

### Phase 3: Agent-Based Routing (Week 3)
- `DistributorRequestRouter` agent (intent classification)
- `CapabilityComposer` agent (pipeline assembly)
- Fallback logic when services fail

### Phase 4: Multi-Region Scaling (Week 4)
- Replicate services across regions
- Automatic regional failover
- Load balancing with health checks

---

## Technical Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Auto-detection fails for edge cases | Whitelist common patterns + manual override UI |
| Agent routing incorrect | Fallback to human review queue |
| Service composition latency | Cache common patterns, precompile pipelines |
| Regional failover delays | Health check every 5s, pre-warm standby |

---

## References & Sources

- [Railway Platform](https://railway.com/)
- [Railway Scaling Documentation](https://docs.railway.com/reference/scaling)
- [Nixpacks How It Works](https://nixpacks.com/docs/how-it-works)
- [Railway Nixpacks Integration](https://docs.railway.com/reference/nixpacks)
- [Agentic Architecture Guide](https://www.speakeasy.com/mcp/using-mcp/ai-agents/architecture-patterns)
- [Railway Blog: Building Railway on Railway](https://blog.railway.com/p/building-railway-on-railway)
- [Agentic Architectures: Modular Autonomous AI](https://www.emergentmind.com/topics/agentic-architectures)

---

## Unresolved Questions

1. How to handle provider-specific edge cases in auto-detection (custom clinic requirements)?
2. What's the optimal regional replication strategy for health data compliance (HIPAA/local regulations)?
3. Should agent-based routing be synchronous (latency) or async with human review?
