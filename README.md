# WellNexus 2.0: Agentic HealthFi OS (Pre-Seed)

A Hybrid Community Commerce platform for Vietnam, powered by a robust Agentic Operating System (Agent-OS) and Supabase backend.

## ✨ Key Features

- 🤖 **Agent-OS** - A swarm of 22+ AI agents (Coach, Sales Copilot, Reward Engine, Compliance) working together.
- 🛍️ **Social Commerce** - MLM/Affiliate marketplace with commission tracking.
- 💰 **HealthFi Wallet** - Dual-token system (SHOP for cashflow, GROW for equity) with automated tax compliance.
- 📊 **Agent Dashboard** - Real-time monitoring of AI agent performance and KPIs.
- ☁️ **Supabase Backend** - Scalable Postgres database, Authentication, and RLS policies.
- 📱 **Modern UI/UX** - Responsive, accessible (WCAG AA), and polished with Toast notifications.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase Account (Free Tier)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env.local` file:
```bash
cp .env.example .env.local
```
Populate with your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### 3. Database Setup
Run the SQL migrations in `supabase/migrations` in your Supabase SQL Editor to set up tables and RLS policies.

### 4. Run Local Development
```bash
npm run dev
```
Access the app at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
npm run preview
```

## 🧠 Agentic Architecture

WellNexus is built on a custom **Agent-OS** framework:

*   **Core Agents:**
    *   **Gemini Coach:** Personalized business advice and tax compliance checks.
    *   **Sales Copilot:** Real-time objection handling and script generation.
    *   **The Bee:** Reward engine for calculating points and gamification.
*   **Infrastructure:**
    *   **Registry:** Centralized agent management and discovery.
    *   **BaseAgent:** Abstract class providing logging, policy enforcement, and KPI tracking.
    *   **Supabase Sync:** Persistent storage of agent logs and user data.

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **State Management:** Zustand (with Agent-OS integration)
- **Backend:** Supabase (Postgres, Auth, Edge Functions ready)
- **AI:** Google Gemini Pro (via API)
- **Testing:** Vitest, React Testing Library

## 📂 Project Structure

```
src/
├── agents/              # Agent-OS Core & Implementations
│   ├── core/            # BaseAgent and interfaces
│   ├── custom/          # Custom business agents (Bee, Coach, Copilot)
│   └── registry.ts      # Agent Registry Singleton
├── components/          # React Components
│   ├── ui/              # Reusable UI (Button, Toast, Modal)
│   └── ...
├── hooks/               # Custom Hooks (useAgentOS, useAuth, useToast)
├── lib/                 # Infrastructure (Supabase client)
├── pages/               # Route Pages (AgentDashboard, Marketplace, etc.)
├── store.ts             # Global State (User, Data, Agents)
└── supabase/            # Database Migrations & Types
```

## 📝 Documentation

- [**BIZ_PLAN_2026.md**](./BIZ_PLAN_2026.md) - Vision and Roadmap.
- [**DESIGN_SYSTEM.md**](./DESIGN_SYSTEM.md) - UI/UX Guidelines.
- [**Agent Dashboard**](/dashboard/agents) - Visualize active agents (in-app).

## 🤝 Contributing

Contributions are welcome! Please follow the standard PR process.
Ensure all new code passes `npm run build` (0 errors) and follows the design system.

<!-- Updated: 2025-12-03 - Optimization Phase 5 -->