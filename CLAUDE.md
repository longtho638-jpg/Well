# CLAUDE.md - AI Assistant Guide for WellNexus MVP

## Project Overview

**WellNexus** is a Hybrid Community Commerce platform MVP designed for the Vietnamese market. It combines social selling, AI-powered business coaching, automated tax compliance, and tokenomics in a single React-based web application.

**Current Stage:** Seed Stage MVP (v1.0.0-seed) - Phase 2 Growth Features
**Architecture:** Frontend-only SPA with mock data + Firebase integration
**Target Market:** Vietnam (VND currency, Vietnamese tax law)
**Deployment:** Vercel (Primary), Firebase Hosting (Legacy)

### Key Features

#### Phase 1: Core Features
- Multi-level marketing (MLM) commission tracking
- AI coaching assistant powered by Google Gemini
- Automated Vietnam tax compliance (Circular 111/2013/TT-BTC)
- Gamification system with quests and rank progression
- Real-time commission wallet and transaction history
- Product marketplace with AI-powered recommendations

#### Phase 2: Growth Features (NEW)
- **The Copilot** - AI sales assistant with objection handling
- **Leader Dashboard** - Team management and analytics
- **Referral System** - Advanced referral tracking and rewards
- **Health Coach** - Personalized health coaching
- **Marketing Tools** - Automated marketing campaigns
- **Leaderboard** - Competitive rankings and challenges
- **Admin Panel** - System administration and policy engine
- **Health Check** - System monitoring and diagnostics
- **Tokenomics** - SHOP/GROW token system with staking

---

## Technology Stack

### Core Framework
- **React 18.2.0** with TypeScript
- **Vite 5.1.5** for build tooling
- **React Router v6** for client-side routing
- **Zustand 4.5.0** for global state management

### UI/UX Libraries
- **Tailwind CSS 3.4.1** - Utility-first styling
- **Lucide React 0.344.0** - Icon library
- **Framer Motion 11.0.8** - Animations
- **Recharts 2.12.0** - Data visualization
- **clsx + tailwind-merge** - Conditional class utilities

### External Services
- **Google Gemini AI** (@google/generative-ai 0.21.0) - AI coaching features
- **Firebase 12.6.0** - Backend services, authentication, storage

### Testing & Quality
- **Vitest 4.0.12** - Unit testing framework
- **@testing-library/react 16.3.0** - Component testing
- **@testing-library/jest-dom 6.9.1** - DOM matchers
- **happy-dom / jsdom** - DOM environment for tests

---

## Codebase Structure

```
/home/user/Well/
├── src/
│   ├── App.tsx                      # Main router with AppLayout wrapper
│   ├── main.tsx                     # Application entry point (renamed from index.tsx)
│   ├── index.css                    # Global styles with Tailwind imports
│   ├── store.ts                     # Zustand global state management
│   ├── types.ts                     # TypeScript type definitions (extended)
│   ├── SingleFileApp.tsx            # Portable standalone version (28KB)
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── AppLayout.tsx            # Layout wrapper for protected routes
│   │   ├── Sidebar.tsx              # Navigation + AI coach widget
│   │   ├── ProductCard.tsx          # Product listing card
│   │   ├── CommissionWallet.tsx     # Transaction history & tax display
│   │   ├── OnboardingQuest.tsx      # Quest/gamification component
│   │   ├── TheCopilot.tsx           # AI sales assistant component
│   │   ├── WithdrawalModal.tsx      # Withdrawal request modal
│   │   ├── Dashboard/               # Dashboard-specific components
│   │   │   ├── HeroCard.tsx         # Founder Club progress banner
│   │   │   ├── StatsGrid.tsx        # KPI metrics cards
│   │   │   ├── RevenueChart.tsx     # 7-day revenue chart
│   │   │   ├── QuickActionsCard.tsx # Quick action buttons
│   │   │   └── TopProducts.tsx      # Best sellers list
│   │   └── ui/                      # Reusable UI component library
│   │       ├── Modal.tsx            # Accessible modal with focus trap
│   │       ├── Button.tsx           # Multi-variant button component
│   │       └── Input.tsx            # Form input with validation
│   │
│   ├── pages/                       # Route-level page components
│   │   ├── LandingPage.tsx          # Marketing homepage
│   │   ├── Dashboard.tsx            # Main dashboard overview
│   │   ├── Marketplace.tsx          # Product catalog
│   │   ├── ProductDetail.tsx        # Individual product view
│   │   ├── Wallet.tsx               # Dedicated wallet page
│   │   ├── CopilotPage.tsx          # The Copilot interface
│   │   ├── LeaderDashboard.tsx      # Team management dashboard
│   │   ├── ReferralPage.tsx         # Referral system interface
│   │   ├── HealthCoach.tsx          # Health coaching features
│   │   ├── HealthCheck.tsx          # System health monitoring
│   │   ├── Leaderboard.tsx          # Competitive leaderboard
│   │   ├── MarketingTools.tsx       # Marketing automation tools
│   │   ├── Admin.tsx                # Admin panel
│   │   └── Admin/
│   │       └── PolicyEngine.tsx     # Policy management engine
│   │
│   ├── services/                    # External service integrations
│   │   ├── geminiService.ts         # Google Gemini AI API wrapper
│   │   ├── firebase.ts              # Firebase configuration & initialization
│   │   ├── copilotService.ts        # AI sales assistant with objection handling
│   │   └── api.ts                   # API abstraction layer
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── index.ts                 # Hook exports
│   │   ├── useAgent.ts              # Agent management hook
│   │   ├── useAuth.ts               # Authentication hook
│   │   └── useWallet.ts             # Wallet operations hook
│   │
│   ├── utils/                       # Helper functions
│   │   ├── format.ts                # VND currency & number formatting
│   │   ├── format.test.ts           # Format utility tests
│   │   ├── tax.ts                   # Vietnam tax calculations
│   │   ├── tax.test.ts              # Tax calculation tests
│   │   └── tokenomics.ts            # Token economics calculations
│   │
│   ├── data/                        # Mock data for MVP
│   │   └── mockData.ts              # Seed products, users, transactions, teams
│   │
│   └── test/                        # Test setup and utilities
│
├── public/                          # Static assets
├── index.html                       # HTML template
├── package.json                     # Dependencies (with test scripts)
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite build configuration
├── tailwind.config.js               # Tailwind theming
├── vercel.json                      # Vercel deployment config
├── firebase.json                    # Firebase hosting config
├── firestore.indexes.json           # Firestore index definitions
│
├── README.md                        # Project documentation
├── CLAUDE.md                        # This file - AI assistant guide
├── USER_ONBOARDING.md               # End-user guide
├── DESIGN_SYSTEM.md                 # Design system documentation
├── DEPLOYMENT.md                    # Deployment guide
├── VERCEL_DEPLOYMENT.md             # Vercel-specific deployment guide
├── BRAND_CONTENT_STRATEGY.md        # Brand and content strategy
├── BRAND_REPOSITION_SUMMARY.md      # Brand repositioning summary
├── UI_ANALYSIS.md                   # UI analysis and recommendations
├── UI_SUMMARY.md                    # UI summary document
├── UI_IMPLEMENTATION_DETAILS.md     # Detailed UI implementation guide
└── UI_ANALYSIS_README.md            # UI analysis overview
```

---

## Development Workflows

### Setup & Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test                  # Watch mode
npm run test:ui           # Interactive UI
npm run test:run          # Run once
npm run test:coverage     # With coverage report
```

### Testing Infrastructure

**✅ FULLY IMPLEMENTED** with Vitest

**Test Files:**
- `src/utils/format.test.ts` - Currency and number formatting tests
- `src/utils/tax.test.ts` - Tax calculation tests

**Running Tests:**
```bash
# Watch mode (recommended during development)
npm test

# Interactive UI (visual test runner)
npm run test:ui

# Run once (CI/CD)
npm run test:run

# Coverage report
npm run test:coverage
```

**Writing Tests:**
```typescript
import { describe, it, expect } from 'vitest';
import { formatVND } from './format';

describe('formatVND', () => {
  it('should format Vietnamese currency correctly', () => {
    expect(formatVND(1000000)).toBe('1.000.000 đ');
  });
});
```

### Vercel Deployment (Primary)

⚠️ **CRITICAL DEPLOYMENT RULE:**
**ALL code changes MUST be deployed to Vercel immediately. NO technical debt allowed.**

#### Deployment Workflow

```bash
# 1. Make your changes on feature branch
git add .
git commit -m "feat: your feature description"

# 2. Checkout main branch
git checkout main
git pull origin main

# 3. Merge feature branch
git merge your-feature-branch

# 4. Push to main (triggers automatic Vercel deployment)
git push -u origin main
```

#### Vercel Configuration

The project is configured with `vercel.json`:
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **SPA Routing:** All routes redirect to `/index.html`

#### Deployment Rules

1. ✅ **Every commit to `main` branch auto-deploys to production**
2. ✅ **Feature branches create preview deployments automatically**
3. ⚠️ **NEVER leave code undeployed on main branch**
4. ⚠️ **Always verify deployment succeeds after pushing**
5. ✅ **Preview URLs available for all PRs**

#### Verifying Deployment

After pushing to main:
1. Check Vercel dashboard for deployment status
2. Wait for build to complete (~1-2 minutes)
3. Verify changes on production URL
4. Check preview deployment for feature branches

### Firebase Deployment (Legacy)

```bash
# Login to Firebase
firebase login

# Initialize Firebase (only first time)
firebase init hosting
# Select: public directory = "dist", single-page app = "Yes"

# Build and deploy
npm run build
firebase deploy
```

**Note:** Firebase deployment is maintained for backup but Vercel is the primary deployment target.

### Path Aliases

The project uses `@/*` alias for imports:
```typescript
// Both work:
import { formatVND } from '@/utils/format';
import { formatVND } from '/src/utils/format';
```

Configured in:
- `tsconfig.json` (line 21-24)
- `vite.config.ts` (line 6-10)

---

## Key Conventions & Patterns

### State Management

**Single Zustand Store** (`src/store.ts`)

The entire application state is managed by one Zustand store with Phase 2 extensions:

```typescript
interface AppState {
  // Authentication
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  // Core Data Models
  user: User;
  products: Product[];
  transactions: Transaction[];
  quests: Quest[];
  revenueData: ChartDataPoint[];

  // Phase 2: Growth Features
  teamMembers: TeamMember[];
  teamMetrics: TeamMetrics;
  referrals: Referral[];
  referralStats: ReferralStats;

  // Actions
  completeQuest: (questId: string) => void;
  simulateOrder: (productId: string) => Promise<void>;
}
```

**Usage Pattern:**
```typescript
import { useStore } from '@/store';

function MyComponent() {
  const { user, products, simulateOrder } = useStore();
  // Use Zustand selectors for optimal performance
  const user = useStore(state => state.user); // Re-renders only when user changes
}
```

### Type System

All TypeScript interfaces are centralized in `src/types.ts`:

**Core Types:**
- `User` - User profile with rank, sales, team volume, KYC status
- `Product` - Product info with commission rates
- `Transaction` - Financial transactions with tax data and blockchain hash
- `Quest` - Gamification tasks
- `UserRank` enum - Member → Partner → Founder Club
- `TransactionType` - "Direct Sale" | "Team Volume Bonus" | "Withdrawal"
- `TokenType` - "SHOP" | "GROW"

**Phase 2 Types:**
- `TokenBalance` - Token balances (amount, locked, staking)
- `CopilotConversation` - AI assistant conversation state
- `CopilotMessage` - Individual messages with objection detection
- `ObjectionType` - Sales objection categories (price, skepticism, competition, timing, need)
- `ObjectionTemplate` - Response templates for objection handling
- `TeamMember` - Team member profile with performance metrics
- `TeamMetrics` - Aggregated team performance data
- `Referral` - Referral tracking with status and revenue
- `ReferralStats` - Referral program statistics
- `ReferralReward` - Referral reward payments

**Always import from types.ts:**
```typescript
import { User, Product, UserRank, TokenType, CopilotConversation } from '@/types';
```

### Component Patterns

**1. Page Components** (`src/pages/`)
- Control full-page layouts
- Use `useStore()` for global state
- Pass data down to child components
- Handle routing logic
- Wrapped by `AppLayout` for protected routes

**2. Reusable Components** (`src/components/`)
- Props-based configuration with TypeScript interfaces
- Framer Motion for animations
- Self-contained logic
- Event handlers with async/await
- Use UI component library for consistency

**3. UI Component Library** (`src/components/ui/`)
- Accessible components (WCAG AA compliant)
- Modal with focus trap
- Button with multiple variants
- Input with validation states

**Example:**
```typescript
interface ProductCardProps {
  product: Product;
  onPurchase: (id: string) => void;
}

export default function ProductCard({ product, onPurchase }: ProductCardProps) {
  // Component logic
}
```

### Service Layer

**Gemini AI Service** (`src/services/geminiService.ts`)

```typescript
// Get AI coaching advice
const advice = await getCoachAdvice(user);

// Check tax compliance
const isCompliant = await checkCompliance(transaction);
```

**Copilot Service** (`src/services/copilotService.ts`)

AI sales assistant with objection handling:

```typescript
// Detect objection type from customer message
const objectionType = detectObjection(customerMessage);

// Get appropriate response template
const response = getObjectionResponse(objectionType);

// Available objection types:
// - 'price' - Cost concerns
// - 'skepticism' - Trust issues
// - 'competition' - Competitor comparisons
// - 'timing' - Not ready to buy
// - 'need' - Don't need the product
// - 'general' - Other objections
```

**Firebase Service** (`src/services/firebase.ts`)

Firebase configuration and initialization for backend integration.

**API Service** (`src/services/api.ts`)

API abstraction layer for future backend integration.

**Important:** API keys should use environment variables. See Environment Variables section.

### Custom Hooks

**useAgent** (`src/hooks/useAgent.ts`)
Agent management for AI features

**useAuth** (`src/hooks/useAuth.ts`)
Authentication state and operations

**useWallet** (`src/hooks/useWallet.ts`)
Wallet operations and balance management

**Usage:**
```typescript
import { useAuth, useWallet } from '@/hooks';

function MyComponent() {
  const { user, login, logout } = useAuth();
  const { balance, withdraw, stake } = useWallet();
  // ...
}
```

### Utility Functions

**Currency Formatting** (`src/utils/format.ts`)
```typescript
formatVND(1500000) // "1.500.000 đ"
formatNumber(5000) // "5.000"
formatPercent(12.5) // "+12.5%"
```

**Tax Calculations** (`src/utils/tax.ts`)
```typescript
calculateTax(amount: number): number
// Applies 10% tax above 2,000,000 VND threshold
// Based on Vietnam Circular 111/2013/TT-BTC
```

**Tokenomics** (`src/utils/tokenomics.ts`)
```typescript
// Calculate staking rewards
calculateStakingReward(amount, apy, days)

// Format token amounts with symbols
formatToken(amount, 'SHOP') // "1,500.00 đ"
formatToken(amount, 'GROW') // "1,500.00 Token"

// Generate blockchain transaction hash
generateTxHash() // "0x..."
```

---

## Critical Business Logic

### Vietnam Tax Compliance

**Tax Rules:**
- **Threshold:** 2,000,000 VND
- **Rate:** 10% (Personal Income Tax)
- **Scope:** All commissions and bonuses

**Implementation:**
```typescript
const TAX_THRESHOLD = 2_000_000;
const TAX_RATE = 0.1;

if (amount > TAX_THRESHOLD) {
  return (amount - TAX_THRESHOLD) * TAX_RATE;
}
```

Location: `src/utils/tax.ts`
Tests: `src/utils/tax.test.ts`

### Commission Structure

Products have variable commission rates (15-25%):

```typescript
// Commission calculation
const commission = product.price * product.commissionRate;

// Example:
// ANIMA 119: 15,900,000 VND × 0.25 = 3,975,000 VND commission
```

### Rank Progression System

```
Member (default)
  ↓
Partner (active sales)
  ↓
Founder Club (100M VND team volume)
```

**Tracked metrics:**
- `user.totalSales` - Direct sales by user
- `user.teamVolume` - Total sales including downline

### Transaction Types

1. **Direct Sale** - Commission from personal sale
2. **Team Volume Bonus** - Commission from downline sales
3. **Withdrawal** - Cash-out request

All transactions automatically calculate tax deductions and generate blockchain hashes.

### Tokenomics System

**Token Types:**
- **SHOP Token** - Shopping/commerce token (tied to VND)
- **GROW Token** - Growth/staking token

**Token Operations:**
- Staking with APY rewards
- Lock periods for bonus rates
- Transaction hash generation for blockchain compatibility

---

## Routing Architecture

**Routes Configuration:**

```
/ (LandingPage)
  │
  ├─ /admin (Admin Panel)
  │   └─ /admin/policy-engine (Policy Engine)
  │
  └─ /dashboard/* (Protected routes - requires authentication, wrapped in AppLayout)
       ├─ /dashboard (Dashboard overview)
       ├─ /dashboard/marketplace (Product catalog)
       ├─ /dashboard/product/:id (Product detail)
       ├─ /dashboard/wallet (Commission wallet)
       │
       └─ Phase 2 Features:
           ├─ /dashboard/copilot (The Copilot - AI sales assistant)
           ├─ /dashboard/team (Leader Dashboard)
           ├─ /dashboard/referral (Referral system)
           ├─ /dashboard/health-coach (Health coaching)
           ├─ /dashboard/health-check (System monitoring)
           ├─ /dashboard/leaderboard (Competitive rankings)
           └─ /dashboard/marketing-tools (Marketing automation)
```

**Authentication Flow:**
- Unauthenticated users see `LandingPage`
- After login, redirect to `/dashboard`
- All `/dashboard/*` routes check `isAuthenticated` state
- Protected routes use `AppLayout` wrapper with Sidebar

**Route Protection:**
```typescript
<Route
  path="/dashboard"
  element={isAuthenticated ? <AppLayout /> : <Navigate to="/" replace />}
>
  {/* Nested routes here */}
</Route>
```

Location: `src/App.tsx`
Layout: `src/components/AppLayout.tsx`

---

## Design System

### Color Palette

```javascript
// Tailwind config (tailwind.config.js)
colors: {
  primary: '#00575A',     // Deep Teal
  accent: '#FFBF00',      // Marigold
  background: '#F3F4F6',  // Off-white
  text: '#1F2937',        // Dark gray
}
```

### Typography
- **Font Family:** Inter (via Google Fonts CDN)
- **Font Sizes:** Tailwind default scale

### Responsive Breakpoints
- `md:` - 768px (tablet)
- `lg:` - 1024px (desktop)

### Animation Conventions
- Use Framer Motion for complex animations
- Tailwind `transition-*` utilities for simple states
- Keep animations under 300ms for UX

### Component Utilities
- **clsx** - Conditional class names
- **tailwind-merge** - Merge Tailwind classes without conflicts

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// Usage
<div className={cn('base-class', isActive && 'active-class', className)} />
```

📖 **Complete Design System:** See `DESIGN_SYSTEM.md` for comprehensive documentation.

---

## Mock Data System

**Location:** `src/data/mockData.ts`

**Includes:**
- 3 sample products (ANIMA 119, Starter Kit, Immune Boost)
- Mock user profile (Lan Nguyen, Partner rank)
- Sample transactions with tax calculations and blockchain hashes
- Daily quests for gamification
- 7-day revenue chart data
- **Phase 2 additions:**
  - Team members with performance metrics
  - Team metrics aggregation
  - Referral data with conversion tracking
  - Referral statistics

**Usage:**
```typescript
import {
  CURRENT_USER,
  PRODUCTS,
  TRANSACTIONS,
  TEAM_MEMBERS,
  TEAM_METRICS,
  REFERRALS,
  REFERRAL_STATS
} from '@/data/mockData';
```

**Note:** This is seed data only. For production, replace with API calls using `src/services/api.ts`.

---

## Common Tasks & How to Execute

### Adding a New Page

1. Create page component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`:
```typescript
<Route path="/dashboard/newpage" element={<NewPage />} />
```
3. Add navigation link in `src/components/Sidebar.tsx`

### Adding a New Product

Modify `src/data/mockData.ts`:
```typescript
export const PRODUCTS: Product[] = [
  // ... existing products
  {
    id: '4',
    name: 'New Product',
    price: 5000000,
    commissionRate: 0.20,
    imageUrl: 'https://...',
    description: '...',
    salesCount: 0,
    stock: 100,
  },
];
```

### Modifying State

Update `src/store.ts`:
```typescript
export const useStore = create<AppState>((set) => ({
  // Add new state
  newField: initialValue,

  // Add new action
  updateField: (value) => set({ newField: value }),
}));
```

### Adding AI Features

Extend `src/services/geminiService.ts` or `src/services/copilotService.ts`:
```typescript
export async function newAIFunction(input: string): Promise<string> {
  try {
    const result = await model.generateContent(input);
    return result.response.text();
  } catch (error) {
    console.error('AI Error:', error);
    return 'Fallback response';
  }
}
```

### Adding Objection Handling Templates

Extend `src/services/copilotService.ts`:
```typescript
export const OBJECTION_TEMPLATES: ObjectionTemplate[] = [
  // Add new objection type
  {
    type: 'new_objection_type',
    keywords: ['keyword1', 'keyword2', 'từ khóa'],
    responses: [
      "Response in Vietnamese",
      "Alternative response",
      "Third option"
    ]
  }
];
```

### Writing Tests

Create test file next to the module:
```typescript
// src/utils/myUtil.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myUtil';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction(input)).toBe(expectedOutput);
  });

  it('should handle edge cases', () => {
    expect(myFunction(edgeCase)).toBe(expectedResult);
  });
});
```

Run tests: `npm test`

### Styling Components

Use Tailwind utility classes:
```typescript
<div className="bg-primary text-white p-4 rounded-lg shadow-md">
  Content
</div>
```

Use the `cn()` utility for conditional classes:
```typescript
import { cn } from '@/utils/cn';

<button className={cn(
  'base-button-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class'
)} />
```

For custom styles, extend `tailwind.config.js`.

---

## Known Issues & Status

### ✅ Previously Fixed Issues

- TSX syntax errors - **FIXED**
- Test suite missing - **IMPLEMENTED** (Vitest fully configured)
- Component library - **IMPLEMENTED** (Modal, Button, Input)
- Accessibility - **IMPROVED** (WCAG AA compliance)

### ⚠️ Current Considerations

**Security:**
- API keys use environment variables with fallback
- Firebase security rules needed for production
- Rate limiting not implemented

**Backend Integration:**
- Currently using mock data
- API service layer ready for integration
- Firebase initialized but not fully utilized

**Testing:**
- Unit tests for utils exist
- Component tests needed
- E2E tests needed (Playwright recommended)

---

## Testing Strategy

### ✅ Current Implementation

**Testing Framework:** Vitest + Testing Library
**Test Files:**
- `src/utils/format.test.ts`
- `src/utils/tax.test.ts`

**Test Scripts:**
```bash
npm test              # Watch mode
npm run test:ui       # Interactive UI
npm run test:run      # Run once
npm run test:coverage # Coverage report
```

### Writing Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductCard from '@/components/ProductCard';

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('ANIMA 119')).toBeInTheDocument();
  });

  it('handles purchase click', async () => {
    const onPurchase = vi.fn();
    render(<ProductCard product={mockProduct} onPurchase={onPurchase} />);

    await userEvent.click(screen.getByRole('button', { name: /buy/i }));
    expect(onPurchase).toHaveBeenCalledWith(mockProduct.id);
  });
});
```

### Writing Utility Tests

```typescript
import { describe, it, expect } from 'vitest';
import { formatVND } from './format';

describe('formatVND', () => {
  it('formats currency correctly', () => {
    expect(formatVND(1500000)).toBe('1.500.000 đ');
  });

  it('handles negative amounts', () => {
    expect(formatVND(-500000)).toBe('-500.000 đ');
  });
});
```

### Test Coverage Goals

- Utilities: 80%+ coverage ✅
- Components: 70%+ coverage (in progress)
- Services: 60%+ coverage (planned)
- E2E critical flows: 100% (planned with Playwright)

---

## Environment Variables

**Setup:**

Create `.env` file (not in repo):
```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Access in code:**
```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... other config
};
```

**Note:** Vite requires `VITE_` prefix for env vars. See `src/services/firebase.ts` for example.

---

## Performance Optimization Tips

### Code Splitting

Use React lazy loading for pages:
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));

<Suspense fallback={<Loader />}>
  <Dashboard />
</Suspense>
```

### Memo Components

For expensive components:
```typescript
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Heavy computation
});
```

### Zustand Selectors

Avoid unnecessary re-renders:
```typescript
// BAD - rerenders on any state change
const store = useStore();

// GOOD - rerenders only when user changes
const user = useStore(state => state.user);

// BETTER - rerenders only when specific field changes
const userName = useStore(state => state.user.name);
```

### Custom Hooks for Complex Logic

Extract reusable logic into custom hooks:
```typescript
// src/hooks/useWallet.ts
export function useWallet() {
  const balance = useStore(state => state.user.balance);
  const transactions = useStore(state => state.transactions);

  const withdraw = useCallback((amount: number) => {
    // Withdrawal logic
  }, []);

  return { balance, transactions, withdraw };
}
```

---

## Git Workflow

### Branch Strategy

**Conventions:**
- Feature branches: `feature/feature-name`
- Bug fixes: `bugfix/issue-description`
- Claude branches: `claude/session-id`
- Main branch: `main`

### Commit Messages

Follow conventional commits:
```
feat: Add The Copilot AI sales assistant
fix: Correct tax calculation for withdrawals
test: Add tests for tokenomics utilities
docs: Update CLAUDE.md with Phase 2 features
refactor: Extract wallet logic into custom hook
style: Format code with Prettier
chore: Update dependencies
```

### Before Committing

1. Run tests: `npm test`
2. Run build: `npm run build`
3. Fix TypeScript errors
4. Test critical user flows manually
5. Ensure no API keys are committed
6. Update documentation if needed

---

## Troubleshooting

### Build Fails with TypeScript Errors

**Symptom:** TypeScript compiler errors

**Fix:**
1. Check `npm run build` output for specific errors
2. Verify all imports use correct paths
3. Ensure types are properly defined in `types.ts`
4. Check for missing dependencies

### Tests Fail

**Symptom:** Test failures

**Debug:**
```bash
# Run tests in verbose mode
npm test -- --reporter=verbose

# Run specific test file
npm test -- format.test.ts

# Update snapshots if needed
npm test -- -u
```

### Vite Dev Server Won't Start

**Check:**
1. Port 5173 is not in use: `lsof -i :5173`
2. Node modules installed: `rm -rf node_modules && npm install`
3. Clear Vite cache: `rm -rf node_modules/.vite`

### Gemini AI Not Responding

**Possible causes:**
1. Invalid API key
2. API quota exceeded
3. Network/CORS issues

**Check:**
- Verify `VITE_GEMINI_API_KEY` in `.env`
- Check browser console for errors
- Service has fallback responses

### Firebase Connection Issues

**Check:**
1. Firebase config in `.env` is correct
2. Firebase project is active
3. Check browser console for errors
4. Verify `src/services/firebase.ts` configuration

### Tailwind Styles Not Applying

**Check:**
1. PostCSS config exists (`postcss.config.js`)
2. Tailwind directives in `index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
3. Clear browser cache and restart dev server
4. Check for class name typos

---

## Additional Resources

### Documentation Files

- **README.md** - Quick start guide
- **CLAUDE.md** - This file - AI assistant guide
- **USER_ONBOARDING.md** - End-user manual (Vietnamese context)
- **DESIGN_SYSTEM.md** - Complete design system documentation
- **DEPLOYMENT.md** - Deployment guide
- **VERCEL_DEPLOYMENT.md** - Vercel-specific deployment instructions
- **BRAND_CONTENT_STRATEGY.md** - Brand and content strategy
- **BRAND_REPOSITION_SUMMARY.md** - Brand repositioning summary
- **UI_ANALYSIS.md** - UI analysis and recommendations
- **UI_SUMMARY.md** - UI summary document
- **UI_IMPLEMENTATION_DETAILS.md** - Detailed UI implementation guide
- **UI_ANALYSIS_README.md** - UI analysis overview
- **metadata.json** - Exportable files reference

### External Documentation

- [React 18 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Google Gemini API](https://ai.google.dev/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)

### Business Context

- Vietnam Personal Income Tax: [Circular 111/2013/TT-BTC](https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-111-2013-TT-BTC-huong-dan-Luat-Thue-thu-nhap-ca-nhan-207089.aspx)

---

## Quick Reference: File Locations

| Task | File Location |
|------|---------------|
| Add route | `src/App.tsx` |
| Modify state | `src/store.ts` |
| Add type | `src/types.ts` |
| Format currency | `src/utils/format.ts` |
| Tax calculation | `src/utils/tax.ts` |
| Tokenomics | `src/utils/tokenomics.ts` |
| Mock data | `src/data/mockData.ts` |
| AI coaching | `src/services/geminiService.ts` |
| AI sales assistant | `src/services/copilotService.ts` |
| Firebase config | `src/services/firebase.ts` |
| API layer | `src/services/api.ts` |
| Custom hooks | `src/hooks/` |
| Tailwind config | `tailwind.config.js` |
| Build config | `vite.config.ts` |
| Dependencies | `package.json` |
| Tests | `src/**/*.test.ts` |

---

## Version History

### v1.0.0-seed (Current) - Phase 2 Growth Features

**Phase 1 - Core Features:**
- React + TypeScript foundation
- Zustand state management
- Gemini AI integration
- Tax compliance automation
- Gamification system
- Component library (Modal, Button, Input)
- Testing infrastructure (Vitest)

**Phase 2 - Growth Features:**
- The Copilot - AI sales assistant with objection handling
- Leader Dashboard - Team management and analytics
- Referral System - Advanced tracking and rewards
- Health Coach - Personalized health coaching
- Marketing Tools - Automated marketing campaigns
- Leaderboard - Competitive rankings
- Admin Panel - System administration
- Health Check - System monitoring
- Tokenomics - SHOP/GROW token system
- Firebase integration
- Custom hooks (useAuth, useAgent, useWallet)
- AppLayout wrapper architecture
- Comprehensive documentation suite

---

## Notes for AI Assistants

### When Making Changes

1. **Always check types.ts first** - Understand the data models, including Phase 2 types
2. **Maintain type safety** - Add proper TypeScript interfaces
3. **Use existing patterns** - Follow the component/service/util/hook structure
4. **Write tests** - Add tests for new utilities and components
5. **Test builds** - Run `npm test` and `npm run build` before committing
6. **⚠️ DEPLOY IMMEDIATELY** - Merge to main and push to trigger Vercel deployment. NO technical debt allowed.
7. **Respect Vietnamese context** - Currency is VND, tax is Vietnam law, support Vietnamese language
8. **Use mock data appropriately** - This is a seed-stage MVP with Phase 2 features
9. **Document complex logic** - Add comments for business rules, especially for Phase 2 features
10. **Follow accessibility standards** - Use WCAG AA compliant patterns
11. **Use custom hooks** - Leverage `useAuth`, `useWallet`, `useAgent` for common operations
12. **Check existing documentation** - Refer to DESIGN_SYSTEM.md, DEPLOYMENT.md, etc.

### Common Gotchas

- **Path aliases:** Use `@/` or `/src/`, both work
- **State updates:** Use Zustand actions, not direct mutation
- **Routing:** All dashboard routes need `/dashboard` prefix and are wrapped in AppLayout
- **Currency:** Always use `formatVND()` for displaying VND amounts
- **Tokens:** Use `formatToken()` for SHOP/GROW token amounts
- **Tax:** Auto-calculated for all transactions over threshold
- **Authentication:** Check `isAuthenticated` state for protected routes
- **Testing:** Write tests for new utilities, run `npm test` before committing
- **Firebase:** Config uses environment variables, has fallback for development
- **Copilot:** Objection detection supports both English and Vietnamese keywords
- **Layout:** Protected routes use AppLayout wrapper with Sidebar
- **Types:** Extended type system includes Phase 2 features (tokens, teams, referrals)

### Code Style

- **Naming:** camelCase for functions/variables, PascalCase for components/types
- **Exports:** Use default exports for components, named for utilities
- **Imports:** Group by external → internal → types → styles
- **Comments:** JSDoc for public functions, inline for complex logic
- **Testing:** Co-locate tests with modules (`*.test.ts` next to `*.ts`)
- **Hooks:** Custom hooks start with `use` prefix
- **Utils:** Pure functions, no side effects
- **Services:** Async operations, error handling with fallbacks

### Phase 2 Feature Development

When working on Phase 2 features:

1. **The Copilot** - Use `copilotService.ts` for objection handling logic
2. **Leader Dashboard** - Team data in `mockData.ts`, extend for real API
3. **Referral System** - Track referrals, conversions, and rewards
4. **Tokenomics** - Use `tokenomics.ts` utilities for calculations
5. **Admin Features** - Admin routes are outside `/dashboard` structure
6. **Health Features** - Health Coach and Health Check for system monitoring

### Testing Guidelines

- Write tests for all new utilities
- Test edge cases (negative numbers, null values, etc.)
- Use descriptive test names
- Mock external services (Gemini, Firebase)
- Aim for 80%+ coverage on utilities
- Run tests before committing: `npm test`

---

**Last Updated:** 2025-11-21
**Current Phase:** Phase 2 - Growth Features
**For Questions:** Refer to README.md, DESIGN_SYSTEM.md, or codebase comments
**Test Coverage:** Utilities: 80%+, Components: In progress
**Deployment:** Vercel (auto-deploy from main branch)
