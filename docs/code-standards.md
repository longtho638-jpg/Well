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
- **Strict Mode:** Enabled. No `any` types unless absolutely necessary.
- **Interfaces:**
  - **Shared:** `src/types.ts`
  - **Admin Specific:** `admin-panel/src/types/`
- **Props:** Use `interface Props` or `type Props`.

## Testing
- **Framework:** Vitest + React Testing Library.
- **Requirement:** 100% pass rate.
- **Scope:** Unit tests for utilities, Component tests for UI widgets.
- **Mocking:** Mock external services (Gemini, Firebase) to ensure isolated tests.

## Git Workflow
- **Commits:** Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`).
- **Branches:** `feature/name`, `bugfix/issue`.
- **Deployment:** Auto-deploy to Vercel on push to `main`.
