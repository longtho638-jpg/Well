# WellNexus Architecture & Dependencies Report
Date: 260212
Author: Antigravity Researcher

## 1. Dependency Analysis (`package.json`)

### 🔴 Unused / Misplaced Dependencies
| Package | Status | Recommendation |
| :--- | :--- | :--- |
| `@payos/node` | **UNUSED** in `src/` | **REMOVE**. The PayOS implementation resides in Supabase Edge Functions (Deno-based) and uses raw HTTP fetch + Web Crypto API. This Node.js package is dead weight in the frontend bundle. |
| `dotenv` | Production Dependency | **MOVE to devDependencies**. Used only in `scripts/` for maintenance tasks. Vite handles environment variables natively via `import.meta.env`. |

### 🟡 Outdated / Notable Packages
| Package | Version | Note |
| :--- | :--- | :--- |
| `vite` | `^7.3.1` | **Bleeding Edge**. Ensure this version is stable and intended. Standard stable baseline is often conservative (v6.x) unless utilizing specific v7 features. |
| `react-router-dom` | `^6.22.0` | **Stable v6**. v7 is available but v6 is standard. No immediate action needed unless new data routers are required. |

### 🟢 Core Stack (Healthy)
- **Framework**: React 19 + TypeScript 5.9
- **State**: Zustand (Simple, effective for global state)
- **Forms**: React Hook Form + Zod (Best practice)
- **Styling**: Tailwind + Framer Motion (Modern standard)
- **Backend**: Supabase JS v2 (Solid)

## 2. Architecture Overview

### Structure
- **Frontend**: Single Page Application (Vite)
- **Backend Services**: Supabase (BaaS) + Edge Functions (Serverless)
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel (implied by `vercel.json`)

### ⚠️ Critical Architectural Findings

#### 1. Lack of Structured Data Fetching (High Priority)
- **Finding**: No usage of `TanStack Query` (`react-query`) or `SWR` found.
- **Impact**: Data fetching likely relies on `useEffect` + local state.
- **Risks**:
  - Race conditions in network requests.
  - Lack of caching/deduplication.
  - "Waterfall" loading states.
  - Boilerplate-heavy state management (`isLoading`, `error`, `data`).
- **Recommendation**: Introduce `@tanstack/react-query` for all server state management.

#### 2. PayOS Integration Split
- **Current State**: Frontend has `@payos/node` installed but unused. Backend (Edge Functions) implements payment logic manually using `fetch`.
- **Observation**: This is actually **GOOD** architecture (handling secrets server-side), but the frontend dependency is misleading trash.
- **Action**: Clean up `package.json` to reflect reality.

#### 3. I18n Structure
- **Current**: `i18next` with `react-i18next`.
- **Check**: Ensure translation files in `public/locales` or `src/locales` are synchronized. (Refer to existing `i18n:validate` scripts).

## 3. Unresolved Questions
- Is `vite` v7.3.1 strictly required for a specific plugin, or can we revert to a Long Term Support (LTS) version if instability occurs?
- Are there any "hidden" Node.js scripts in the repo that rely on `@payos/node` that `grep` missed (e.g., dynamically required)?

## 4. Action Plan (Next Steps)
1.  **Cleanup**: `npm uninstall @payos/node && npm install -D dotenv`
2.  **Refactor**: Audit `useEffect` data fetching and propose migration to `TanStack Query`.
3.  **Verify**: Ensure CI/CD passes after removing `@payos/node`.

