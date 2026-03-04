# WellNexus - Open-Source RaaS Platform

> 🌟 Cảm ơn bạn đã quan tâm đến WellNexus - Nền tảng Retail-as-a-Service mã nguồn mở cho ngành health & wellness.

---

## 🎯 WellNexus là gì?

WellNexus là một nền tảng **Retail-as-a-Service (RaaS)** mã nguồn mở, được thiết kế đặc biệt cho các doanh nghiệp health & wellness tại Việt Nam.

### ✨ Tính năng nổi bật

| Tính năng | Mô tả |
|-----------|-------|
| 🛍️ **E-commerce Marketplace** | Sản phẩm, đơn hàng, thanh toán toàn diện |
| 💰 **MLM/Affiliate Commission** | Hệ thống hoa hồng 8 cấp (21-25%) |
| 🤖 **AI Agent-OS** | 24+ agents AI tự động (Health Coach, Sales Copilot) |
| 💎 **Subscription Tiers** | Free, Pro ($9/mo), Enterprise ($29/mo) |
| 🚩 **Feature Flags** | Kiểm soát truy cập chi tiết |
| 📊 **Usage Metering** | Theo dõi API calls, AI usage, storage |
| 🌐 **Multi-Org Support** | White-label agency deployments |

---

## 🚀 Bắt đầu nhanh

### Yêu cầu hệ thống

- Node.js 18+ và npm 9+
- Git
- Supabase account (free tier)
- Code editor (VS Code recommended)

### 1. Clone repository

```bash
git clone https://github.com/longtho638-jpg/Well.git
cd Well
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình environment

```bash
# Copy example env file
cp .env.example .env.local

# Chỉnh sửa .env.local với thông tin của bạn
```

**Biến môi trường BẮT BUỘC:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Lấy Supabase credentials:**
1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project (hoặc tạo mới)
3. Settings → API
4. Copy `Project URL` → `VITE_SUPABASE_URL`
5. Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 4. Setup database

```bash
# Chạy migrations
npx supabase db push
```

### 5. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173) trong trình duyệt.

### 6. Chạy tests

```bash
# Chạy tất cả tests
npm run test:run

# Chạy với coverage
npm run test:coverage

# Chạy trong watch mode (dev)
npm run test
```

### 7. Build production

```bash
npm run build
npm run preview
```

---

## 💰 Pricing & Plans

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

👉 **Xem chi tiết:** [Pricing Documentation](./docs/PRICING.md)

---

## 🏗️ Kiến trúc tổng quan

```
src/
├── agents/         # 24+ AI Agents (Health Coach, Sales Copilot, etc.)
├── components/     # React UI components (Aura Elite design)
├── hooks/          # Custom hooks (useAuth, useWallet, useAgentOS)
├── pages/          # Dashboard, Marketplace, Admin, Pricing
├── services/       # Business logic (subscription, wallet, referral)
├── utils/          # Tokenomics, Tax, Format utilities
└── __tests__/      # 440+ unit tests
```

### Database Schema (Supabase)

| Table | RLS | Mục đích |
|-------|-----|----------|
| `users` | ✅ | User profiles & balances |
| `products` | ✅ | Marketplace products |
| `transactions` | ✅ | SHOP/GROW transfers |
| `team_members` | ✅ | MLM network hierarchy |
| `agent_logs` | ✅ | AI agent activity logs |
| `subscription_plans` | ✅ | Plan definitions |
| `user_subscriptions` | ✅ | User subscriptions |
| `organizations` | ✅ | Multi-org layer |
| `feature_flags` | ✅ | Feature gating |
| `usage_metrics` | ✅ | Usage tracking |

---

## 💎 Commission System (Bee 2.0)

| Rank | Level | Rate |
|------|-------|------|
| THIEN_LONG → DAI_SU | 1-6 | 25% |
| KHOI_NGHIEP | 7 | 25% |
| CTV | 8 | 21% |

---

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng!

### Cách đóng góp

1. **Fork repository** này
2. **Tạo feature branch:** `git checkout -b feature/my-feature`
3. **Commit changes:** `git commit -m "feat: add new feature"`
4. **Push to branch:** `git push origin feature/my-feature`
5. **Mở Pull Request**

### Tài liệu hữu ích

- [Contributing Guide](./CONTRIBUTING.md) - Hướng dẫn chi tiết
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Quy tắc ứng xử
- [Good First Issues](https://github.com/longtho638-jpg/Well/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) - Issues cho người mới

### Yêu cầu code quality

```bash
# Build phải thành công
npm run build     # 0 TypeScript errors

# Tests phải pass
npm run test:run  # Tất cả tests phải pass

# Không tech debt
grep -r ": any" src    # = 0 kết quả
grep -r "TODO\|FIXME" src  # = 0 kết quả
```

---

## 📧 Email Setup (Resend Integration)

WellNexus sử dụng **Resend** cho transactional emails (100 emails/day free tier).

### Cấu hình

1. **Lấy Resend API Key** tại [resend.com](https://resend.com)
2. **Cấu hình Supabase Edge Function:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. **Test email:**
   ```typescript
   import { emailService } from './src/services/email-service-client-side-trigger';
   await emailService.sendWelcome('user@example.com', {
     userName: 'Test User',
     userEmail: 'user@example.com',
   });
   ```

---

## 🛡️ Security

- ✅ Không secrets trong codebase
- ✅ Row-Level Security (RLS) enabled
- ✅ Input validation với Zod
- ✅ XSS prevention (React auto-escape)
- ✅ CORS configured properly
- ✅ HTTPS enforced

**Báo cáo security issues:** [security@wellnexus.vn](mailto:security@wellnexus.vn)

---

## 📊 Audit Status (2026-03-04)

| Check | Status |
|-------|--------|
| **Production** | ✅ LIVE ([wellnexus.vn](https://wellnexus.vn)) |
| **Unit Tests** | ✅ 440 passed |
| **TypeScript** | ✅ 5.9.3 Strict (0 errors) |
| **React** | ✅ v19.2.4 |
| **Vite** | ✅ v7.3.1 |
| **Build Time** | ✅ 6.74s |
| **Security Audit** | ✅ Clean |
| **Audit Score** | ✅ 97/100 |
| **Tech Debt** | ✅ Zero (`: any` = 0, `@ts-ignore` = 0) |
| **i18n** | ✅ 1598 keys (VI/EN symmetric) |

---

## 🔗 Tài liệu

| Loại | Link |
|------|------|
| 📘 **Documentation Hub** | [docs/README.md](./docs/README.md) |
| 🚀 **Getting Started** | [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) |
| 🏗️ **Architecture** | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| 💰 **Pricing** | [docs/PRICING.md](./docs/PRICING.md) |
| 📖 **API Reference** | [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) |
| 👥 **Contributing** | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| 📜 **License** | [LICENSE](./LICENSE) |

---

## 📄 License

WellNexus được phát hành theo [MIT License](./LICENSE).

```
Copyright (c) 2026 WellNexus Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- Lấy cảm hứng từ [Mekong-CLI](https://github.com/longtho638-jpg/mekong-cli) RaaS architecture
- Built với [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- Backend powered by [Supabase](https://supabase.com)
- AI agents powered by [Google Gemini](https://ai.google.dev/)

---

## 📧 Contact

| Mục | Liên hệ |
|-----|---------|
| 🌐 Website | [wellnexus.vn](https://wellnexus.vn) |
| 📧 General | support@wellnexus.vn |
| 💼 Sales | sales@wellnexus.vn |
| 🔒 Security | security@wellnexus.vn |
| 🐛 Issues | [GitHub Issues](https://github.com/longtho638-jpg/Well/issues) |
| 💬 Discussions | [GitHub Discussions](https://github.com/longtho638-jpg/Well/discussions) |

---

**Last Updated:** 2026-03-04 | **Version:** 3.0.0 (Open-Source RaaS) | **Status:** ✅ Production Ready
