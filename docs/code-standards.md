# Code Standards

## General Principles
- **YAGNI (You Aren't Gonna Need It):** Do not over-engineer. Implement only what is needed now.
- **KISS (Keep It Simple, Stupid):** Prefer simple solutions over complex ones.
- **DRY (Don't Repeat Yourself):** Extract common logic into hooks or utility functions.

## File Organization
- **Naming Convention:** `kebab-case` for files (e.g., `commission-widget.tsx` is preferred, though PascalCase is used for Components currently in this project - *Note: Project uses PascalCase for components, adhering to that*).
- **Component Co-location:** Tests (`.test.tsx`) should be located next to the component file.
- **File Size:** Keep files under 200 lines where possible. Split large components.

## Coding Style
- **Components:** Functional components with TypeScript interfaces.
- **State Management:**
  - **Distributor Portal:** Use Zustand for global state.
  - **Admin Panel:** Use TanStack Query for server state (caching, invalidation) and Zustand for client state (auth).
- **Styling:** Tailwind CSS utility classes. Use `clsx` and `tailwind-merge` for conditional styling.
  - **Admin Panel:** Use Radix UI primitives for accessible interactive components.
  ```tsx
  // Example
  <div className={cn('p-4 bg-white', active && 'bg-blue-50')}>...</div>
  ```
- **Imports:** Group imports: External -> Internal -> Types -> Styles. Use `@/` alias.

## TypeScript
- **Strict Mode:** Enabled. Zero-tolerance policy for `any` types.
- **Prohibited Patterns:**
  - ❌ `: any` types (use proper interfaces/types)
  - ❌ `as any` casts (use proper type assertions or `unknown`)
  - ❌ `@ts-ignore` without justification
- **Recommended Patterns:**
  - ✅ Interface definitions for external data
  - ✅ Union types for multiple possibilities
  - ✅ Generic types for reusable logic
  - ✅ Type guards for runtime checks
- **Interfaces:**
  - **Shared:** `src/types.ts`
  - **Admin Specific:** `admin-panel/src/types/`
- **Props:** Use `interface Props` or `type Props`.
- **Verification:** `tsc --noEmit`, `npm run lint`, and tests must pass before commit.

## Accessibility (a11y)
- **Standards:** WCAG 2.1 AA compliance.
- **Semantic HTML:** Use proper HTML5 semantic elements (`<nav>`, `<main>`, `<article>`, etc.).
- **ARIA:** Use ARIA roles and attributes only when necessary (e.g., custom widgets).
- **Keyboard Navigation:** Ensure all interactive elements are focusable and usable via keyboard.
- **Testing:** Verify with screen readers and keyboard-only navigation.

## Internationalization (i18n)
- **Framework:** React i18next with `useTranslation` hook.
- **Required Practice:** ALL user-facing strings MUST use the `t()` function.
- **File Organization:**
  - `src/locales/en.ts` - English translations (base language)
  - `src/locales/vi.ts` - Vietnamese translations
- **Key Naming Convention:**
  - Use domain-based organization: `auth.*`, `dashboard.*`, `checkout.*`, etc.
  - Use camelCase for key names: `agentDashboard`, `quickPurchase`
  - NO keys starting with numbers (invalid JavaScript property names)
- **Prohibited Patterns:**
  - ❌ Hardcoded strings in JSX: `<button>Login</button>`
  - ❌ String concatenation for dynamic text
  - ❌ Duplicate top-level keys in locale files
- **Recommended Patterns:**
  - ✅ Use translation function: `<button>{t('auth.login')}</button>`
  - ✅ Interpolation for dynamic values: `t('welcome', { name: user.name })`
  - ✅ Organize by feature/page: `checkout.guestForm.email`, `dashboard.stats.revenue`
- **Verification:** Build must pass with zero duplicate key errors.

## Security Best Practices
- **API Key Security:**
  - ❌ NEVER expose API keys in client code (no `VITE_*` environment variables for secrets)
  - ✅ Use Supabase Edge Functions for server-side API calls
  - ✅ Store secrets in Supabase Secrets or Vercel Environment Variables
  - **Example:**
    ```typescript
    // ❌ BAD - Client-side API key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // ✅ GOOD - Proxy through Edge Function
    const { data } = await supabase.functions.invoke('gemini-chat', {
      body: { message }
    });
    ```
- **Prototype Pollution Prevention:**
  - ❌ Direct object key assignment without validation
  - ✅ Validate keys against `FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype']`
  - **Location:** See `src/utils/deep.ts` for reference implementation
  - **Example:**
    ```typescript
    // ✅ GOOD - Validate before assignment
    if (FORBIDDEN_KEYS.includes(key)) continue;
    ```
- **Memory Leak Prevention:**
  - ✅ Always cleanup side effects in useEffect return function
  - ✅ Cancel animation frames: `cancelAnimationFrame(animationId)`
  - ✅ Remove event listeners: `window.removeEventListener('resize', handler)`
  - **Example:**
    ```typescript
    useEffect(() => {
      const animationId = requestAnimationFrame(animate);
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
      };
    }, []);
    ```
- **Type Safety:**
  - ❌ Non-null assertions (`element!`, `value!`) bypass null checks
  - ✅ Proper null checks with explicit error handling
  - **Example:**
    ```typescript
    // ❌ BAD - Bypasses null safety
    const root = document.getElementById('root')!;

    // ✅ GOOD - Proper null check
    const root = document.getElementById('root');
    if (!root) throw new Error('Root element not found');
    ```
- **Input Validation:**
  - ✅ Use Zod schemas for form validation (see `src/utils/validation/checkoutSchema.ts`)
  - ✅ Sanitize user input before rendering
  - ✅ Validate API responses before processing

## Testing
- **Framework:** Vitest + React Testing Library.
- **Requirements:**
  - ✅ 100% pass rate (zero failing tests)
  - ✅ Coverage thresholds: 70% lines, 70% functions
  - ✅ All critical paths must have tests
- **Scope:**
  - Unit tests for utilities (`src/utils/*.test.ts`)
  - Component tests for UI widgets (`src/components/*.test.tsx`)
  - Integration tests for user flows (`src/__tests__/*-flow.integration.test.ts`)
- **Mocking:** Mock external services (Gemini, Supabase) to ensure isolated tests.
- **Coverage Configuration:**
  ```typescript
  // vitest.config.ts
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    thresholds: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70
    }
  }
  ```
- **Pre-commit Verification:**
  - `npm test` - All tests must pass
  - `npm run build` - Build must succeed
  - `tsc --noEmit` - TypeScript compilation must succeed

## Git Workflow
- **Commits:** Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`).
- **Branches:** `feature/name`, `bugfix/issue`.
- **Deployment:** Auto-deploy to Vercel on push to `main`.
