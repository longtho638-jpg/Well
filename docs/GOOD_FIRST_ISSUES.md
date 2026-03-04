---
title: "Good First Issues - WellNexus RaaS"
labels: ["good first issue", "help wanted"]
assignees: []
---

## 🌱 Welcome Contributors!

These issues are perfect for first-time contributors. Each includes:
- Clear reproduction steps
- Expected behavior
- Testing guidance
- Estimated time: 15-30 minutes

---

## Documentation Issues

### #1 - Add Vietnamese translation for landing page
**Type:** `i18n` | **Difficulty:** 🟢 Easy | **Time:** 20 min

**Task:**
Add Vietnamese translations for missing keys in `src/locales/vi.ts`:
- `landing.hero.*`
- `landing.features.*`
- `landing.testimonials.*`

**Steps:**
1. Open `src/locales/en.ts` and copy English keys
2. Translate to Vietnamese in `src/locales/vi.ts`
3. Run `pnpm run i18n:validate` to verify

**Test:**
```bash
pnpm run i18n:validate
# Should pass with no missing keys
```

**Resources:**
- [i18n Guide](./docs/I18N_GUIDE.md)

---

### #2 - Fix broken link in CONTRIBUTING.md
**Type:** `docs` | **Difficulty:** 🟢 Easy | **Time:** 5 min

**Task:**
Update broken links in `docs/CONTRIBUTING.md`:
- Link to `CODE_OF_CONDUCT.md` is broken
- Link to `LICENSE` is broken

**Steps:**
1. Find all `[text](path)` patterns
2. Verify each path exists
3. Fix broken paths

**Test:**
```bash
# Open docs/CONTRIBUTING.md in browser
# Click all links - should not 404
```

---

### #3 - Add API examples to API_REFERENCE.md
**Type:** `docs` | **Difficulty:** 🟢 Easy | **Time:** 30 min

**Task:**
Add curl examples for these endpoints:
- `POST /api/auth/login`
- `GET /api/users/me`
- `POST /api/subscriptions`

**Steps:**
1. Open `docs/API_REFERENCE.md`
2. Add curl example under each endpoint
3. Include sample request/response

**Example:**
```bash
curl -X POST https://wellnexus.vn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

---

### #4 - Create README for examples folder
**Type:** `docs` | **Difficulty:** 🟢 Easy | **Time:** 15 min

**Task:**
Create `examples/README.md` with:
- Overview of example projects
- How to run each example
- Prerequisites

**Steps:**
1. List all folders in `examples/`
2. Write 2-3 sentences per example
3. Include setup commands

---

### #5 - Add JSDoc comments to utility functions
**Type:** `docs` | **Difficulty:** 🟢 Easy | **Time:** 25 min

**Task:**
Add JSDoc comments to functions in `src/utils/` without docs:
- `src/utils/format.ts`
- `src/utils/validation.ts`
- `src/utils/date.ts`

**Steps:**
1. Find functions without `/** */` comments
2. Add description, @param, @returns

**Example:**
```typescript
/**
 * Format currency amount to VND string.
 * @param amount - Amount in VND
 * @returns Formatted string (e.g., "1.000.000 ₫")
 */
export function formatCurrency(amount: number): string {
  // ...
}
```

---

## Testing Issues

### #6 - Add unit tests for formatDate utility
**Type:** `test` | **Difficulty:** 🟢 Easy | **Time:** 20 min

**Task:**
Write tests for `src/utils/date.ts` → `formatDate()` function.

**Steps:**
1. Create `src/utils/__tests__/date.test.ts`
2. Test valid date input
3. Test edge cases (invalid date, null, undefined)

**Example:**
```typescript
describe('formatDate', () => {
  it('should format valid date', () => {
    expect(formatDate(new Date('2026-03-04'))).toBe('04/03/2026');
  });

  it('should handle invalid date', () => {
    expect(() => formatDate(null)).toThrow('Invalid date');
  });
});
```

**Test:**
```bash
pnpm test src/utils/__tests__/date.test.ts
```

---

### #7 - Add tests for validation utilities
**Type:** `test` | **Difficulty:** 🟢 Easy | **Time:** 25 min

**Task:**
Add tests for `src/utils/validation.ts`:
- `isValidEmail()`
- `isValidPhone()`
- `isStrongPassword()`

**Steps:**
1. Create `src/utils/__tests__/validation.test.ts`
2. Test valid/invalid inputs for each function
3. Include edge cases

---

### #8 - Test FeatureFlag component rendering
**Type:** `test` | **Difficulty:** 🟡 Medium | **Time:** 30 min

**Task:**
Write test for `src/components/FeatureFlag.tsx` to verify:
- Shows upgrade prompt for non-Ent users
- Shows feature content for Ent users

**Steps:**
1. Create `src/components/__tests__/FeatureFlag.test.tsx`
2. Mock subscription context
3. Test both scenarios

---

## UI/Styling Issues

### #9 - Fix mobile padding on pricing page
**Type:** `style` | **Difficulty:** 🟢 Easy | **Time:** 15 min

**Issue:**
Pricing cards have insufficient padding on mobile (<640px).

**Steps:**
1. Open `src/pages/PricingPage.tsx`
2. Find pricing card container
3. Add responsive padding: `p-4 sm:p-6 lg:p-8`

**Test:**
- Open in browser DevTools
- Set viewport to 375px width
- Verify cards have proper spacing

---

### #10 - Add loading skeleton to dashboard
**Type:** `feature` | **Difficulty:** 🟡 Medium | **Time:** 30 min

**Task:**
Add skeleton loader to `src/pages/Dashboard.tsx` while data loads.

**Steps:**
1. Create `src/components/DashboardSkeleton.tsx`
2. Match layout of actual dashboard
3. Show while `isLoading === true`

**Reference:**
- [Skeleton Design](./docs/design-guidelines.md#loading-states)

---

### #11 - Improve button contrast in dark mode
**Type:** `style` | **Difficulty:** 🟢 Easy | **Time:** 15 min

**Issue:**
Secondary buttons have low contrast in dark mode.

**Steps:**
1. Open `src/components/Button.tsx`
2. Update dark mode styles
3. Test with WCAG contrast checker

**Test:**
```bash
# Use browser DevTools Accessibility tab
# Check contrast ratio > 4.5:1
```

---

### #12 - Add hover effect to feature cards
**Type:** `style` | **Difficulty:** 🟢 Easy | **Time:** 10 min

**Task:**
Add subtle hover animation to feature cards on landing page.

**Steps:**
1. Open `src/components/FeatureCard.tsx`
2. Add Framer Motion hover effect
3. Keep animation under 200ms

**Example:**
```tsx
<motion.div
  whileHover={{ y: -4, scale: 1.02 }}
  transition={{ duration: 0.2 }}
>
```

---

## Code Quality Issues

### #13 - Remove console.log from production code
**Type:** `fix` | **Difficulty:** 🟢 Easy | **Time:** 15 min

**Task:**
Find and remove all `console.log` statements from `src/`.

**Steps:**
```bash
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx"
```

2. Replace with proper logging utility or remove
3. Keep only for development environments

**Test:**
```bash
grep -rn "console\.log" src/
# Should return 0 results
```

---

### #14 - Replace any types with proper types
**Type:** `fix` | **Difficulty:** 🟡 Medium | **Time:** 30 min

**Task:**
Find and replace `any` types with proper TypeScript types.

**Steps:**
```bash
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"
```

2. Create interfaces for each `any` type
3. Update function signatures

**Test:**
```bash
grep -rn ": any" src/
# Should return 0 results
```

---

### #15 - Add error boundaries to pages
**Type:** `feature` | **Difficulty:** 🟡 Medium | **Time:** 25 min

**Task:**
Wrap page components with ErrorBoundary.

**Steps:**
1. Create `src/components/ErrorBoundary.tsx`
2. Wrap pages in `src/pages/`
3. Show fallback UI on error

---

## Accessibility Issues

### #16 - Add alt text to all images
**Type:** `a11y` | **Difficulty:** 🟢 Easy | **Time:** 20 min

**Task:**
Ensure all `<img>` tags have descriptive `alt` attributes.

**Steps:**
```bash
grep -rn "<img" src/ --include="*.tsx"
```

2. Add meaningful alt text
3. Use empty alt="" for decorative images

**Test:**
- Run axe DevTools browser extension
- No "Missing alt attribute" errors

---

### #17 - Add keyboard navigation to dropdown menus
**Type:** `a11y` | **Difficulty:** 🟡 Medium | **Time:** 30 min

**Task:**
Enable keyboard navigation for dropdown menus:
- Arrow keys to navigate
- Enter to select
- Escape to close

**Steps:**
1. Find dropdown components
2. Add onKeyDown handlers
3. Test with Tab/Arrow keys

---

### #18 - Fix focus order in forms
**Type:** `a11y` | **Difficulty:** 🟡 Medium | **Time:** 25 min

**Issue:**
Form focus order doesn't match visual order on some pages.

**Steps:**
1. Audit forms in `src/pages/`
2. Fix DOM order or add tabIndex
3. Test with Tab key navigation

---

## Performance Issues

### #19 - Lazy load heavy components
**Type:** `perf` | **Difficulty:** 🟡 Medium | **Time:** 30 min

**Task:**
Use React.lazy() for heavy components:
- Dashboard charts
- Network visualization
- AI copilot UI

**Steps:**
1. Identify components >50KB
2. Wrap with React.lazy()
3. Add Suspense fallback

**Example:**
```tsx
const DashboardChart = lazy(() => import('./DashboardChart'));

<Suspense fallback={<LoadingSpinner />}>
  <DashboardChart />
</Suspense>
```

---

### #20 - Optimize image sizes
**Type:** `perf` | **Difficulty:** 🟢 Easy | **Time:** 20 min

**Task:**
Compress and convert images to WebP format.

**Steps:**
1. Find images in `public/` and `src/assets/`
2. Convert to WebP
3. Update imports

**Test:**
```bash
# Check image sizes
ls -lh public/images/
# Should be <100KB each
```

---

## 🎯 Next Steps

1. Pick an issue above
2. Comment "I'd like to work on this!"
3. Create a fork and branch
4. Submit PR with `fixes #<issue-number>`

**Need help?** Join our [Discussions](https://github.com/longtho638-jpg/Well/discussions) or email support@wellnexus.vn

---

_Last Updated: 2026-03-04_
_Maintainer: @longtho638-jpg_
