# WellNexus RaaS Health Platform: Agentic HealthFi OS

> **Founder Handover Ready** | 110 Tests ✅ | Build 6.74s ✅ | Audit 97/100 ✅ | PWA Ready 📱 | CI/CD ✅

An open-source Hybrid Community Commerce platform for Vietnam, powered by a robust Agentic Operating System (Agent-OS) and Supabase backend. Built for RaaS (Retail-as-a-Service) health products.

## 🏆 Audit Status (2026-03-03)

| Check | Status |
|-------|--------|
| CI Pipeline | ✅ Passing |
| Unit Tests | ✅ 110 passed |
| TypeScript | ✅ 5.9.3 Strict (0 errors) |
| React | ✅ v19.2.4 |
| Vite | ✅ v7.3.1 |
| Build Time | ✅ 6.74s |
| Security Audit | ✅ Clean |
| Audit Score | ✅ 97/100 |
| Tech Debt | ✅ Zero (`: any` = 0, `@ts-ignore` = 0) |
| i18n | ✅ 1592 keys (VI/EN symmetric) |
| SOPs | ✅ 15 C-suite playbooks |

## 🔄 CI/CD Pipeline

Automated quality gates on every push and pull request:

- ✅ **Continuous Integration** - npm ci, lint, test, build
- ✅ **Security Scanning** - npm audit (high severity check)
- ✅ **Performance Monitoring** - Lighthouse CI on PRs
- ✅ **Build Artifacts** - Automated dist/ uploads
- 🚀 **Auto Deploy** - Vercel Git integration to https://wellnexus.vn

**Status:** All workflows passing | Average build: 1m25s | [View runs →](https://github.com/longtho638-jpg/Well/actions)

## ✨ Key Features

- 🤖 **Agent-OS** - 24+ AI agents (Coach, Sales Copilot, Reward Engine)
- ⚡ **AgencyOS Integration** - 85+ automation commands
- 🔍 **SEO Optimized** - Meta tags, Sitemap, Robots.txt, JSON-LD
- ♿ **Accessible** - ARIA roles, Keyboard navigation support
- 🛍️ **Social Commerce** - MLM/Affiliate with 8-level commission (21–25%)
- 💰 **HealthFi Wallet** - Dual-token system (SHOP + GROW)
- 📱 **PWA Support** - Installable on mobile/desktop
- 🌙 **Dark/Light Theme** - Animated toggle with persistence
- ⚡ **Code Splitting** - Lazy loaded pages for fast initial load
- 💀 **Skeleton Loading** - Premium loading states
- ⚛️ **React 19 & Vite 7** - Latest frontend stack for maximum performance
- 🔒 **Type Safe** - 100% TypeScript Strict Mode compliance

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
# VITE_SUPABASE_URL=https://jcbahdioqoepvoliplqy.supabase.co
# VITE_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-dashboard>
```

**Get Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create new)
3. Go to Settings → API
4. Copy `Project URL` → `VITE_SUPABASE_URL`
5. Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

**Optional environment variables:**
```bash
# Admin emails (comma-separated)
VITE_ADMIN_EMAILS=your-email@example.com

# Error tracking (optional)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Note:** `GEMINI_API_KEY` and `RESEND_API_KEY` are managed server-side via Supabase Edge Functions Secrets (see [Email Setup](#-email-setup-resend-integration) section).

### 4. Database Setup

```bash
# Run migrations via Supabase CLI
npx supabase db push

# Or manually:
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy contents from supabase/migrations/20260113_recursive_referral.sql
# 3. Paste and Run
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

# Preview production build
npm run preview
```

**Build verification:**
- ✅ 0 TypeScript errors
- ✅ All tests pass
- ✅ Bundle size < 500KB (gzipped)
- ✅ Build time < 5s

## 📂 Project Structure

```
src/
├── agents/         # Agent-OS (24+ agents)
├── components/     # React UI components
├── hooks/          # useAuth, useWallet, useAgentOS
├── pages/          # Dashboard, Marketplace, Admin
├── utils/          # Tokenomics, Tax, Format
└── __tests__/      # 307+ tests (30 files)
```

## 🧪 Test Coverage

| Module | Tests |
|--------|-------|
| Commission Logic | 24 |
| Dashboard Pages | 26 |
| Admin Logic | 18 |
| Tokenomics | 14 |
| Affiliate Logic | 12 |
| Payment (PayOS) | 18 |
| UI Components | 24 |
| Referral Service | 15 |
| Others | 156 |
| **Total** | **307+** |

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

## 📧 Email Setup (Resend Integration)

WellNexus uses **Resend** for transactional emails with a generous free tier (100 emails/day, 3,000/month).

### Email Templates
- ✅ Welcome email (new user signup)
- ✅ Order confirmation (order completed)
- ✅ Commission earned (direct + F1 sponsor bonus)
- ✅ Rank upgrade celebration

### Setup Instructions

1. **Get Resend API Key**
   - Sign up at [resend.com](https://resend.com)
   - Navigate to API Keys page
   - Create new API key (starts with `re_`)

2. **Configure Supabase Edge Function**
   ```bash
   # Set secret in Supabase Dashboard
   # Go to: Project Settings > Edge Functions > Secrets
   # Add: RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

   # Or via Supabase CLI:
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Verify Domain (Production)**
   - Add your domain to Resend
   - Add DNS records (SPF, DKIM, DMARC)
   - For testing, use default `onboarding@resend.dev`

4. **Test Email Sending**
   ```typescript
   import { emailService } from './src/services/email-service-client-side-trigger';

   // Send test welcome email
   await emailService.sendWelcome('user@example.com', {
     userName: 'Test User',
     userEmail: 'user@example.com',
   });
   ```

### Email Triggers
Emails are automatically sent when:
- ✅ User completes order → Commission earned notification
- ✅ Sponsor earns F1 bonus → F1 sponsor bonus notification
- ✅ User achieves rank upgrade → Celebration email with stats

All email sending is handled by Supabase Edge Function `send-email` with error isolation (email failures don't break reward processing).

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

**Last Updated:** 2026-02-11 | **Version:** 2.4.0 | **Status:** ✅ Production Ready