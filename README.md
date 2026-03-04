# WellNexus RaaS — Open-Source Retail-as-a-Service Platform

> **Build once, deploy anywhere.** WellNexus is a community-driven, open-source RaaS (Retail-as-a-Service) platform for health & wellness products, powered by AI agents and a flexible subscription model.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Production](https://img.shields.io/badge/production-LIVE-green)](https://wellnexus.vn)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3.1-646cff)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/tests-440%20passed-brightgreen)](./__tests__/)
[![Audit](https://img.shields.io/badge/audit-97/100-success)](./docs/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-blue.svg)](./CONTRIBUTING.md)
[![Status](https://img.shields.io/badge/status-ready%20to%20ship-brightgreen)](./docs/OPEN_SOURCE_SUMMARY.md)

🌐 **Production:** [wellnexus.vn](https://wellnexus.vn) | 📚 **Docs:** [Documentation](./docs/) | 💬 **Discussions:** [GitHub Discussions](https://github.com/longtho638-jpg/Well/discussions) | 🤝 **Contribute:** [Contributing Guide](./CONTRIBUTING.md)

---

## 💡 What is WellNexus RaaS?

WellNexus is an **open-source Retail-as-a-Service (RaaS)** platform inspired by Mekong-CLI, designed for health & wellness businesses in Vietnam. It combines:

- 🛍️ **E-commerce marketplace** with product listings, orders, and payments
- 💰 **MLM/Affiliate commission system** (8-level, 21-25% rates)
- 🤖 **AI Agent-OS** with 24+ autonomous agents (Health Coach, Sales Copilot, Reward Engine)
- 💎 **Subscription tiers** — Free, Pro ($9/mo), Enterprise ($29/mo)
- 🚩 **Feature flags** for granular access control
- 📊 **Usage metering** for API calls, AI usage, and storage
- 🌐 **Multi-org support** for white-label agency deployments

---

## 🎯 Pricing & Plans

| Feature | **Free** | **Pro** | **Enterprise** |
|---------|----------|---------|----------------|
| **Price** | $0/mo | $9/mo | $29/mo |
| **Network Members** | 50 | 1,000 | 5,000 |
| **AI Calls/mo** | 100 | 1,000 | 10,000 |
| **API Calls/mo** | 1,000 | 10,000 | 100,000 |
| **Storage** | 100 MB | 1 GB | 10 GB |
| **Email Sends/mo** | 100 | 1,000 | 10,000 |
| **Dashboard & Marketplace** | ✅ | ✅ | ✅ |
| **8-Level Commission** | ✅ | ✅ | ✅ |
| **Health Coach Agent** | ✅ | ✅ | ✅ |
| **AI Copilot** | ❌ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ✅ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ |
| **White-Label Branding** | ❌ | ❌ | ✅ |
| **Multi-Network** | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **Dedicated Support** | ❌ | ❌ | ✅ |

👉 **Upgrade:** Visit [Dashboard → Subscription](https://wellnexus.vn/dashboard/subscription) or see [Pricing Page](./docs/PRICING.md) for details.

---

## 🏆 Audit Status (2026-03-04)

| Check | Status |
|-------|--------|
| **Production** | ✅ LIVE ([wellnexus.vn](https://wellnexus.vn) — HTTP 200) |
| **Unit Tests** | ✅ 440 passed (local) |
| **TypeScript** | ✅ 5.9.3 Strict (0 errors) |
| **React** | ✅ v19.2.4 |
| **Vite** | ✅ v7.3.1 |
| **Build Time** | ✅ 6.74s |
| **Security Audit** | ✅ Clean |
| **Audit Score** | ✅ 97/100 |
| **Tech Debt** | ✅ Zero (`: any` = 0, `@ts-ignore` = 0) |
| **i18n** | ✅ 1598 keys (VI/EN symmetric) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account (free tier works)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/longtho638-jpg/Well.git
cd Well
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add REQUIRED variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Get Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create new)
3. Settings → API
4. Copy `Project URL` → `VITE_SUPABASE_URL`
5. Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 4. Database Setup

```bash
# Run migrations via Supabase CLI
npx supabase db push
```

### 5. Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Run Tests

```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run in watch mode (dev)
npm run test
```

### 7. Build for Production

```bash
npm run build
npm run preview
```

---

## 📂 Project Structure

```
src/
├── agents/         # Agent-OS (24+ AI agents)
├── components/     # React UI components
├── hooks/          # useAuth, useWallet, useAgentOS
├── pages/          # Dashboard, Marketplace, Admin, Pricing
├── services/       # Business logic (subscription, wallet, referral)
├── utils/          # Tokenomics, Tax, Format
└── __tests__/      # 440+ tests
```

---

## 🗄️ Database Schema

| Table | RLS | Purpose |
|-------|-----|---------|
| `users` | ✅ | User profiles & balances |
| `products` | ✅ | Marketplace products |
| `transactions` | ✅ | SHOP/GROW transfers |
| `team_members` | ✅ | MLM network |
| `agent_logs` | ✅ | AI agent activity |
| `subscription_plans` | ✅ | Plan definitions |
| `user_subscriptions` | ✅ | User subscriptions |
| `organizations` | ✅ | Multi-org layer |
| `feature_flags` | ✅ | Feature gating |
| `usage_metrics` | ✅ | Usage tracking |

---

## 💰 Commission System (Bee 2.0)

| Rank | Level | Rate |
|------|-------|------|
| THIEN_LONG → DAI_SU | 1-6 | 25% |
| KHOI_NGHIEP | 7 | 25% |
| CTV | 8 | 21% |

---

## 🤝 Contributing

We welcome contributions from the community! See our [Contributing Guide](./CONTRIBUTING.md) for details.

```bash
# Ensure builds pass
npm run build     # 0 errors required
npm run test:run  # All tests must pass
```

### Good First Issues

Looking for a place to start? Check out our [good first issues](https://github.com/longtho638-jpg/Well/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

### Open-Source Documentation

- [**Open-Source Audit Report**](./docs/OPEN_SOURCE_AUDIT.md) — 100/100 readiness score
- [**Open-Source Launch Guide**](./docs/OPEN_SOURCE_LAUNCH.md) — Templates & timelines
- [**Quick Summary**](./docs/OPEN_SOURCE_SUMMARY.md) — 1.5 giờ để launch

---

## 📧 Email Setup (Resend Integration)

WellNexus uses **Resend** for transactional emails (100 emails/day free tier).

### Setup Instructions

1. **Get Resend API Key** at [resend.com](https://resend.com)
2. **Configure Supabase Edge Function:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. **Test Email Sending:**
   ```typescript
   import { emailService } from './src/services/email-service-client-side-trigger';
   await emailService.sendWelcome('user@example.com', {
     userName: 'Test User',
     userEmail: 'user@example.com',
   });
   ```

---

## 📝 Documentation

- [**Getting Started**](./docs/GETTING_STARTED.md) — Setup guide for new users
- [**API Reference**](./docs/API_REFERENCE.md) — REST API documentation
- [**Architecture**](./docs/ARCHITECTURE.md) — System design and diagrams
- [**Contributing**](./CONTRIBUTING.md) — How to contribute
- [**Code of Conduct**](./CODE_OF_CONDUCT.md) — Community guidelines
- [**Pricing**](./docs/PRICING.md) — Plan comparison and FAQs
- [**Feature Flags**](./docs/FEATURE_FLAGS.md) — How to use feature gating
- [**AgencyOS Integration**](./AGENCYOS_INTEGRATION.md) — 85+ automation commands
- [**Design System**](./DESIGN_SYSTEM.md) — UI guidelines

---

## 🛡️ Security

- No secrets in codebase
- Row-Level Security (RLS) enabled on all tables
- Input validation with Zod
- XSS prevention (React auto-escape)
- CORS properly configured

To report a security issue, please email [security@wellnexus.vn](mailto:security@wellnexus.vn) or see our [Security Policy](./SECURITY.md).

---

## 📄 License

WellNexus is released under the [MIT License](./LICENSE).

---

## 🙏 Acknowledgments

- Inspired by [Mekong-CLI](https://github.com/longtho638-jpg/mekong-cli) RaaS architecture
- Built with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- Backend powered by [Supabase](https://supabase.com)
- AI agents powered by [Google Gemini](https://ai.google.dev/)

---

**Last Updated:** 2026-03-04 | **Version:** 3.0.0 (Open-Source RaaS) | **Status:** ✅ Production Ready
