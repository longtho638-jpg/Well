# WellNexus CAIO SOPs — Quy Trinh AI & Tri Tue Nhan Tao

> SOPs cho CAIO (Chief AI Officer) — AI STRATEGY, AGENT-OS, DATA, ML OPS.
> Cap nhat: 2026-03-03

---

## MUC LUC

1. [AI Strategy](#1-ai-strategy)
2. [Agent-OS Management](#2-agent-os-management)
3. [Data Strategy](#3-data-strategy)
4. [AI Product Features](#4-ai-product-features)
5. [AI Ethics & Governance](#5-ai-ethics--governance)
6. [MLOps & Infrastructure](#6-mlops--infrastructure)
7. [KPI AI](#7-kpi-ai)

---

## 1. AI STRATEGY

### 1.1 AI vision

| Giai doan | Muc tieu | Timeline |
|-----------|----------|----------|
| Phase 1 | AI-assisted (Copilot, Coach) | ✅ Done |
| Phase 2 | AI-automated (Auto commission, recommendations) | Q2 2026 |
| Phase 3 | AI-autonomous (Self-optimizing platform) | Q4 2026 |
| Phase 4 | AI-first (Predictive health commerce) | 2027 |

### 1.2 AI use cases prioritization

| Use case | Impact | Effort | Priority |
|----------|--------|--------|----------|
| Health Coach (personalized) | Cao | Da xong | ✅ Done |
| Sales Copilot | Cao | Da xong | ✅ Done |
| AI Action Center | Trung binh | Da xong | ✅ Done |
| Smart recommendations | Cao | Trung binh | P1 |
| Predictive churn | Cao | Cao | P2 |
| Auto CS routing | Trung binh | Thap | P2 |
| Dynamic pricing | Cao | Cao | P3 |
| Fraud detection | Cao | Trung binh | P1 |

---

## 2. AGENT-OS MANAGEMENT

### 2.1 Agent inventory (24+ agents)

| Agent | Chuc nang | Status |
|-------|-----------|--------|
| Health Coach | Tu van suc khoe AI | ✅ Active |
| Sales Copilot | Ho tro ban hang | ✅ Active |
| Reward Engine | Tinh commission tu dong | ✅ Active |
| Content Writer | Tao noi dung | ✅ Active |
| Lead Hunter | Tim khach tiem nang | ✅ Active |
| Policy Engine | Quan ly chinh sach | Planned |
| Fraud Detector | Phat hien gian lan | Planned |
| Churn Predictor | Du doan mat khach | Planned |

### 2.2 Agent monitoring

| Metric | Cong cu | Nguong |
|--------|--------|--------|
| Response time | Agent logs | < 3s |
| Accuracy | User feedback | > 85% |
| Usage rate | Analytics | > 30% users |
| Error rate | Sentry | < 2% |
| Token cost | Provider dashboard | Budget monthly |

### 2.3 Agent development workflow

| Buoc | Hanh dong |
|------|-----------|
| 1 | Xac dinh use case + ROI |
| 2 | Chon provider (Gemini, Claude, OpenAI) |
| 3 | Design prompt + system instructions |
| 4 | Implement via Vercel AI SDK |
| 5 | Test: accuracy, latency, cost |
| 6 | A/B test voi users |
| 7 | Deploy + monitor |
| 8 | Iterate based on feedback |

---

## 3. DATA STRATEGY

### 3.1 Data sources

| Source | Data | Volume |
|-------|------|--------|
| User profiles | Demographics, preferences | Medium |
| Orders | Purchase history, AOV | High |
| Agent interactions | Conversations, feedback | High |
| Health quiz | Health goals, conditions | Medium |
| Network data | Referral tree, commission | High |
| Website analytics | Behavior, funnel | High |

### 3.2 Data pipeline

```
Sources → Supabase (PostgreSQL)
  → Views/Functions (aggregation)
  → API (Edge Functions)
  → AI Models (context)
  → Insights (dashboard)
```

### 3.3 Data quality checklist

| # | Kiem tra | Tan suat |
|---|---------|----------|
| 1 | Schema validation | Moi migration |
| 2 | RLS policies correct | Hang thang |
| 3 | No PII in logs | Hang tuan |
| 4 | Backup verified | Hang thang |
| 5 | Data freshness | Realtime monitoring |

---

## 4. AI PRODUCT FEATURES

### 4.1 Health Coach

| Aspect | Detail |
|--------|--------|
| Provider | Google AI (Gemini) |
| Input | User health quiz + chat |
| Output | Personalized health advice |
| Context | Product catalog, user history |
| Safety | No medical diagnosis, disclaimer |

### 4.2 Sales Copilot

| Aspect | Detail |
|--------|--------|
| Provider | Vercel AI SDK (multi) |
| Input | Partner query + context |
| Output | Sales tips, scripts, objection handling |
| Context | Commission data, network stats |
| Tone | Motivational, practical |

### 4.3 AGI Tool Registry

| Aspect | Detail |
|--------|--------|
| Architecture | Multi-provider routing |
| Providers | Google, Anthropic, OpenAI |
| Tools | 24+ registered agents |
| Orchestration | Agent-OS with task routing |

### 4.4 Planned features

| Feature | Description | Provider | ETA |
|---------|------------|----------|-----|
| Smart Recommendations | Product suggestions based on history | Embedding search | Q2 |
| Auto CS | AI-first customer support | Vercel AI SDK | Q3 |
| Predictive Analytics | Churn, LTV, demand forecasting | Custom ML | Q3 |
| Dynamic Pricing | AI-optimized pricing | Custom logic | Q4 |

---

## 5. AI ETHICS & GOVERNANCE

### 5.1 AI principles

| Principle | Implementation |
|-----------|---------------|
| Transparency | Users know when talking to AI |
| Safety | No medical diagnosis, health disclaimers |
| Privacy | No PII in prompts, data anonymization |
| Fairness | No bias in recommendations |
| Human oversight | Admin can review/override AI actions |

### 5.2 AI risk management

| Risk | Muc do | Giam thieu |
|------|--------|-----------|
| Hallucination | Trung binh | Grounding with real data |
| PII leakage | Cao | Strip PII before prompt |
| Bias in recommendations | Thap | Diverse training data |
| Over-reliance | Trung binh | Human-in-the-loop |
| Cost overrun | Trung binh | Token budget limits |

### 5.3 Responsible AI checklist

| # | Kiem tra | Truoc deploy |
|---|---------|--------------|
| 1 | AI outputs reviewed by human | ✅ |
| 2 | No PII in prompts | ✅ |
| 3 | Health disclaimer present | ✅ |
| 4 | Fallback when AI fails | ✅ |
| 5 | User can opt out | ✅ |
| 6 | Cost monitoring active | ✅ |

---

## 6. MLOPS & INFRASTRUCTURE

### 6.1 AI infrastructure

| Component | Provider | Cost |
|-----------|----------|------|
| LLM API | Google AI (Gemini) | Pay per token |
| AI SDK | Vercel AI SDK | Free (OSS) |
| Vector DB | Supabase pgvector | Included |
| Hosting | Vercel Edge | Included |
| Monitoring | Sentry + custom | Included |

### 6.2 Cost management

| Action | Muc tieu |
|--------|----------|
| Token budget per user/day | < 10K tokens |
| Cache common queries | Giam 40% API calls |
| Model selection | Dung model nho cho task don gian |
| Batch processing | Gom requests khi co the |
| Monitor daily spend | Alert khi > 120% budget |

### 6.3 Model evaluation

| Metric | Cach do | Target |
|--------|---------|--------|
| Accuracy | User feedback thumbs up/down | > 85% |
| Latency | Time to first token | < 1s |
| Cost per query | Token cost / queries | < 500 VND |
| User satisfaction | Survey | > 4.0/5 |

---

## 7. KPI AI

| KPI | Muc tieu |
|-----|----------|
| AI feature adoption | > 40% active users |
| Health Coach sessions/user/month | > 3 |
| Copilot query success rate | > 85% |
| AI-driven revenue lift | > 15% |
| AI cost / revenue | < 5% |
| Agent uptime | > 99% |
| User satisfaction with AI | > 4.0/5 |

---

## PHU LUC

| Tai lieu | File |
|----------|------|
| CTO SOPs | `docs/cto-sops.md` |
| Agent API | `docs/AGENT_API.md` |
| System Architecture | `docs/system-architecture.md` |
| All SOPs | `docs/*-sops.md` |
