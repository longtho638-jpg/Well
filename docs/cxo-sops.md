# WellNexus CXO SOPs — Quy Trinh Trai Nghiem Khach Hang

> SOPs cho CXO (Chief Experience Officer) — UX, CUSTOMER JOURNEY, NPS, RETENTION.
> Cap nhat: 2026-03-03

---

## MUC LUC

1. [Customer Journey](#1-customer-journey)
2. [UX & UI Standards](#2-ux--ui-standards)
3. [Feedback & NPS](#3-feedback--nps)
4. [Retention & Loyalty](#4-retention--loyalty)
5. [Personalization](#5-personalization)
6. [Omnichannel Experience](#6-omnichannel-experience)
7. [KPI Trai Nghiem](#7-kpi-trai-nghiem)

---

## 1. CUSTOMER JOURNEY

### 1.1 Journey map

```
Awareness → Consideration → Signup → First Order → Repeat → Referral → Advocate
  (Ads/SEO)  (Landing page)  (/signup)  (Marketplace)  (Dashboard)  (Tools)  (KOL)
```

### 1.2 Touchpoints & ownership

| Touchpoint | Kenh | Owner | Metric |
|------------|------|-------|--------|
| First visit | Landing page | CMO | Bounce rate |
| Signup | /signup form | CTO | Conversion rate |
| Email confirm | Email | CTO | Delivery rate |
| First login | Dashboard | CXO | Activation rate |
| First purchase | Marketplace | COO | Time to first order |
| Post-purchase | Email + Copilot | CXO | CSAT |
| Referral | Marketing tools | CMO | Viral coefficient |
| Support | Zalo/Email/Copilot | COO | Resolution time |

### 1.3 Drop-off analysis

| Giai doan | Drop-off rate muc tieu | Hanh dong neu vuot |
|-----------|------------------------|---------------------|
| Visit → Signup | < 95% drop | A/B test CTA, giam form fields |
| Signup → Email confirm | < 20% drop | Retry email, SMS backup |
| Confirm → First login | < 30% drop | Welcome email series |
| Login → First order | < 60% drop | Onboarding tour, coupon |
| First → Second order | < 50% drop | Push notification, email |

---

## 2. UX & UI STANDARDS

### 2.1 Design system (Aura Elite)

| Element | Quy dinh |
|---------|----------|
| Theme | Dark gradients + glassmorphism |
| Colors | Primary gradient, secondary accent |
| Typography | Inter font, responsive sizes |
| Spacing | 4px grid system |
| Animation | Framer Motion, subtle transitions |
| Loading | Skeleton loading states |
| Empty states | Icon + message + CTA |
| Error states | User-friendly message + retry |

### 2.2 Accessibility (WCAG 2.1 AA)

| Yeu cau | Trang thai |
|---------|------------|
| Color contrast > 4.5:1 | ✅ |
| Keyboard navigation | ✅ |
| ARIA labels | ✅ |
| Focus indicators | ✅ |
| Screen reader support | ✅ |
| Touch targets > 44px | ✅ |
| Alt text on images | ✅ (i18n) |

### 2.3 Performance UX

| Metric | Target | Anh huong UX |
|--------|--------|-------------|
| LCP | < 2.5s | First meaningful paint |
| FID | < 100ms | Responsiveness |
| CLS | < 0.1 | Visual stability |
| TTI | < 3s | Interactive readiness |

---

## 3. FEEDBACK & NPS

### 3.1 Thu thap feedback

| Kenh | Thoi diem | Cong cu |
|------|-----------|--------|
| In-app survey | Sau don hang dau | Formbricks/custom |
| Email survey | 7 ngay sau mua | Resend template |
| NPS survey | Hang quy | Email + in-app |
| CS conversation | Moi tuong tac | Zalo/Email logs |
| Social listening | Lien tuc | Manual + tools |

### 3.2 NPS framework

| Score | Phan loai | Hanh dong |
|-------|-----------|-----------|
| 9-10 | Promoter | Cam on, moi referral, testimonial |
| 7-8 | Passive | Hoi cach cai thien, uu dai |
| 0-6 | Detractor | Lien he ngay, giai quyet van de |

### 3.3 Feedback → Action loop

| Buoc | Hanh dong |
|------|-----------|
| 1 | Thu thap feedback (survey, CS, social) |
| 2 | Phan loai: Bug / Feature request / Complaint / Praise |
| 3 | Uu tien: Impact x Effort matrix |
| 4 | Assign team/sprint |
| 5 | Implement fix/feature |
| 6 | Thong bao KH "We fixed it" |
| 7 | Do luong impact |

---

## 4. RETENTION & LOYALTY

### 4.1 Retention strategies

| Giai doan | Strategy | Cong cu |
|-----------|----------|--------|
| Day 1-7 | Onboarding tour, welcome email | In-app + Resend |
| Day 7-30 | First order incentive, daily quests | Dashboard quests |
| Day 30-90 | Loyalty program, rank progression | Commission system |
| Day 90+ | VIP benefits, exclusive content | Premium features |

### 4.2 Churn prevention

| Signal | Hanh dong |
|--------|-----------|
| No login 7 ngay | Push notification + email |
| No order 30 ngay | Coupon + personal outreach |
| Cart abandonment | Reminder email (1h, 24h) |
| Support ticket unresolved | Escalate to COO |
| NPS detractor | 1:1 call from CXO |

### 4.3 Loyalty program

| Tier | Dieu kien | Benefits |
|------|-----------|----------|
| Bronze | Dang ky | Basic access |
| Silver | 3 don hang | Free shipping, 5% off |
| Gold | 10 don hang | Priority support, 10% off |
| Platinum | 30 don hang | Exclusive products, 15% off |

---

## 5. PERSONALIZATION

### 5.1 Personalization areas

| Area | Data source | Output |
|------|------------|--------|
| Dashboard greeting | User profile | "Chao [ten], hom nay..." |
| Product recommendations | Order history | "San pham cho ban" |
| Health insights | Quiz + AI | Copilot suggestions |
| Content | Behavior | Relevant articles |
| Notifications | Preferences | Khong spam, dung luc |

### 5.2 AI-powered personalization

| Feature | Engine | Status |
|---------|--------|--------|
| Health Coach | Gemini AI | ✅ Active |
| Sales Copilot | Vercel AI SDK | ✅ Active |
| Smart recommendations | Embedding search | Planned Q3 |
| Predictive churn | ML model | Planned Q4 |

---

## 6. OMNICHANNEL EXPERIENCE

### 6.1 Kenh & nhat quan

| Kenh | Trai nghiem | Dong bo |
|------|------------|---------|
| Web (desktop) | Full features | Master |
| Web (mobile) | Responsive, PWA | Sync |
| Zalo OA | CS + notifications | One-way |
| Email | Transactional + marketing | Triggered |
| In-person | Event, workshop | Manual |

### 6.2 PWA experience

| Feature | Trang thai |
|---------|------------|
| Installable (Add to Home) | ✅ |
| Offline fallback | ✅ |
| Push notifications | Planned |
| App-like navigation | ✅ |

---

## 7. KPI TRAI NGHIEM

| KPI | Muc tieu |
|-----|----------|
| NPS | > 50 |
| CSAT | > 4.5/5 |
| First order conversion | > 20% |
| Repeat purchase rate | > 40% |
| Churn rate (monthly) | < 5% |
| Support CSAT | > 4.0/5 |
| Onboarding completion | > 80% |
| Feature adoption | > 60% |
| App store rating (PWA) | > 4.5 |

---

## PHU LUC

| Tai lieu | File |
|----------|------|
| Design Guidelines | `docs/design-guidelines.md` |
| User SOPs | `docs/user-sops.md` |
| All SOPs | `docs/*-sops.md` |
