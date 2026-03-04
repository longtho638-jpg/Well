# Feature Flags Guide

> Control feature access by subscription tier using WellNexus Feature Flags system.

---

## 🎯 What are Feature Flags?

Feature flags allow you to:
- 🔐 Gate features by subscription plan (Free/Pro/Enterprise)
- 🧪 A/B test new features with specific user groups
- 🚀 Enable/disable features without deploying code
- 🎯 Grant custom access per user or organization

---

## 📊 Default Feature Flags

| Flag Key | Feature Name | Free | Pro | Enterprise |
|----------|--------------|------|-----|------------|
| `ai_insights` | AI Insights | ✅ | ✅ | ✅ |
| `health_coach` | Health Coach Agent | ✅ | ✅ | ✅ |
| `commission_advanced` | 8-Level Commission | ✅ | ✅ | ✅ |
| `dashboard` | Dashboard | ✅ | ✅ | ✅ |
| `marketplace` | Marketplace | ✅ | ✅ | ✅ |
| `withdrawal` | Withdrawal | ❌ | ✅ | ✅ |
| `ai_copilot` | AI Copilot | ❌ | ✅ | ✅ |
| `advanced_analytics` | Advanced Analytics | ❌ | ✅ | ✅ |
| `priority_support` | Priority Support | ❌ | ✅ | ✅ |
| `white_label` | White-Label Branding | ❌ | ❌ | ✅ |
| `api_access` | REST API Access | ❌ | ❌ | ✅ |
| `multi_network` | Multi-Network Management | ❌ | ❌ | ✅ |

---

## 🔧 How to Use Feature Flags

### Check Feature Access in Code

```typescript
import { subscriptionService } from '@/services/subscription-service';

// Check if user has access to a feature
const hasAccess = await subscriptionService.canAccessFeature(userId, 'ai_copilot');

if (hasAccess) {
  // Show Pro feature
  return <AICopilot />;
} else {
  // Show upgrade prompt
  return <UpgradePrompt feature="AI Copilot" requiredPlan="Pro" />;
}
```

### Use React Hook (Recommended)

```typescript
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function MyComponent() {
  const { hasAccess, isLoading, plan } = useFeatureAccess('ai_copilot');

  if (isLoading) return <LoadingSpinner />;
  if (!hasAccess) return <UpgradePrompt plan={plan} />;

  return <AICopilot />;
}
```

### Check Multiple Features

```typescript
import { subscriptionService } from '@/services/subscription-service';

const features = await Promise.all([
  subscriptionService.canAccessFeature(userId, 'ai_copilot'),
  subscriptionService.canAccessFeature(userId, 'advanced_analytics'),
  subscriptionService.canAccessFeature(userId, 'white_label'),
]);
```

---

## 🗄️ Database Schema

### Feature Flags Table

```sql
CREATE TABLE feature_flags (
  id           UUID PRIMARY KEY,
  flag_key     TEXT NOT NULL UNIQUE,
  flag_name    TEXT NOT NULL,
  description  TEXT,
  is_enabled   BOOLEAN DEFAULT true,
  plan_access  TEXT[] NOT NULL DEFAULT '{}',  -- ['free', 'pro', 'agency']
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### User Feature Access Table

```sql
CREATE TABLE user_feature_access (
  id         UUID PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  flag_key   TEXT REFERENCES feature_flags(flag_key),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, flag_key)
);
```

---

## ➕ Add New Feature Flag

### Step 1: Create Migration

```sql
-- supabase/migrations/20260304_add_new_feature_flag.sql
INSERT INTO feature_flags (flag_key, flag_name, description, plan_access)
VALUES (
  'new_feature',
  'New Feature Name',
  'Description of what this feature does',
  '{"pro","agency"}'  -- Available to Pro and Enterprise
)
ON CONFLICT (flag_key) DO NOTHING;
```

### Step 2: Add to Code

```typescript
// src/services/subscription-service.ts
const WELL_FEATURE_GATE: FeatureGateConfig = {
  planHierarchy: ['free', 'basic', 'pro', 'agency'],
  featureMinPlan: {
    // ... existing features
    new_feature: 'pro',  // Add new feature here
  },
};
```

### Step 3: Use in Component

```typescript
// src/pages/NewFeaturePage.tsx
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

export function NewFeaturePage() {
  const { hasAccess, plan } = useFeatureAccess('new_feature');

  if (!hasAccess) {
    return (
      <UpgradePrompt
        feature="New Feature"
        currentPlan={plan}
        requiredPlan="Pro"
      />
    );
  }

  return <NewFeatureContent />;
}
```

---

## 🎯 Grant Custom Access

### Grant to Specific User

```sql
-- Grant feature access to user until specific date
INSERT INTO user_feature_access (user_id, flag_key, expires_at)
VALUES (
  'user-uuid-here',
  'ai_copilot',
  NOW() + INTERVAL '30 days'
)
ON CONFLICT (user_id, flag_key) DO UPDATE
SET expires_at = EXCLUDED.expires_at;
```

### Grant to All Users (Beta Test)

```sql
-- Enable feature for all users temporarily
UPDATE feature_flags
SET plan_access = '{"free","basic","pro","agency"}'
WHERE flag_key = 'ai_copilot';
```

### Grant via Organization

```sql
-- Grant feature to all members of an org
INSERT INTO user_feature_access (user_id, flag_key, granted_at)
SELECT
  om.user_id,
  'new_feature',
  NOW()
FROM org_members om
WHERE om.org_id = 'org-uuid-here'
ON CONFLICT (user_id, flag_key) DO NOTHING;
```

---

## 🔍 Query Feature Access

### Get All Features for User

```typescript
import { supabase } from '@/lib/supabase';

const { data } = await supabase
  .rpc('get_user_features', { p_user_id: userId });

console.log('User features:', data);
```

### Check Usage Quota

```typescript
import { subscriptionService } from '@/services/subscription-service';

const quota = await subscriptionService.checkQuota(
  orgId,
  'ai_calls',
  1000,  // Pro tier limit
  '2026-03-01',
  '2026-03-31'
);

console.log(`AI calls: ${quota.current}/${quota.limit} (${quota.percentage_used}%)`);
```

---

## 🚩 Feature Flag Patterns

### Pattern 1: Gradual Rollout

```sql
-- Phase 1: Enable for Enterprise only
UPDATE feature_flags SET plan_access = '{"agency"}' WHERE flag_key = 'beta_feature';

-- Phase 2: Enable for Pro + Enterprise
UPDATE feature_flags SET plan_access = '{"pro","agency"}' WHERE flag_key = 'beta_feature';

-- Phase 3: Enable for all
UPDATE feature_flags SET plan_access = '{"free","basic","pro","agency"}' WHERE flag_key = 'beta_feature';
```

### Pattern 2: A/B Testing

```sql
-- Randomly enable feature for 50% of users
INSERT INTO user_feature_access (user_id, flag_key)
SELECT id, 'ab_test_feature'
FROM users
WHERE random() < 0.5
ON CONFLICT (user_id, flag_key) DO NOTHING;
```

### Pattern 3: Time-Limited Access

```sql
-- Grant 7-day trial access
INSERT INTO user_feature_access (user_id, flag_key, expires_at)
VALUES
  ('user-1', 'ai_copilot', NOW() + INTERVAL '7 days'),
  ('user-2', 'ai_copilot', NOW() + INTERVAL '7 days')
ON CONFLICT (user_id, flag_key) DO UPDATE
SET expires_at = EXCLUDED.expires_at;
```

---

## 🧪 Testing Feature Flags

### Unit Test

```typescript
// src/services/__tests__/subscription-service.test.ts
describe('canAccessFeature', () => {
  it('should return true for free features', async () => {
    const hasAccess = await subscriptionService.canAccessFeature(
      'user-id',
      'dashboard'
    );
    expect(hasAccess).toBe(true);
  });

  it('should return false for Pro features when user is on Free', async () => {
    const hasAccess = await subscriptionService.canAccessFeature(
      'free-user-id',
      'ai_copilot'
    );
    expect(hasAccess).toBe(false);
  });
});
```

### E2E Test

```typescript
// e2e/feature-flags.spec.ts
test('should block Pro feature for Free user', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-feature="ai_copilot"]');
  await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
});

test('should enable Pro feature for Pro user', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-feature="ai_copilot"]');
  await expect(page.locator('[data-testid="ai-copilot-ui"]')).toBeVisible();
});
```

---

## 📊 Monitor Feature Usage

### Track Feature Usage

```typescript
import { subscriptionService } from '@/services/subscription-service';

// Track when user uses a feature
await subscriptionService.trackUsage({
  orgId: user.org_id,
  userId: user.id,
  feature: 'ai_copilot',
  quantity: 1,
  metadata: {
    action: 'generate_content',
    tokens_used: 150,
  },
});
```

### Get Usage Analytics

```sql
-- Get feature usage by plan
SELECT
  sp.slug AS plan,
  ff.flag_key AS feature,
  COUNT(*) AS usage_count,
  SUM(um.metric_value) AS total_usage
FROM usage_metrics um
JOIN feature_flags ff ON um.metric_type = 'feature_usage'
JOIN user_subscriptions us ON um.user_id = us.user_id
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE um.period_start >= NOW() - INTERVAL '30 days'
GROUP BY sp.slug, ff.flag_key
ORDER BY plan, feature;
```

---

## 🚨 Troubleshooting

### Feature Not Showing

1. **Check flag exists:**
   ```sql
   SELECT * FROM feature_flags WHERE flag_key = 'your_feature';
   ```

2. **Check plan access:**
   ```sql
   SELECT plan_access FROM feature_flags WHERE flag_key = 'your_feature';
   ```

3. **Check user subscription:**
   ```sql
   SELECT * FROM get_user_active_plan('user-id');
   ```

### User Has Access But Should Not

1. **Check explicit grants:**
   ```sql
   SELECT * FROM user_feature_access
   WHERE user_id = 'user-id' AND flag_key = 'your_feature';
   ```

2. **Revoke access:**
   ```sql
   DELETE FROM user_feature_access
   WHERE user_id = 'user-id' AND flag_key = 'your_feature';
   ```

---

## 📚 Related Docs

- [API Reference](./API_REFERENCE.md#feature-flags-api)
- [Pricing](./PRICING.md)
- [Subscription Service](../src/services/subscription-service.ts)

---

**Need help?** [Open an issue](https://github.com/longtho638-jpg/Well/issues) or [contact support](mailto:support@wellnexus.vn).
