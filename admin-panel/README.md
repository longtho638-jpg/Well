# WellNexus Founder Admin Panel

**Version:** 1.0.0-seed
**Status:** Production Ready

The **Founder Admin Panel** is the internal command center for WellNexus administrators. It provides deep visibility and control over the platform's operations, including distributor management, order processing, and performance analytics.

## 🚀 Key Features

- **📊 Real-time Dashboard:** Live revenue tracking, user growth metrics, and sales velocity charts using Recharts.
- **👥 Distributor Management:**
  - Comprehensive profile views.
  - Interactive genealogy/team tree visualization.
  - Performance history and rank tracking.
- **📦 Order Operations:**
  - Full lifecycle management (Processing -> Shipped -> Delivered).
  - Advanced filtering and search.
  - Invoice generation (planned).
- **🛍️ Customer CRM:**
  - Purchase history analysis.
  - Customer lifetime value (CLV) tracking.
- **🛡️ Security:** Role-Based Access Control (RBAC) protected routes.

## 🛠️ Tech Stack

- **Core:** React 19, TypeScript, Vite 5
- **State Management:**
  - **Server State:** TanStack Query (React Query) v5
  - **Client State:** Zustand (Auth/UI)
- **Styling:** Tailwind CSS v4, Radix UI (Primitives), Lucide React (Icons)
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest + React Testing Library

## 📂 Project Structure

```
src/
├── components/
│   ├── ui/           # Radix UI primitives (Button, Dialog, etc.)
│   ├── dashboard/    # Analytics widgets
│   ├── layout/       # Sidebar, Header, AdminLayout
│   └── ...
├── features/         # Feature-specific logic (optional)
├── hooks/            # Custom hooks (useAuth, useQuery...)
├── layouts/          # Page layouts
├── lib/              # Utilities (utils, supabase, axios)
├── pages/            # Route components
│   ├── auth/         # Login
│   ├── dashboard/    # Overview
│   ├── distributors/ # Distributor list & details
│   ├── orders/       # Order management
│   └── ...
├── services/         # API Integration layer
├── stores/           # Global client state (authStore)
└── types/            # TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
cd admin-panel
npm install
```

### Environment Setup
Create `.env` file in `admin-panel/` root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_API_URL=http://localhost:3000/api
```

### Development

```bash
npm run dev
```

### Testing

```bash
npm run test        # Run tests in watch mode
npm run test:run    # Run tests once
npm run test:coverage # Generate coverage report
```

### Build

```bash
npm run build
```

## 🧪 Testing Strategy

We maintain a strict **100% Pass Rate** policy.
- **Unit Tests:** Utility functions, hooks.
- **Integration Tests:** Page flows, form submissions.
- **Component Tests:** UI widget rendering and interaction.

## 🤝 Contribution Guidelines

1. **Branching:** `feature/feature-name` or `fix/bug-name`.
2. **Commits:** Follow Conventional Commits (`feat:`, `fix:`, `style:`).
3. **Linting:** Ensure `npm run lint` passes before pushing.
