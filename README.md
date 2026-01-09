# WellNexus 2.0: Agentic HealthFi OS

> **Go-Live Ready** | 196 Tests ✅ | 0 Errors ✅ | Founder Handoff Complete

A Hybrid Community Commerce platform for Vietnam, powered by a robust Agentic Operating System (Agent-OS) and Supabase backend.

## 🏆 Audit Status (2026-01-08)

| Check | Status |
|-------|--------|
| Unit Tests | ✅ 196/196 |
| TypeScript | ✅ 0 errors |
| Security | ✅ 0 vulnerabilities |
| Database | ✅ 11 migrations |

## ✨ Key Features

- 🤖 **Agent-OS** - 24+ AI agents (Coach, Sales Copilot, Reward Engine, Compliance)
- ⚡ **AgencyOS Integration** - 85+ automation commands
- 🛍️ **Social Commerce** - MLM/Affiliate with 8-level commission (21–25%)
- 💰 **HealthFi Wallet** - Dual-token system (SHOP + GROW) with tax compliance
- 📊 **Agent Dashboard** - Real-time AI performance monitoring
- ☁️ **Supabase Backend** - Postgres, Auth, RLS policies

## 🚀 Quick Start

```bash
# Install
npm install

# Environment
cp .env.example .env.local
# Add: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY

# Development
npm run dev

# Tests
npm run test:run

# Build
npm run build
```

## 📂 Project Structure

```
src/
├── agents/         # Agent-OS (24+ agents)
├── components/     # React UI components
├── hooks/          # useAuth, useWallet, useAgentOS
├── pages/          # Dashboard, Marketplace, Admin
├── utils/          # Tokenomics, Tax, Format
└── __tests__/      # 196 tests (17 files)
```

## 🧪 Test Coverage

| Module | Tests |
|--------|-------|
| Commission Logic | 24 |
| Dashboard Pages | 26 |
| Admin Logic | 18 |
| Tokenomics | 14 |
| Affiliate Logic | 12 |
| Others | 102 |
| **Total** | **196** |

## 🗄️ Database Schema

| Table | RLS | Purpose |
|-------|-----|---------|
| users | ✅ | User profiles & balances |
| products | ✅ | Marketplace products |
| transactions | ✅ | SHOP/GROW transfers |
| team_members | ✅ | MLM network |
| agent_logs | ✅ | AI agent activity |

## 💰 Commission System (Bee 2.0)

| Rank | Level | Rate |
|------|-------|------|
| THIEN_LONG → DAI_SU | 1-6 | 25% |
| KHOI_NGHIEP | 7 | 25% |
| CTV | 8 | 21% |

## 📝 Documentation

- [AGENCYOS_INTEGRATION.md](./AGENCYOS_INTEGRATION.md) - 85+ Commands
- [BIZ_PLAN_2026.md](./BIZ_PLAN_2026.md) - Vision & Roadmap
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - UI Guidelines

## 🤝 Contributing

```bash
# Ensure builds pass
npm run build     # 0 errors required
npm run test:run  # All tests must pass
```

---

**Last Updated:** 2026-01-08 | **Version:** 2.0-seed | **Status:** ✅ Production Ready