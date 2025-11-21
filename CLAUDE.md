# CLAUDE.md - AI Assistant Guide for WellNexus MVP

## Project Overview

**WellNexus** is a Hybrid Community Commerce platform MVP designed for the Vietnamese market. It combines social selling, AI-powered business coaching, and automated tax compliance in a single React-based web application.

**Current Stage:** Seed Stage MVP (v1.0.0-seed)
**Architecture:** Frontend-only SPA with mock data
**Target Market:** Vietnam (VND currency, Vietnamese tax law)
**Deployment:** Firebase Hosting

### Key Features
- Multi-level marketing (MLM) commission tracking
- AI coaching assistant powered by Google Gemini
- Automated Vietnam tax compliance (Circular 111/2013/TT-BTC)
- Gamification system with quests and rank progression
- Real-time commission wallet and transaction history
- Product marketplace with AI-powered recommendations

---

## Technology Stack

### Core Framework
- **React 18.2.0** with TypeScript
- **Vite 5.1.5** for build tooling
- **React Router v6** for client-side routing
- **Zustand** for global state management

### UI/UX Libraries
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Framer Motion** - Animations
- **Recharts** - Data visualization

### External Services
- **Google Gemini AI** (@google/genai) - AI coaching features

---

## Codebase Structure

```
/home/user/Well/
├── src/
│   ├── App.tsx                    # Main router and layout structure
│   ├── index.tsx                  # Application entry point
│   ├── index.css                  # Global styles with Tailwind imports
│   ├── store.ts                   # Zustand global state management
│   ├── types.ts                   # TypeScript type definitions
│   ├── SingleFileApp.tsx          # Portable standalone version (28KB)
│   │
│   ├── components/                # Reusable UI components
│   │   ├── Sidebar.tsx            # Navigation + AI coach widget
│   │   ├── ProductCard.tsx        # Product listing card
│   │   ├── ProductCard.test.tsx   # ProductCard tests ✅
│   │   ├── CommissionWallet.tsx   # Transaction history & tax display
│   │   ├── OnboardingQuest.tsx    # Quest/gamification component
│   │   └── Dashboard/             # Dashboard-specific components
│   │       ├── HeroCard.tsx       # Founder Club progress banner
│   │       ├── StatsGrid.tsx      # KPI metrics cards
│   │       └── RevenueChart.tsx   # 7-day revenue chart
│   │
│   ├── pages/                     # Route-level page components
│   │   ├── LandingPage.tsx        # Marketing homepage
│   │   ├── Dashboard.tsx          # Main dashboard overview
│   │   ├── Marketplace.tsx        # Product catalog
│   │   └── ProductDetail.tsx      # Individual product view
│   │
│   ├── services/                  # External service integrations
│   │   └── geminiService.ts       # Google Gemini AI API wrapper
│   │
│   ├── utils/                     # Helper functions
│   │   ├── format.ts              # VND currency & number formatting
│   │   ├── format.test.ts         # Format utility tests ✅
│   │   ├── tax.ts                 # Vietnam tax calculations
│   │   └── tax.test.ts            # Tax calculation tests ✅
│   │
│   ├── test/                      # Test configuration
│   │   └── setup.ts               # Vitest global setup
│   │
│   └── data/                      # Mock data for MVP
│       └── mockData.ts            # Seed products, users, transactions
│
├── public/                        # Static assets
├── .env.example                   # Environment variable template
├── index.html                     # HTML template
├── package.json                   # Dependencies & test scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite & Vitest configuration
├── tailwind.config.js             # Tailwind theming
├── README.md                      # Project documentation
└── USER_ONBOARDING.md             # End-user guide
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
```

### Firebase Deployment

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

The entire application state is managed by one Zustand store:

```typescript
interface AppState {
  // Authentication
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  // User & Data
  user: User;
  products: Product[];
  transactions: Transaction[];
  quests: Quest[];
  revenueData: ChartDataPoint[];

  // Actions
  completeQuest: (questId: string) => void;
  simulateOrder: (productId: string) => void;
}
```

**Usage Pattern:**
```typescript
import { useStore } from '@/store';

function MyComponent() {
  const { user, products, simulateOrder } = useStore();
  // ...
}
```

### Type System

All TypeScript interfaces are centralized in `src/types.ts`:

**Core Types:**
- `User` - User profile with rank, sales, team volume
- `Product` - Product info with commission rates
- `Transaction` - Financial transactions with tax data
- `Quest` - Gamification tasks
- `UserRank` enum - Member → Partner → Founder Club
- `TransactionType` - "Direct Sale" | "Team Volume Bonus" | "Withdrawal"

**Always import from types.ts:**
```typescript
import { User, Product, UserRank } from '@/types';
```

### Component Patterns

**1. Page Components** (`src/pages/`)
- Control full-page layouts
- Use `useStore()` for global state
- Pass data down to child components
- Handle routing logic

**2. Reusable Components** (`src/components/`)
- Props-based configuration with TypeScript interfaces
- Framer Motion for animations
- Self-contained logic
- Event handlers with async/await

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

**Important:** API key is currently exposed in code. For production, use backend proxy.

### Utility Functions

**Currency Formatting** (`src/utils/format.ts`)
```typescript
formatVND(1500000) // "1.500.000 ₫"
formatNumber(5000) // "5.000"
```

**Tax Calculations** (`src/utils/tax.ts`)
```typescript
calculateTax(amount: number): number
// Applies 10% tax above 2,000,000 VND threshold
// Based on Vietnam Circular 111/2013/TT-BTC
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

All transactions automatically calculate tax deductions.

---

## Routing Architecture

**Routes Configuration:**

```
/ (LandingPage)
  └─ /dashboard/* (Protected routes - requires authentication)
       ├─ /dashboard (Dashboard overview)
       ├─ /dashboard/marketplace (Product catalog)
       ├─ /dashboard/wallet (Commission wallet)
       └─ /dashboard/product/:id (Product detail)
```

**Authentication Flow:**
- Unauthenticated users see `LandingPage`
- After login, redirect to `/dashboard`
- All `/dashboard/*` routes check `isAuthenticated` state

Location: `src/App.tsx`

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

---

## Mock Data System

**Location:** `src/data/mockData.ts`

**Includes:**
- 3 sample products (ANIMA 119, Starter Kit, Immune Boost)
- Mock user profile (Lan Nguyen, Partner rank)
- Sample transactions with tax calculations
- Daily quests for gamification
- 7-day revenue chart data

**Usage:**
```typescript
import { mockProducts, mockUser } from '@/data/mockData';
```

**Note:** This is seed data only. For production, replace with API calls.

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
export const mockProducts: Product[] = [
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

Extend `src/services/geminiService.ts`:
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

### Styling Components

Use Tailwind utility classes:
```typescript
<div className="bg-primary text-white p-4 rounded-lg shadow-md">
  Content
</div>
```

For custom styles, extend `tailwind.config.js`.

---

## Security & Best Practices

### Build Status ✅

All build errors have been resolved. The project builds successfully:

```bash
npm run build
# ✓ built in ~11s
```

### API Key Security ✅

The Gemini AI API key is now properly configured to use environment variables:

```typescript
// src/services/geminiService.ts
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'demo-key');
```

**Setup Instructions:**
1. Copy `.env.example` to `.env`
2. Add your Gemini API key: `VITE_GEMINI_API_KEY=your_api_key_here`
3. The `.env` file is gitignored and will not be committed

**Production Recommendations:**
- Move API calls to backend proxy for better security
- Implement rate limiting
- Use server-side API key management

### Testing Infrastructure ✅

The project now includes a complete testing setup with **31 passing tests**:

**Testing Stack:**
- **Vitest 4.0** - Fast unit test runner
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - DOM matchers
- **happy-dom** - Lightweight DOM environment

**Test Scripts:**
```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Open Vitest UI
npm run test:coverage # Generate coverage report
```

**Current Test Coverage:**
- ✅ `src/utils/format.test.ts` - Currency and number formatting (12 tests)
- ✅ `src/utils/tax.test.ts` - Vietnam tax calculations (9 tests)
- ✅ `src/components/ProductCard.test.tsx` - Component rendering (10 tests)

**Configuration:** See `vite.config.ts` and `src/test/setup.ts`

### Missing Features

- ❌ No linting/formatting (ESLint/Prettier)
- ❌ No CI/CD pipeline
- ❌ No error boundary components
- ❌ No backend integration (pure mock data)
- ❌ Additional test coverage for remaining components

---

## Testing Strategy

### Running Tests

```bash
# Watch mode (recommended for development)
npm test

# Run once (for CI/CD)
npm run test:run

# Visual UI
npm run test:ui

# With coverage
npm run test:coverage
```

### Writing New Tests

**Utility Function Test Example:**

```typescript
// src/utils/myUtil.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myUtil';

describe('myFunction', () => {
  it('should handle basic case', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

**Component Test Example:**

```typescript
// src/components/MyComponent.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from './MyComponent';

// Mock dependencies if needed
vi.mock('../store', () => ({
  useStore: () => ({ /* mock state */ }),
}));

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Test Organization

Tests are colocated with source files:
- `src/utils/*.test.ts` - Utility tests
- `src/components/*.test.tsx` - Component tests
- `src/test/setup.ts` - Global test configuration

---

## Environment Variables

**Recommended Setup:**

Create `.env` file (not in repo):
```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id
```

Access in code:
```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

**Note:** Vite requires `VITE_` prefix for env vars.

---

## Performance Optimization Tips

### Code Splitting

Use React lazy loading for pages:
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));

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
```

---

## Git Workflow

### Branch Strategy

Current branch: `claude/claude-md-mi7sgyp2cz1iv52r-01N1yvA1XD6qhJVhwYoExFN4`

**Conventions:**
- Feature branches: `feature/feature-name`
- Bug fixes: `bugfix/issue-description`
- Claude branches: `claude/session-id`

### Commit Messages

Follow conventional commits:
```
feat: Add user profile page
fix: Correct tax calculation for withdrawals
docs: Update README with deployment steps
refactor: Simplify product card component
```

### Before Committing

1. Run build: `npm run build`
2. Fix TypeScript errors
3. Test critical user flows manually
4. Ensure no API keys are committed

---

## Troubleshooting

### Build Fails with TSX Errors

**Symptom:** TypeScript compiler errors about JSX syntax

**Fix:** Escape comparison operators in JSX:
```typescript
{value < 0 ? 'negative' : 'positive'}
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

**Fallback:** Code has built-in fallback responses

### Tailwind Styles Not Applying

**Check:**
1. PostCSS config exists
2. Tailwind directives in `index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
3. Clear browser cache

---

## Additional Resources

### Documentation
- **README.md** - Quick start guide
- **USER_ONBOARDING.md** - End-user manual (Vietnamese context)
- **metadata.json** - Exportable files reference

### External Docs
- [React 18 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Google Gemini API](https://ai.google.dev/docs)

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
| Mock data | `src/data/mockData.ts` |
| AI integration | `src/services/geminiService.ts` |
| Tailwind config | `tailwind.config.js` |
| Build config | `vite.config.ts` |
| Dependencies | `package.json` |

---

## Version History

- **v1.0.0-seed** (Current) - Initial MVP with mock data
  - React + TypeScript foundation
  - Zustand state management
  - Gemini AI integration
  - Tax compliance automation
  - Gamification system

---

## Notes for AI Assistants

### When Making Changes

1. **Always check types.ts first** - Understand the data models
2. **Maintain type safety** - Add proper TypeScript interfaces
3. **Use existing patterns** - Follow the component/service/util structure
4. **Test builds** - Run `npm run build` before committing
5. **Respect Vietnamese context** - Currency is VND, tax is Vietnam law
6. **Preserve mock data** - This is a seed-stage MVP
7. **Document complex logic** - Add comments for business rules

### Common Gotchas

- **Path aliases:** Use `@/` or `/src/`, both work
- **State updates:** Use Zustand actions, not direct mutation
- **Routing:** All dashboard routes need `/dashboard` prefix
- **Currency:** Always use `formatVND()` for displaying amounts
- **Tax:** Auto-calculated for all transactions over threshold
- **Authentication:** Check `isAuthenticated` state for protected routes

### Code Style

- **Naming:** camelCase for functions/variables, PascalCase for components
- **Exports:** Use default exports for components, named for utilities
- **Imports:** Group by external → internal → types
- **Comments:** JSDoc for public functions, inline for complex logic

---

**Last Updated:** 2025-11-20
**For Questions:** Refer to README.md or codebase comments
