# WellNexus 2.0: Agentic HealthFi OS

> **Go-Live Ready** | 230 Tests ✅ | Build 3.4s ✅ | PWA Ready 📱 | CI/CD ✅

A Hybrid Community Commerce platform for Vietnam, powered by a robust Agentic Operating System (Agent-OS) and Supabase backend.

## 🏆 Audit Status (2026-02-02)

| Check | Status |
|-------|--------|
| CI Pipeline | ✅ Passing (1m25s) |
| Unit Tests | ✅ 230/230 |
| TypeScript | ✅ 5.7+ Strict |
| React | ✅ v19.0 |
| Vite | ✅ v7.0 |
| Build Time | ✅ 3.2s |
| Security Audit | ✅ npm audit |
| Best Practices | ✅ 100/100 |

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

```bash
# Install
npm install

# Environment
cp .env.example .env.local
# Add: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# Note: GEMINI_API_KEY and RESEND_API_KEY are managed via Supabase Edge Functions (vault)
# See "Email Setup" section below for RESEND_API_KEY configuration

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

**Last Updated:** 2026-01-30 | **Version:** 2.1-seed | **Status:** ✅ Production Ready