# Research Report: AGI RaaS — Market Analysis for WellNexus

**Date:** 2026-03-02 | **Scope:** AGI RaaS definition, capabilities, frameworks, revenue models, competitive landscape, risks

---

## 1. What Is AGI RaaS

**Definition:** AGI RaaS = deploying AGI-grade autonomous agents as a revenue-generating service layer. Differs from traditional AI SaaS:

| Traditional AI SaaS | AGI RaaS |
|---|---|
| Feature-gated (plan tiers) | Agent-gated (pay per agent action/outcome) |
| Static tools | Autonomous multi-step reasoning |
| Human-in-loop | Human-on-loop (agent decides, human reviews) |
| Subscription seat pricing | Usage + outcome-based pricing |

**Market size:**
- AGI market: $5.24B (2025) → $82.06B (2035) at 32.1% CAGR
- AI-as-a-Service: $17.14B (2025) → $123.89B (2031) at 39.05% CAGR
- Enterprise AI agents: $2.58B (2024) → $24.50B (2030) at 46.2% CAGR
- Gartner: 40% of enterprise apps will include task-specific AI agents by end of 2026
- 88% of executives increasing AI budgets in next 12 months specifically for agentic AI

**WellNexus relevance:** Platform already has 24+ agents (Coach, Sales Copilot, Reward Engine) — positioned to monetize the agent layer itself as RaaS.

---

## 2. Key AGI Capabilities for Commerce Platforms

Required for credible AGI RaaS in health commerce / MLM:

- **Multi-step planning** — autonomous cart recovery, distributor coaching sequences (≥5 steps without human input)
- **Tool-use / function calling** — call APIs (wallet, orders, CRM), read PDFs, execute code
- **Memory/context persistence** — cross-session user memory for personalized health journeys
- **Multi-modal input** — image (product photos, health scans), voice (Vietnamese coaching)
- **Self-improving** — agent refines its own prompts from outcome feedback (A/B via reward engine)
- **Reasoning chains** — CoT / extended thinking for complex MLM commission disputes
- **Agent-to-agent communication** — Sales Copilot delegates to Reward Engine, both to Coach

WellNexus already implements: registry, supervisor orchestrator, intent classifier, LLM router (litellm pattern), memory store (mem0 pattern), message queue (qstash pattern). Missing: true cross-session memory persistence, multi-modal pipeline, outcome-driven self-improvement loop.

---

## 3. AGI Framework Comparison

| Framework | Architecture | TS Support | Production Ready | Best For |
|---|---|---|---|---|
| **LangGraph** | Graph-based DAG | JS/TS ✅ | v1.0 late 2025, yes | Complex stateful flows, precise control |
| **CrewAI** | Role-based declarative | Python primarily | Yes, popular | Team-of-agents workflows, quick setup |
| **AutoGen** (Microsoft) | Conversational multi-agent | Python, some TS | Yes | Group decision-making, async |
| **Vercel AI SDK** | Streaming-first, tool-use | TS ✅ native | Yes (prod) | React/Next.js apps, streaming UX |
| **OpenAI Assistants API** | Thread-based, tools | TS ✅ | Yes | Managed state, file search, code interp |

**Recommendation for WellNexus:** Vercel AI SDK (already used via `agent-vercel-ai-adapter.ts`) + LangGraph for complex multi-agent coordination. Do NOT rewrite — extend existing `vibe-agent` layer.

---

## 4. Revenue Models for AGI RaaS

**Salesforce AgentForce 2025 pricing evolution (reference model):**
- Phase 1: $2/conversation
- Phase 2 (May 2025): $0.10/action (Flex Credits, 20 credits/action, $500 for 100K credits)
- Phase 3: $125–$550/user/month unlimited
- Result: $900M AI+Data Cloud revenue in 6 months, 8,000+ customers

**Revenue model matrix:**

| Model | Example | Fit for WellNexus |
|---|---|---|
| Per-agent seat | $X/agent/month | Distributor subscription add-on |
| Usage-based (per action) | $0.05–$0.10/action | Coach sessions, copilot calls |
| Outcome-based | % of commission earned via agent | Reward Engine — pay only if agent-driven sale |
| Freemium → Pro | 3 free agent sessions/month | Lead gen → conversion |
| Agent marketplace | Sell custom agents to other distributors | Platform network effect |

**Recommended for WellNexus:** Outcome-based as primary (% of agent-assisted commissions) + usage-based fallback (token consumption). This aligns with existing HealthFi Wallet and commission engine.

---

## 5. Competitive Landscape

| Player | Offering | Pricing Signal | Threat Level |
|---|---|---|---|
| **Salesforce AgentForce** | CRM-native agents | $0.10/action | Low (enterprise, not health MLM) |
| **Microsoft Copilot Studio** | Low-code agent builder | $200/agent/month | Medium (Teams integration) |
| **Google CCAI** | Contact center agents | Usage-based | Low (call center focus) |
| **AWS Bedrock Agents** | Cloud-native multi-agent | Token-based | Medium (infra) |
| **Relevance AI** | No-code agent platform | Seat-based | High (similar B2B) |
| **Intercom Fin** | CS agent | $0.99/resolution | Medium (CS only) |
| **HubSpot Breeze** | Marketing agents | Bundled | Low |
| **OpenAI Operator** | Browser automation agent | API consumption | Medium |

**White space for WellNexus:** No player targets health commerce + MLM + Vietnamese market with culturally-adapted AGI agents. First-mover advantage significant.

---

## 6. Risks and Challenges

| Risk | Severity | Mitigation |
|---|---|---|
| **Hallucination** (health claims) | CRITICAL | RAG over verified product DB only; no free-form health advice; NCBI/FDA citation required |
| **Inference cost** | HIGH | litellm router (already in codebase) for model fallback; cache common responses |
| **Latency** | HIGH | Streaming already implemented (Vercel AI SDK); target <2s TTFB |
| **Regulatory (health data)** | HIGH | PDPA Vietnam compliance; no PII in agent memory unless encrypted |
| **Agent loops / infinite retry** | MEDIUM | Max iteration cap + supervisor watchdog (already: `agent-health-monitor.ts`) |
| **Distributor misuse** | MEDIUM | Rate limiting (already: `rate-limiter.ts`); audit log (already implemented) |
| **Model dependency** | MEDIUM | Multi-model fallback via LLM router; avoid single-provider lock-in |
| **Cost unpredictability** | MEDIUM | Hard spend caps per user/tier; usage dashboard for distributors |

**Health-specific hallucination risk:** PMC study (2025) confirms AI health assistants must incorporate "strong error-checking" and "multilingual support." WellNexus needs strict output validation schema for any health claim generated by agents.

---

## 7. WellNexus AGI RaaS Opportunities (Synthesis)

1. **Monetize Agent Layer:** Wrap 24+ agents into subscription add-ons — "Pro Agent Pack" at $15–$30/distributor/month
2. **Outcome-based Commission:** 1–3% of agent-assisted sales routed through HealthFi Wallet
3. **Agent Marketplace:** Let top distributors create/sell custom coaching agents; platform takes 20% cut
4. **B2B2C:** License WellNexus Agent-OS to other Vietnamese health brands as white-label RaaS
5. **Immediate:** Add cross-session memory (mem0 pattern already scaffolded) and outcome tracking to enable outcome-based billing

---

## Unresolved Questions

1. What is current inference cost per agent session on WellNexus? (needed to price outcome model profitably)
2. Does Vietnamese PDPA allow storing health conversation history in Supabase? Legal review needed.
3. Is `agent-memory-store-mem0-pattern.ts` actually wired to production or still scaffolding?
4. What % of current distributor revenue is agent-assisted vs. manual? (baseline for outcome pricing)
5. Is there budget/timeline for adding multi-modal (image input) to the health coach agent?

---

## Sources

- [AGI Market Report 2026–2035](https://www.insightaceanalytic.com/report/artificial-general-intelligence-agi-market/2720)
- [Agentic AI Stats 2026](https://onereach.ai/blog/agentic-ai-adoption-rates-roi-market-trends/)
- [AI-as-a-Service Market 2026](https://www.globenewswire.com/news-release/2026/01/29/3228900/0/en/Artificial-Intelligence-as-a-Service-Research-Report-2026-Global-Market-Size-Trends-Competitive-Analysis-Opportunities-and-Forecasts-2021-2025-2026-2031.html)
- [Salesforce AgentForce Pricing 2025](https://www.salesforce.com/agentforce/pricing/)
- [AgentForce Flex Credits](https://aquivalabs.com/blog/agentforce-pricing-gets-a-long-overdue-fix-flex-credits-are-now-live/)
- [SaaStr: 3 Agentforce Pricing Models](https://www.saastr.com/salesforce-now-has-3-pricing-models-for-agentforce-and-maybe-right-now-thats-the-way-to-do-it/)
- [AI Agent Framework Comparison — Langfuse](https://langfuse.com/blog/2025-03-19-ai-agent-comparison)
- [CrewAI vs LangGraph vs AutoGen — DataCamp](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen)
- [Open-Source AI Agent Frameworks 2026 — OpenAgents](https://openagents.org/blog/posts/2026-02-23-open-source-ai-agent-frameworks-compared)
- [AI in Healthcare 2025 — NCBI](https://www.ncbi.nlm.nih.gov/books/NBK613808/)
- [AGI Threat to Public Health — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12415933/)
- [Agentic AI for Healthcare — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2949953425000141)
- [Fortune Business: AGI Market](https://www.fortunebusinessinsights.com/artificial-general-intelligence-market-111187)
