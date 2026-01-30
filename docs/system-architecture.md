# System Architecture

## Overview
WellNexus consists of two complementary client-side Single Page Applications (SPAs): the **Distributor Portal** (Root) and the **Admin Panel** (Subdirectory). Both interact with shared serverless backend services (Firebase) and AI APIs (Gemini).

## Architecture Diagram
```mermaid
graph TD
    subgraph "Clients"
        DistributorApp[Distributor Portal]
        AdminApp[Admin Panel]
    end

    subgraph "Frontend Layer (Distributor)"
        DistributorApp --> D_Router[React Router]
        D_Router --> D_Pages[Page Components]
        D_Pages --> D_Store[Zustand Store]
    end

    subgraph "Frontend Layer (Admin)"
        AdminApp --> A_Router[React Router]
        A_Router --> A_Pages[Admin Pages]
        A_Pages --> A_Query[TanStack Query]
    end

    subgraph "Service Layer"
        D_Store --> APIService
        A_Query --> APIService[Shared Service Logic]
    end

    subgraph "Backend / External"
        APIService --> Auth[Firebase Auth]
        APIService --> Firestore[Firestore DB]
        APIService --> GeminiAPI[Google Gemini]
    end
```

## Core Components

### 1. Distributor Portal (Frontend)
- **Framework:** React 18, Vite, TypeScript
- **State:** Zustand (Global State)
- **Focus:** Sales, Team Management, AI Coaching
- **Key Modules:** Dashboard, Marketplace, Agent-OS

### 2. Admin Panel (Frontend)
- **Framework:** React 19, Vite, TypeScript
- **State:** TanStack Query (Server State) + Zustand (Auth)
- **Styling:** Tailwind CSS + Radix UI
- **Focus:** Platform Oversight, Data Management, Analytics
- **Key Modules:**
    - **Distributor Manager:** View/Edit distributor details and hierarchies.
    - **Order Manager:** Transaction processing and status workflows.
    - **Customer CRM:** User data and behavior tracking.

### 3. Shared Services
- **Firebase:** Authentication and NoSQL Database.
- **Gemini AI:** Intelligence layer for coaching and agents.

### 4. Data Flow
- **Distributor Portal:** Optimized for real-time interaction and client-side state persistence.
  1. **Action:** User interacts with UI (e.g., "Buy Now").
  2. **State Update:** Component triggers Zustand action.
  3. **Service Call:** Action calls Service layer.
  4. **Mutation:** Store updates state.
  5. **Re-render:** Subscribed components update via selectors.
- **Admin Panel:** Optimized for data consistency and fresh server-side data fetching using React Query.

### 5. Security
- **Environment Variables:** API keys stored in `.env`.
- **Authentication:** Firebase Auth integration.
- **Compliance:** Automated tax calculation logic enforced on client-side (for MVP) before transaction recording.

## Deployment Pipeline
- **Host:** Vercel
- **Trigger:** Push to `main` branch.
- **Process:** Build -> Test -> Deploy -> CDN Propagation.
