# Optimization Plan: WellNexus 2.0

This plan outlines the steps to optimize the WellNexus platform, focusing on performance, scalability, and code quality.

## Phase 1: Database Schema Enhancement

**Goal:** Optimize Supabase schema for performance and new features.

**Tasks:**
1.  **Review current schema:** Analyze `supabase/migrations/20241203_initial_schema.sql`.
2.  **Add indexes:** Add indexes to frequently queried columns (e.g., `user_id` in transactions, `agent_name` in logs).
3.  **Create `agent_kpis` table:** If not already present in the migration file, add it to store KPI data persistently.
4.  **Optimize RLS policies:** Ensure policies are efficient and cover all new tables.

**Deliverable:** Updated `supabase/migrations/20241203_initial_schema.sql`.

## Phase 2: Codebase Cleanup & Type Safety

**Goal:** Resolve technical debt and strict type checking.

**Tasks:**
1.  **Fix TypeScript errors:** Address the 26+ errors in `src/components/ui/*.test.tsx` and others reported in builds.
2.  **Standardize imports:** Ensure consistent use of `@/` aliases.
3.  **Remove unused code:** Identify and delete dead code or unused mock data if replaced by Supabase.

**Deliverable:** Clean `npm run build` output (0 errors).

## Phase 3: Agent Performance Optimization

**Goal:** Improve agent execution speed and reliability.

**Tasks:**
1.  **Refactor Agent Registry:** Optimize the singleton pattern if needed.
2.  **Caching:** Implement simple caching for agent responses (e.g., caching `getCoachAdvice` results for a session).
3.  **Error Handling:** Enhance error boundaries in `useAgentOS` and agent execution methods.

**Deliverable:** Optimized `src/agents/core` and hooks.

## Phase 4: UI/UX Polish

**Goal:** Enhance the visual experience and feedback.

**Tasks:**
1.  **Loading States:** Add better loading skeletons for dashboard and agent interactions.
2.  **Toast Notifications:** Implement a toast system for agent actions (e.g., "Reward calculated").
3.  **Responsive Design:** Verify and fix any mobile layout issues in the Dashboard.

**Deliverable:** Improved UI components.

## Phase 5: Documentation & Deployment

**Goal:** Finalize documentation for handoff.

**Tasks:**
1.  **Update README:** Reflect the new Agent-OS architecture and Supabase setup.
2.  **API Docs:** Document the Agent-OS hook and available agents.
3.  **Deployment Check:** Verify Vercel build configuration.

**Deliverable:** Updated `README.md` and docs.
