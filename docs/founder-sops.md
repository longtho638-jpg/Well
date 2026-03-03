# WellNexus Founder SOPs — Quy Trinh Van Hanh Sang Lap

> SOPs cho FOUNDER (CEO/Owner) quan ly toan bo WellNexus platform.
> Ket hop Admin SOPs + Business Strategy + Growth Operations.
> Cap nhat: 2026-03-03

---

## MUC LUC

1. [Quy Trinh Hang Ngay](#1-quy-trinh-hang-ngay-daily-ops)
2. [Quan Ly Doi Tac](#2-quan-ly-doi-tac-partner-management)
3. [Quan Ly Tai Chinh](#3-quan-ly-tai-chinh-finance-management)
4. [Quan Ly San Pham](#4-quan-ly-san-pham-product-management)
5. [Marketing & Tang Truong](#5-marketing--tang-truong)
6. [He Thong Commission](#6-he-thong-commission-bee-20)
7. [Van Hanh Ky Thuat](#7-van-hanh-ky-thuat-technical-ops)
8. [Xu Ly Su Co](#8-xu-ly-su-co-emergency-procedures)
9. [Bao Cao & KPI](#9-bao-cao--kpi)

---

## 1. QUY TRINH HANG NGAY (Daily Ops)

### 1.1 Morning Checklist (8:00 - 9:00)

| # | Hanh dong | Cong cu | Thoi gian |
|---|-----------|---------|-----------|
| 1 | Kiem tra site live | `https://wellnexus.vn` | 1 phut |
| 2 | Xem Admin Overview | `/admin` — GMV, Active Bee Force, AI Signals | 5 phut |
| 3 | Duyet AI Action Center | Approve/Reject pending actions | 10 phut |
| 4 | Kiem tra Finance Pending | `/admin/finance` — giao dich cho duyet | 10 phut |
| 5 | Xem Audit Log | `/admin/audit` — hoat dong 24h qua | 5 phut |
| 6 | Check email Sentry | Xem co loi production khong | 5 phut |

### 1.2 Weekly Review (Thu 2 hang tuan)

| # | Hanh dong | Output |
|---|-----------|--------|
| 1 | So sanh GMV tuan nay vs tuan truoc | % tang truong |
| 2 | Review top 10 partners theo doanh so | Xac dinh ai can ho tro |
| 3 | Kiem tra ti le chuyen doi landing page | CRO insights |
| 4 | Review don hang: completed vs cancelled | Ti le hoan thanh |
| 5 | Cap nhat noi dung CMS (banner, thong bao) | Content moi |

### 1.3 Monthly Strategy (Ngay 1 hang thang)

| # | Hanh dong |
|---|-----------|
| 1 | Export bao cao tai chinh CSV |
| 2 | Review commission payout tong |
| 3 | Danh gia hieu qua marketing |
| 4 | Cap nhat san pham (gia, mo ta, hinh) |
| 5 | Review rank thang cap cua partners |
| 6 | Dat muc tieu thang tiep theo |

---

## 2. QUAN LY DOI TAC (Partner Management)

### 2.1 Tiep nhan Partner moi

| Buoc | Hanh dong | Luu y |
|------|-----------|-------|
| 1 | Partner dang ky tai `/signup` (co ma gioi thieu) | Ma auto-fill tu URL `/ref/:id` |
| 2 | He thong tu dong gan vao tree cua nguoi gioi thieu | Kiem tra Referral tree dung |
| 3 | Partner nhan email Welcome | Verify email da gui |
| 4 | Lien he partner moi trong 24h | Gui tai lieu, huong dan |
| 5 | Theo doi hoat dong 7 ngay dau | Xem co mua hang, gioi thieu ai |

### 2.2 Theo doi hieu suat

**Route:** `/admin/partners`

| Metric | Nguong canh bao | Hanh dong |
|--------|-----------------|-----------|
| Partner inactive > 30 ngay | Canh bao | Lien he, ho tro, khuyen khich |
| Doanh so giam > 50% | Canh bao | Tim nguyen nhan, cung cap uu dai |
| Partner dat rank moi | Thong bao | Chuc mung, share lên nhom |
| Partner co doi nhom > 10 | Co hoi | Dao tao leader, ho tro mo rong |

### 2.3 Xu ly partner vi pham

| Buoc | Hanh dong |
|------|-----------|
| 1 | Phat hien qua Audit Log hoac bao cao |
| 2 | Canh cao lan 1 (lien he truc tiep) |
| 3 | Canh cao lan 2 (email chinh thuc) |
| 4 | Deactivate tai khoan qua `/admin/partners` → Bulk Action |
| 5 | Ghi chep vao Audit Log |

---

## 3. QUAN LY TAI CHINH (Finance Management)

### 3.1 Duyet thanh toan hang ngay

**Route:** `/admin/finance`

| Buoc | Hanh dong | Luu y |
|------|-----------|-------|
| 1 | Xem tab "Treasury Payout" | Tat ca yeu cau rut tien |
| 2 | Loc theo "Quarantined" | Kiem tra giao dich bi flag |
| 3 | Xem fraud score tung giao dich | Score > 70 = kiem tra ky |
| 4 | Click "Approve" hoac "Reject" | Neu Approve → partner nhan tien |
| 5 | "Security Batch Commit" cho giao dich safe | Chi commit khi da review |

### 3.2 Doi chieu doanh thu

| Hanh dong | Tan suat | Cong cu |
|-----------|----------|--------|
| So sanh Revenue Inflow vs Treasury Payout | Hang ngay | Admin Finance |
| Export CSV bao cao tai chinh | Hang tuan | Export button |
| Doi chieu voi tai khoan ngan hang | Hang thang | Manual |
| Kiem tra so du PayOS | Hang tuan | PayOS Dashboard |

### 3.3 Chinh sach rut tien

| Dieu kien | Gia tri |
|-----------|---------|
| So tien rut toi thieu | 100,000 VND |
| Thoi gian xu ly | 1-3 ngay lam viec |
| Phi rut tien | 0% (mien phi) |
| Phuong thuc | Chuyen khoan ngan hang |

---

## 4. QUAN LY SAN PHAM (Product Management)

### 4.1 Them/Sua san pham

**Route:** `/admin/products`

| Buoc | Hanh dong |
|------|-----------|
| 1 | Click "Add Product" (hoac chon san pham co) |
| 2 | Nhap: Ten, Mo ta, Gia goc, Gia ban, Danh muc |
| 3 | Upload hinh anh san pham |
| 4 | Dat trang thai: Draft / Active |
| 5 | Luu → san pham xuat hien tren Marketplace |

### 4.2 Quan ly gia & khuyen mai

| Loai | Cach thuc hien |
|------|----------------|
| Giam gia san pham | Sua "Gia ban" tai Admin Products |
| Flash sale | Tao banner quang cao + cap nhat gia |
| Combo uu dai | Tao san pham moi voi gia combo |
| Free shipping | Cap nhat thong bao tren CMS |

### 4.3 Quan ly ton kho

| Hanh dong | Mo ta |
|-----------|-------|
| Theo doi so luong | Kiem tra stock tung san pham |
| Canh bao het hang | Dat nguong re-order point |
| An san pham het hang | Chuyen trang thai → Draft |

---

## 5. MARKETING & TANG TRUONG

### 5.1 Cong cu marketing tich hop

**Route:** `/dashboard/marketing-tools`

| Cong cu | Muc dich | Su dung |
|---------|----------|---------|
| Referral Link | Chia se link gioi thieu | Copy & share tren MXH |
| QR Code | Tao ma QR cho offline | In an, phat o event |
| Gift Card | Tang ma qua tang | Khuyen mai, giu chan KH |
| Social Templates | Mau bai dang MXH | Customize & dang |
| Affiliate Dashboard | Theo doi hieu qua | Xem click, dang ky, doanh so |

### 5.2 Chien luoc tang truong

| Giai doan | Muc tieu | Hanh dong |
|-----------|----------|-----------|
| Thang 1-3 | 100 partners | Personal outreach, event offline |
| Thang 4-6 | 500 partners | Referral program, social media ads |
| Thang 7-12 | 2000 partners | KOL collab, content marketing, SEO |

### 5.3 Landing page & CRO

| Metric | Muc tieu | Cach do |
|--------|----------|---------|
| Bounce rate | < 40% | Google Analytics |
| Signup conversion | > 5% | Signup / Total visits |
| Checkout completion | > 60% | Orders / Checkouts started |

---

## 6. HE THONG COMMISSION (Bee 2.0)

### 6.1 Bang commission

| Rank | Level | Ti le commission | Dieu kien thang cap |
|------|-------|------------------|---------------------|
| THIEN_LONG | 1 | 25% | Top leadership |
| DAI_SU | 2 | 25% | Senior leader |
| SU_PHAT | 3 | 25% | Established leader |
| SU_PHAT_TRUONG | 4 | 25% | Growing leader |
| GIAM_SAT | 5 | 25% | Supervisor |
| TRUONG_NHOM | 6 | 25% | Team lead |
| KHOI_NGHIEP | 7 | 25% | Starter |
| CTV | 8 | 21% | Collaborator |

### 6.2 Flow tinh commission

```
Khach hang mua hang
  → Don hang completed
  → He thong tinh commission tu dong
    → Partner truc tiep: % theo rank
    → Sponsor F1: bonus commission
  → Credit vao vi SHOP cua partner
  → Partner yeu cau rut tien
  → Admin duyet → chuyen khoan
```

### 6.3 Giam sat commission

| Kiem tra | Tan suat | Route |
|----------|----------|-------|
| Tong commission da tra | Hang tuan | Admin Finance |
| Ti le commission/doanh thu | Hang thang | Export CSV, tinh toan |
| Commission bat thuong | Hang ngay | Fraud score > 70 |

---

## 7. VAN HANH KY THUAT (Technical Ops)

### 7.1 Monitoring

| He thong | Cong cu | URL |
|----------|---------|-----|
| Frontend | Vercel Dashboard | vercel.com/dashboard |
| Database | Supabase Dashboard | supabase.com/dashboard |
| Errors | Sentry | sentry.io (VITE_SENTRY_DSN) |
| CI/CD | GitHub Actions | github.com/.../actions |
| Domain | wellnexus.vn | DNS + SSL auto-renew |

### 7.2 Deployment

| Hanh dong | Cach thuc |
|-----------|-----------|
| Deploy | `git push origin main` → auto deploy qua Vercel |
| Rollback | Vercel Dashboard → Deployments → Promote previous |
| Hotfix | Branch → Fix → PR → Merge → Auto deploy |

### 7.3 Database

| Hanh dong | Cong cu |
|-----------|--------|
| Xem data | Supabase Dashboard → Table Editor |
| Chay SQL | Supabase Dashboard → SQL Editor |
| Backup | Supabase auto daily backup (Pro plan) |
| Migration | `npx supabase db push` |

### 7.4 Env vars quan trong

| Bien | Muc dich | Noi cau hinh |
|------|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase endpoint | Vercel Env Vars |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | Vercel Env Vars |
| `VITE_ADMIN_EMAILS` | Danh sach email admin | Vercel Env Vars |
| `VITE_SENTRY_DSN` | Sentry error tracking | Vercel Env Vars |
| `RESEND_API_KEY` | Email service | Supabase Edge Function Secrets |
| `GEMINI_API_KEY` | AI features | Supabase Edge Function Secrets |

---

## 8. XU LY SU CO (Emergency Procedures)

### 8.1 Site bi sap (HTTP != 200)

| Buoc | Hanh dong | Thoi gian |
|------|-----------|-----------|
| 1 | Kiem tra `curl -sI https://wellnexus.vn` | 1 phut |
| 2 | Check Vercel Dashboard → Deployments | 2 phut |
| 3 | Neu deploy loi → Rollback ve version truoc | 5 phut |
| 4 | Neu Supabase loi → Check Supabase Status page | 2 phut |
| 5 | Thong bao partners qua CMS Announcement | 5 phut |

### 8.2 Giao dich bat thuong

| Buoc | Hanh dong |
|------|-----------|
| 1 | Phat hien qua Finance → Quarantined |
| 2 | Kiem tra Audit Log → IP, thoi gian, tan suat |
| 3 | Tam khoa partner nghi ngo → Deactivate |
| 4 | Lien he partner xac minh |
| 5 | Neu gian lan → Reject giao dich + ban account |

### 8.3 Bao mat bi xam pham

| Buoc | Hanh dong |
|------|-----------|
| 1 | Doi VITE_SUPABASE_ANON_KEY ngay |
| 2 | Review Supabase Auth → active sessions |
| 3 | Kiem tra RLS policies con dung |
| 4 | Thong bao user doi mat khau |
| 5 | Review Audit Log 72h qua |

### 8.4 PayOS thanh toan loi

| Buoc | Hanh dong |
|------|-----------|
| 1 | Check PayOS Dashboard → transaction status |
| 2 | Neu webhook loi → kiem tra Supabase Edge Function logs |
| 3 | Thu manual trigger webhook |
| 4 | Lien he PayOS support (trong gio lam viec) |
| 5 | Tam chuyen sang COD neu PayOS sap |

---

## 9. BAO CAO & KPI

### 9.1 KPI chinh

| KPI | Muc tieu | Do o dau |
|-----|----------|----------|
| GMV (Gross Merchandise Value) | Tang 20%/thang | Admin Overview |
| Active Partners | Tang 15%/thang | Admin Partners |
| Order Completion Rate | > 80% | Admin Orders |
| Commission Ratio | < 30% doanh thu | Finance Export |
| Site Uptime | > 99.5% | Sentry + Vercel |
| Customer Satisfaction | > 4.5/5 | Survey/feedback |

### 9.2 Dashboard theo doi

| Dashboard | Route | Thong tin |
|-----------|-------|-----------|
| Admin Overview | `/admin` | GMV, Active Bee, AI Signals |
| Finance | `/admin/finance` | Revenue, Payout, Pending |
| Partners | `/admin/partners` | Total, Active, Growth |
| Orders | `/admin/orders` | Status, Payment method |
| Audit Log | `/admin/audit` | All system events |

### 9.3 Bao cao tu dong

| Loai | Trigger | Noi nhan |
|------|---------|----------|
| Commission earned | Don hang completed | Email partner |
| Rank upgrade | Dieu kien dat | Email partner |
| Welcome | Dang ky moi | Email user |
| Order confirmation | Dat hang thanh cong | Email buyer |

---

## PHU LUC

### A. Lien ket nhanh

| Tai lieu | Duong dan |
|----------|-----------|
| Admin SOPs | `docs/admin-sops.md` |
| User SOPs | `docs/user-sops.md` |
| Payment SOPs | `docs/payment-sops.md` |
| Deployment Guide | `docs/DEPLOYMENT_GUIDE.md` |
| System Architecture | `docs/system-architecture.md` |
| Disaster Recovery | `docs/DISASTER_RECOVERY.md` |

### B. Lien he ho tro ky thuat

| Kenh | Thong tin |
|------|-----------|
| GitHub Issues | github.com/longtho638-jpg/Well/issues |
| Supabase Support | supabase.com/dashboard → Support |
| Vercel Support | vercel.com/support |
| PayOS Support | payos.vn/support |
| Sentry | sentry.io → Issues |
