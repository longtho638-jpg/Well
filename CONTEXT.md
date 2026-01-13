# WellNexus Context & Architecture (10x Edition)

## 🌟 Project Vision
WellNexus is a "Wealth OS" platform combining Health Tech, Affiliate Marketing (MLM), and AI Agents.
**Status:** Production Ready (Go-Live).
**Architecture:** Claudekit Standard (10x Optimized).

## 🏗️ Core Architecture (The "10x" Stack)
- **Frontend:** React 18, Vite, TailwindCSS (Aura Design System).
- **State Management:** Zustand (Decomposed Slices) + React Query (via Hooks).
- **Backend:** Supabase (Auth, DB, Realtime) + Firebase (Legacy/Backup).
- **AI Core:** Claudekit (Local Agent Orchestration).

## 🤖 The Agent Ecosystem (Claudekit)
We employ a squad of specialized agents defined in `.claude/agents/`:
1.  **The Bee (Product/UX):** Manages user journeys and gamification.
2.  **AgencyOS (Ops):** Orchestrates system commands and workflows.
3.  **Experts:**
    - `react-expert`: UI/UX optimization.
    - `refactoring-expert`: Code cleanliness.
    - `performance-expert`: Speed tuning.
    - `security-expert`: Vulnerability scanning.

## 🛠️ Key Workflows
- **/plan:** Architecture design & roadmap.
- **/code:** Implementation with auto-linting & performance checks.
- **/ship:** Deployment readiness & security audit.
- **/refactor:** Automated technical debt reduction.

## 🔒 Security & Data Integrity
- **Authentication:** Supabase Auth (Strict Mode).
- **Data Access:** RLS Policies (Row Level Security).
- **Secrets:** Environment variables only (No hardcoded keys).
- **Realtime:** Postgres Replication enabled for `users` table.

## 📂 Directory Structure Highlights
- `src/agents`: In-app agent logic (The Bee, AgencyOS).
- `.claude`: Meta-agent definitions (Claudekit).
- `supabase/migrations`: Database schema & RPCs.
- `docs/architecture`: Deep technical specs.

---
*Last Updated: 2026-01-13 (Post-10x Optimization)*