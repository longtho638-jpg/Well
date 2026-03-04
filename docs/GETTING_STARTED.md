# Getting Started with WellNexus RaaS

> Your complete guide to setting up and using WellNexus RaaS platform.

---

## 🎯 What You'll Build

By the end of this guide, you'll have:
- ✅ A fully functional health & wellness e-commerce platform
- ✅ MLM/affiliate commission system (8-level)
- ✅ AI-powered agents for sales and marketing
- ✅ Subscription billing with Pro/Enterprise tiers
- ✅ Multi-tenant organization support

---

## 📋 Prerequisites

Before you begin, ensure you have:

- [Node.js 18+](https://nodejs.org/) (LTS recommended)
- [npm 9+](https://npmjs.com/) or [pnpm](https://pnpm.io/)
- [Git](https://git-scm.com/)
- [Supabase account](https://supabase.com) (free tier works)
- Code editor (VS Code recommended)

---

## 🚀 Step 1: Clone & Install

### Clone the Repository

```bash
git clone https://github.com/longtho638-jpg/Well.git
cd Well
```

### Install Dependencies

```bash
npm install
```

This installs:
- React 19, TypeScript, Vite
- Zustand (state management)
- Framer Motion (animations)
- TailwindCSS (styling)
- Supabase client
- 100+ other dependencies

---

## ⚙️ Step 2: Environment Setup

### Create Local Environment File

```bash
cp .env.example .env.local
```

### Edit `.env.local`

```bash
# Required: Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Admin Configuration
VITE_ADMIN_EMAILS=your-email@example.com

# Optional: Error Tracking
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Get Supabase credentials:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project or select existing
3. Settings → API
4. Copy **Project URL** → `VITE_SUPABASE_URL`
5. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## 🗄️ Step 3: Database Setup

### Option A: Supabase CLI (Recommended)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project (get ref from dashboard URL)
npx supabase link --project-ref your-project-ref

# Push all migrations
npx supabase db push
```

### Option B: Manual SQL Import

1. Open Supabase Dashboard → SQL Editor
2. Copy contents from `supabase/migrations/*.sql` files
3. Paste and run each migration in order:
   - `20241203000001_initial_schema.sql`
   - `20241204000001_scalable_architecture.sql`
   - `20260113_recursive_referral.sql`
   - `20260228_subscription_plans.sql`
   - `20260301_multi_org_subscriptions.sql`
   - `20260304_usage_metering_feature_flags.sql`

---

## 🧪 Step 4: Verify Setup

### Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v7.3.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Open Browser

Navigate to [http://localhost:5173](http://localhost:5173)

You should see the WellNexus homepage.

### Run Tests

```bash
npm run test:run
```

Expected: All 440 tests pass ✅

### Build for Production

```bash
npm run build
```

Expected: Build completes in ~7s with 0 TypeScript errors ✅

---

## 📦 Step 5: Seed Initial Data (Optional)

### Create First Admin User

```sql
-- Run in Supabase SQL Editor
INSERT INTO users (id, email, full_name, role_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@wellnexus.vn',
  'System Admin',
  1  -- Super admin
);
```

### Create Sample Products

```sql
INSERT INTO products (name, price, description, category, stock)
VALUES
  ('Vitamin C 1000mg', 150000, 'Immune support supplement', 'health', 100),
  ('Omega-3 Fish Oil', 250000, 'Heart health supplement', 'health', 50),
  ('Probiotics Complex', 200000, 'Digestive health supplement', 'health', 75);
```

---

## 🎨 Step 6: Customize Branding

### Update App Title & Logo

Edit `src/config/app-config.ts`:

```typescript
export const APP_CONFIG = {
  name: 'Your Brand',
  tagline: 'Your tagline here',
  logo: '/logo.svg',
  primaryColor: '#7C3AED',  // Change brand color
};
```

### Update i18n Translations

Edit `src/locales/vi.ts` and `src/locales/en.ts`:

```typescript
export const vi = {
  app: {
    name: 'Thương Hiệu Của Bạn',
    tagline: 'Slogan của bạn',
  },
  // ... more translations
};
```

---

## 🔐 Step 7: Configure Authentication

### Enable Email Auth (Supabase Dashboard)

1. Authentication → Providers
2. Enable **Email** provider
3. Configure email templates (optional)

### Configure Magic Link (Optional)

1. Authentication → Email Templates
2. Customize magic link email template

### OAuth Providers (Optional)

Enable Google/Facebook/GitHub auth:
1. Authentication → Providers
2. Enable desired provider
3. Add client ID/secret from provider

---

## 📧 Step 8: Email Setup (Resend)

WellNexus uses **Resend** for transactional emails.

### Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys → Create new key
3. Copy key (starts with `re_`)

### Configure Supabase Edge Function

```bash
# Via Supabase CLI
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Or via Dashboard
# Settings → Edge Functions → Secrets → Add secret
```

### Test Email

```typescript
// In browser console
import { emailService } from '@/services/email-service-client-side-trigger';
await emailService.sendWelcome('test@example.com', {
  userName: 'Test User',
  userEmail: 'test@example.com',
});
```

---

## 🚩 Step 9: Configure Feature Flags

Feature flags control access to Pro/Enterprise features.

### View Current Flags

```sql
SELECT * FROM feature_flags;
```

### Add Custom Feature

```sql
INSERT INTO feature_flags (flag_key, flag_name, description, plan_access)
VALUES (
  'custom_feature',
  'Custom Feature Name',
  'Description of what it does',
  '{"pro","agency"}'  -- Available to Pro and Enterprise
);
```

### Check Feature Access in Code

```typescript
import { subscriptionService } from '@/services/subscription-service';

const hasAccess = await subscriptionService.canAccessFeature(userId, 'ai_copilot');
if (hasAccess) {
  // Show Pro feature
}
```

---

## 📊 Step 10: Usage Metering Setup

Track API calls, AI usage, and storage per user/org.

### Track Usage

```typescript
import { subscriptionService } from '@/services/subscription-service';

// Track AI call
await subscriptionService.trackUsage({
  orgId: 'org-uuid',
  userId: 'user-uuid',
  feature: 'ai_copilot',
  quantity: 1,
  metadata: { action: 'generate_content' },
});
```

### Check Quota

```typescript
const quota = await subscriptionService.checkQuota(
  orgId,
  'ai_calls',
  1000,  // Pro tier limit
  '2026-03-01',
  '2026-03-31'
);

console.log(`Used: ${quota.current}/${quota.limit}`);
```

---

## 🎯 Next Steps

Congratulations! 🎉 You now have a fully functional RaaS platform.

### Recommended Next Steps:

1. **[Read API Docs](./API_REFERENCE.md)** — Integrate with external systems
2. **[Customize UI](./DESIGN_SYSTEM.md)** — Match your brand
3. **[Set Up CI/CD](./DEPLOYMENT.md)** — Automate deployments
4. **[Configure Analytics](./ANALYTICS.md)** — Track user behavior
5. **[Join Community](https://github.com/longtho638-jpg/Well/discussions)** — Connect with other developers

---

## 🆘 Troubleshooting

### Build Fails with TypeScript Errors

```bash
# Check TypeScript version
npx tsc --version

# Ensure strict mode is enabled
# tsconfig.json: "strict": true
```

### Supabase Connection Issues

```bash
# Verify URL and key
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl -X GET "https://your-project.supabase.co/rest/v1/users" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

### Tests Failing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run test:run
```

---

## 📞 Need Help?

- 📚 **Full Docs:** [Documentation Index](./docs/)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/longtho638-jpg/Well/discussions)
- 🐛 **Issues:** [Report a bug](https://github.com/longtho638-jpg/Well/issues)
- 📧 **Email:** support@wellnexus.vn

---

**Happy Building! 🚀**
