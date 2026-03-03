# WellNexus — Huong Dan Chuyen Giao Access Cho Founder

> Checklist chuyen giao quyen truy cap toan bo he thong.
> Founder thuc hien TUNG BUOC, danh dau ✅ khi xong.
> Cap nhat: 2026-03-03

---

## 1. GITHUB (Source Code)

| # | Hanh dong | Cach lam |
|---|-----------|----------|
| 1 | Dang nhap GitHub | https://github.com/login |
| 2 | Truy cap repo | https://github.com/longtho638-jpg/Well |
| 3 | Kiem tra quyen | Settings → Collaborators → phai la **Admin** |
| 4 | Tao Personal Access Token | Settings → Developer → Personal Access Tokens → Generate |
| 5 | Clone repo | `git clone https://github.com/longtho638-jpg/Well.git` |
| 6 | Verify | `cd Well && pnpm install && pnpm build` |

**Yeu cau:** Admin role de quan ly branches, secrets, Actions.

---

## 2. SUPABASE (Database + Auth + Edge Functions)

| # | Hanh dong | Cach lam |
|---|-----------|----------|
| 1 | Dang nhap | https://supabase.com/dashboard |
| 2 | Chon project | `jcbahdioqoepvoliplqy` |
| 3 | Kiem tra quyen | Settings → Team → phai la **Owner** |
| 4 | Lay API Keys | Settings → API → Copy `URL` + `anon key` |
| 5 | Kiem tra Edge Functions | Edge Functions tab → xem trang thai |
| 6 | Kiem tra RLS | Authentication → Policies → verify enabled |
| 7 | Backup | Settings → Database → Backups → verify schedule |

**Secrets can set (Edge Functions):**
```bash
supabase secrets set GEMINI_API_KEY="..."
supabase secrets set RESEND_API_KEY="..."
supabase secrets set PAYOS_CLIENT_ID="..."
supabase secrets set PAYOS_API_KEY="..."
supabase secrets set PAYOS_CHECKSUM_KEY="..."
supabase secrets set WEBHOOK_SECRET="..."
```

---

## 3. VERCEL (Hosting + Deploy)

| # | Hanh dong | Cach lam |
|---|-----------|----------|
| 1 | Dang nhap | https://vercel.com |
| 2 | Chon project | WellNexus (wellnexus.vn) |
| 3 | Kiem tra quyen | Settings → Team → phai la **Owner** |
| 4 | Kiem tra domain | Settings → Domains → `wellnexus.vn` |
| 5 | Kiem tra env vars | Settings → Environment Variables |
| 6 | Kiem tra deploy | Deployments tab → latest = Production |
| 7 | Kiem tra analytics | Analytics tab → traffic data |

**Deploy flow:** `git push origin main` → Vercel auto-deploy.

---

## 4. SENTRY (Error Monitoring)

| # | Hanh dong | Cach lam |
|---|-----------|----------|
| 1 | Dang nhap | https://sentry.io |
| 2 | Chon project | WellNexus |
| 3 | Kiem tra DSN | Settings → Client Keys → DSN |
| 4 | Kiem tra alerts | Alerts → verify rules configured |
| 5 | Kiem tra source maps | Settings → Source Maps → verify uploaded |

**Free tier:** 10,000 events/month.

---

## 5. PAYOS (Payment Gateway)

| # | Hanh dong | Cach lam |
|---|-----------|----------|
| 1 | Dang nhap | https://payos.vn |
| 2 | Truy cap dashboard | Tich hop → Thong tin API |
| 3 | Kiem tra credentials | Client ID, API Key, Checksum Key |
| 4 | Kiem tra webhook | Tich hop → Webhook URL |
| 5 | Kiem tra giao dich | Lich su giao dich tab |

---

## 6. RESEND (Email)

| # | Hanh dong | Cach lam |
|---|-----------|----------|
| 1 | Dang nhap | https://resend.com |
| 2 | Kiem tra API key | API Keys tab |
| 3 | Kiem tra domain | Domains tab → DNS records |
| 4 | Kiem tra email logs | Emails tab → delivery status |

**Free tier:** 100 emails/day, 3,000/month.

---

## 7. GOOGLE AI STUDIO (Gemini API)

| # | Hanh dong | Cach lam |
|---|-----------|----------|
| 1 | Truy cap | https://aistudio.google.com |
| 2 | Kiem tra API key | API keys section |
| 3 | Kiem tra quota | Usage tab → requests/day |

**Free tier:** 60 RPM.

---

## 8. DOMAIN (wellnexus.vn)

| # | Hanh dong | Cach lam |
|---|-----------|----------|
| 1 | Dang nhap registrar | Noi mua domain wellnexus.vn |
| 2 | Kiem tra DNS | Nameservers tro ve Vercel |
| 3 | Kiem tra SSL | Auto-renew qua Vercel |
| 4 | Kiem tra email DNS | SPF, DKIM, DMARC records |

---

## TONG KET CHECKLIST

| Service | URL | Role can | Status |
|---------|-----|----------|--------|
| GitHub | github.com/longtho638-jpg/Well | Admin | [ ] |
| Supabase | supabase.com/dashboard | Owner | [ ] |
| Vercel | vercel.com | Owner | [ ] |
| Sentry | sentry.io | Owner | [ ] |
| PayOS | payos.vn | Admin | [ ] |
| Resend | resend.com | Owner | [ ] |
| Google AI | aistudio.google.com | Owner | [ ] |
| Domain | registrar | Owner | [ ] |

---

> **Luu y:** Sau khi chuyen giao, doi password cac account va rotate API keys de bao mat.
