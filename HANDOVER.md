# 🚀 WELLNEXUS PRODUCTION HANDOVER

**Ngày bàn giao:** 11/02/2026
**Phiên bản:** 2.4.0
**Trạng thái:** ✅ Production Ready (307+ Tests Passing)

---

## 1. TỔNG QUAN HỆ THỐNG

### Tech Stack
- **Frontend:** React 19.2.4 + Vite 7.3.1 + TypeScript 5.9.3 (Strict Mode)
- **Backend:** Supabase (Auth, Database, Edge Functions)
- **Deployment:** Vercel (https://wellnexus.vn)
- **CI/CD:** GitHub Actions (automated build, test, deploy)

### Core Features
- ✅ **307+ Tests** với 100% pass rate (30 test files)
- ✅ **TypeScript Strict Mode** - zero compilation errors
- ✅ **PWA Ready** - installable, offline support
- ✅ **i18n** - Vietnamese + English
- ✅ **E-commerce** - Products, Orders, Commission (8-level MLM)
- ✅ **Payment** - PayOS integration
- ✅ **Email** - Resend transactional emails

---

## 2. PRODUCTION ENVIRONMENT

### Required Environment Variables

**Frontend (Vercel):**
```env
# Supabase (Primary Backend)
VITE_SUPABASE_URL=https://jcbahdioqoepvoliplqy.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Admin Emails (comma-separated)
VITE_ADMIN_EMAILS=doanhnhancaotuan@gmail.com,billwill.mentor@gmail.com

# Optional: Sentry for error tracking
VITE_SENTRY_DSN=https://<your-dsn>@sentry.io/<project-id>

# Optional: PWA Push Notifications
VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
```

**Backend (Supabase Edge Functions Secrets):**
```bash
# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Payment Gateway
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key

# Webhook Security
WEBHOOK_SECRET=your-random-secret-string

# AI Features (optional)
GEMINI_API_KEY=your-gemini-api-key

# Push Notifications (optional)
VAPID_PRIVATE_KEY=your-vapid-private-key
```

**Set Supabase secrets via CLI:**
```bash
supabase secrets set RESEND_API_KEY="re_xxx"
supabase secrets set PAYOS_CLIENT_ID="client-id"
supabase secrets set PAYOS_API_KEY="api-key"
supabase secrets set PAYOS_CHECKSUM_KEY="checksum-key"
supabase secrets set WEBHOOK_SECRET="random-secret"
```

---

## 3. DEPLOYMENT PROTOCOL

### ✅ Vercel Deployment (Recommended)

**Auto-deploy từ GitHub:**
1. Push code lên `main` branch
2. GitHub Actions tự động chạy build + tests
3. Vercel tự động deploy sau khi CI pass
4. Production URL: https://wellnexus.vn

**Manual deploy (nếu cần):**
```bash
# ❌ KHÔNG dùng vercel --prod (vi phạm Rule #5)
# ✅ ĐÚNG: Push lên GitHub để trigger auto-deploy
git add .
git commit -m "feat: update production code"
git push origin main
```

### Verification Checklist (BẮT BUỘC)

Sau mỗi deployment, PHẢI verify:

```bash
# 1. CI/CD Status
gh run list -L 1 --json status,conclusion

# 2. Production HTTP Check
curl -sI https://wellnexus.vn | head -3  # Expect: HTTP 200

# 3. Browser Smoke Test
# Mở https://wellnexus.vn và verify:
# - Landing page loads
# - No console errors
# - i18n keys hiển thị đúng (không có raw keys)
# - Images/assets load correctly
```

**Report format:**
```
✅ CI/CD: GitHub Actions [success]
✅ Production: HTTP 200
✅ Browser: No console errors, i18n working
✅ Timestamp: [actual_time]
```

---

## 4. DATABASE SETUP (Supabase)

### Required Migrations

**Directory:** `supabase/migrations/` (18 migration files, Dec 2024 - Feb 2026)

**Tac dung:**
- Tao bang `users`, `products`, `orders`, `transactions`, `team_members`, `wallets`, `withdrawal_requests`
- Bat Row Level Security (RLS) cho tat ca bang
- Tao stored procedures cho referral tree (F1-F7)
- Bat Replication cho realtime updates
- Commission engine "The Bee" setup

**Cách chạy:**
```bash
# Option 1: Via Supabase CLI (recommended)
supabase db push

# Option 2: Manual via Dashboard
# 1. Mở Supabase Dashboard → SQL Editor → New Query
# 2. Copy nội dung từ supabase/migrations/20260113_recursive_referral.sql
# 3. Paste và Run
```

### Enable Realtime (BẮT BUỘC)

Để ví tự động cập nhật khi có transaction:

```sql
-- Chạy trong Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
```

Hoặc dùng Dashboard:
1. Database → Replication
2. Chọn bảng `users` và `transactions`
3. Enable Replication

---

## 5. ADMIN OPERATIONS

### A. Quản trị Users

**Admin Panel:** `/admin/network` (requires admin login)

**Add new user:**
- Email PHẢI unique
- Password tối thiểu 8 ký tự
- Referral code tự động generate

**Check admin status:**
```sql
SELECT email, is_admin FROM users WHERE is_admin = true;
```

### B. Commission Management

**8-Level MLM Structure:**
- Level 1-6: 25% commission (THIEN_LONG → DAI_SU)
- Level 7: 25% commission (KHOI_NGHIEP)
- Level 8: 21% commission (CTV)

**View commission history:**
```sql
SELECT * FROM transactions
WHERE type IN ('commission', 'sponsor_bonus')
ORDER BY created_at DESC
LIMIT 50;
```

### C. Payment Processing (PayOS)

**Webhook URL:** `https://jcbahdioqoepvoliplqy.supabase.co/functions/v1/payos-webhook`

**Test webhook:**
```bash
curl -X POST https://jcbahdioqoepvoliplqy.supabase.co/functions/v1/payos-webhook \
  -H "Content-Type: application/json" \
  -d '{"orderCode": "TEST123", "status": "PAID"}'
```

**Monitor webhooks:**
- Supabase Dashboard → Edge Functions → Logs
- Filter by function: `payos-webhook`

---

## 6. TROUBLESHOOTING

### Common Issues

**1. i18n raw keys hiển thị trên production**

**Triệu chứng:** Thấy `landing.hero.title` thay vì text thực
**Nguyên nhân:** Key không tồn tại trong `vi.ts` hoặc `en.ts`
**Fix:**
```bash
# Verify tất cả t() calls có key trong locales
npm run i18n:validate  # (nếu có script)

# Hoặc manual grep:
grep -roh "t('[^']*')" src/ | sort -u > /tmp/used_keys.txt
# Check từng key trong vi.ts và en.ts
```

**2. Build fails với TypeScript errors**

```bash
# Kiểm tra lỗi
npm run build

# Fix và verify
npx tsc --noEmit
```

**3. Tests fail sau deploy**

```bash
# Chạy local tests
npm run test:run

# Check specific test file
npm run test -- src/__tests__/specific-test.test.tsx
```

**4. Supabase connection errors**

- Verify `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` đúng
- Check Supabase Dashboard → Settings → API
- Verify RLS policies không block admin users

---

## 7. MONITORING & ALERTS

### Error Tracking (Sentry - Optional)

```typescript
// Auto-initialized trong src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

**View errors:** https://sentry.io/organizations/wellnexus/issues/

### Performance Monitoring

**Lighthouse CI:** Tự động chạy trên mỗi PR
**Web Vitals:** Track via Vercel Analytics

**Metrics:**
- LCP (Largest Contentful Paint): < 2.5s ✅
- FID (First Input Delay): < 100ms ✅
- CLS (Cumulative Layout Shift): < 0.1 ✅

---

## 8. BACKUP & DISASTER RECOVERY

### Database Backups

**Supabase Auto-backup:** Daily (retained 7 days on free tier)

**Manual backup:**
```bash
# Export database
pg_dump "postgresql://postgres:[PASSWORD]@db.jcbahdioqoepvoliplqy.supabase.co:5432/postgres" > backup.sql

# Restore (if needed)
psql "postgresql://postgres:[PASSWORD]@db.jcbahdioqoepvoliplqy.supabase.co:5432/postgres" < backup.sql
```

### Code Repository

**Primary:** GitHub `longtho638-jpg/Well` (main branch)
**Backup:** Git history + Vercel deployment snapshots

---

## 9. PRODUCTION READINESS CHECKLIST

- [x] ✅ 307+ tests passing (30 test files)
- [x] ✅ TypeScript strict mode (0 errors)
- [x] ✅ Build time < 5s
- [x] ✅ CI/CD pipeline automated
- [x] ✅ Vercel deployment configured
- [x] ✅ Supabase migrations applied
- [x] ✅ RLS policies enabled
- [x] ✅ Environment variables set
- [x] ✅ Admin users created
- [x] ✅ PayOS integration tested
- [x] ✅ Email service configured (Resend)
- [x] ✅ i18n Vietnamese + English
- [x] ✅ PWA manifest configured
- [x] ✅ Security headers (CSP, HSTS)
- [x] ✅ Error tracking (Sentry - optional)

---

## 10. CONTACT & SUPPORT

**Project Owner:** doanhnhancaotuan@gmail.com
**Tech Lead:** billwill.mentor@gmail.com

**Documentation:**
- Main: `./README.md`
- Architecture: `./docs/system-architecture.md`
- API Spec: `./docs/API_SPECIFICATION.md`
- Deployment: `./docs/DEPLOYMENT_GUIDE.md`

**Resources:**
- Production: https://wellnexus.vn
- Supabase Dashboard: https://supabase.com/dashboard/project/jcbahdioqoepvoliplqy
- GitHub Repo: https://github.com/longtho638-jpg/Well
- Vercel Dashboard: https://vercel.com/wellnexus

---

*Last Updated: 2026-02-11*
*Generated by WellNexus Engineering Team*
