# Project Overview & PDR

## Project Overview
**WellNexus** is a Hybrid Community Commerce platform MVP designed for the Vietnamese market. It combines social selling, AI-powered business coaching, automated tax compliance, and tokenomics in a single React-based web application.

- **Current Stage:** Seed Stage MVP (v1.0.0-seed)
- **Target Market:** Vietnam (VND currency, Vietnamese tax law)
- **Key Value Prop:** Empowering distributors with AI tools and simplified compliance.

## Product Development Requirements (PDR)

### 1. Core Objectives
- **Empower Distributors:** Provide real-time visibility into earnings and team performance.
- **Streamline Sales:** Reduce friction in the purchasing process.
- **Automate Compliance:** Handle Vietnamese tax calculations automatically.
- **AI Integration:** Leverage Google Gemini for personalized coaching and sales assistance.
- **Platform Governance:** Provide robust tools for administrators to oversee operations (Admin Panel).

### 2. Functional Requirements

#### A. Dashboard & Analytics (Distributor)
- **Commission Tracking:** Real-time display of earnings (Direct vs Team) with period filtering (Today, 7d, 30d).
- **Trend Analysis:** Visual indicators of growth/decline compared to previous periods.
- **Team Metrics:** Leaderboards and team volume tracking.

#### B. Marketplace & Sales (Distributor)
- **Product Catalog:** Browsable list of products with commission rates.
- **Quick Purchase:** "Favorites" and "Recent" items for rapid checkout.
- **Express Checkout:** Minimized clicks to purchase.

#### C. Gamification (Distributor)
- **Quests:** Daily tasks to drive engagement.
- **Ranks:** Progression system (Member -> Partner -> Founder Club).

#### D. Agent System (Agency of Agents)
- **Agent Registry:** Centralized management of AI agents.
- **Specific Agents:**
  - **Coach Agent:** Business advice.
  - **Sales Copilot:** Objection handling.
  - **Reward Engine:** Commission calculations.

#### E. Admin Panel (Management)
- **Overview:** Centralized dashboard for platform metrics (revenue, user growth).
- **Distributor Management:** Search, view, and manage distributor profiles and downlines.
- **Order Operations:** Full lifecycle management of orders (View, Update Status, Refund).
- **Customer CRM:** View customer purchase history and support details.
- **Security:** Role-based access control (RBAC) for admin staff.

#### F. Authentication & Security (Common)
- **Password Recovery:** Secure forgot/reset password flow via email link.
- **Password Strength:** Real-time strength validation and feedback during reset.
- **Secure Storage:** Encrypted in-memory token management (no localStorage).

### 3. Non-Functional Requirements
- **Performance:** Sub-second load times, smooth animations (60fps).
- **Responsiveness:** Mobile-first design, fully functional on all device sizes.
- **Localization:** Full support for Vietnamese (vi) and English (en).
- **Accessibility:** WCAG AA compliance for core flows.
- **Observability:** Real-time error tracking (Sentry) and performance monitoring.
- **Security:** Secure handling of user data, API keys, and HTTP headers (CSP, HSTS).

### 4. Technical Constraints
- **Framework:** React 19 with TypeScript 5.7+.
- **State:** Zustand for global state.
- **Styling:** Tailwind CSS.
- **Deployment:** Vercel (CI/CD pipeline).
