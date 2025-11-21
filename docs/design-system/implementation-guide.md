# Design System Implementation Guide

**WellNexus Design System v1.0.0-seed**

Developer guide for implementing the WellNexus design system in your project.

---

## Table of Contents

1. [Setup & Installation](#setup--installation)
2. [Tailwind Configuration](#tailwind-configuration)
3. [Using Components](#using-components)
4. [Creating Custom Components](#creating-custom-components)
5. [Styling Best Practices](#styling-best-practices)
6. [TypeScript Integration](#typescript-integration)
7. [Performance Optimization](#performance-optimization)
8. [Testing Components](#testing-components)

---

## Setup & Installation

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Install Dependencies

The design system is built into the WellNexus project. Core dependencies:

```bash
npm install react react-dom
npm install -D typescript @types/react @types/react-dom
npm install tailwindcss postcss autoprefixer
npm install lucide-react framer-motion
```

### Project Structure

```
/home/user/Well/
├── src/
│   ├── components/
│   │   ├── ui/              # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── ProductCard.tsx  # Composite components
│   │   └── Sidebar.tsx
│   ├── utils/
│   │   └── format.ts        # Utility functions
│   └── types.ts             # TypeScript definitions
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── tsconfig.json            # TypeScript configuration
```

---

## Tailwind Configuration

### tailwind.config.js

**Location:** `/home/user/Well/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#00575A',  // Deep Teal
          accent: '#FFBF00',   // Marigold
          bg: '#F3F4F6',       // Off-white Background
          dark: '#1F2937',     // Text Main
          surface: '#FFFFFF',  // Card background
        },
        // Aliases for convenience
        deepTeal: '#00575A',
        marigold: '#FFBF00',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

### PostCSS Configuration

**Location:** `/home/user/Well/postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Global Styles

**Location:** `/home/user/Well/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import Inter font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

/* Custom utility classes */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Custom component classes */
@layer components {
  .btn-primary {
    @apply bg-brand-accent text-brand-primary font-bold rounded-xl px-4 py-2.5 hover:bg-yellow-400 transition-all shadow-lg;
  }

  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-100 p-6;
  }
}
```

---

## Using Components

### Importing Components

```tsx
// Base UI components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// Composite components
import ProductCard from '@/components/ProductCard';
import Sidebar from '@/components/Sidebar';
```

**Note:** `@/` is a path alias configured in `vite.config.ts` and `tsconfig.json`.

### Path Alias Configuration

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Creating Custom Components

### Component Template

```tsx
// src/components/MyComponent.tsx

import React from 'react';

interface MyComponentProps {
  title: string;
  description?: string;
  variant?: 'default' | 'highlighted';
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  description,
  variant = 'default',
  onAction,
}) => {
  // Component logic here

  const variantStyles = {
    default: 'bg-white border-gray-200',
    highlighted: 'bg-brand-primary/5 border-brand-primary',
  };

  return (
    <div className={`
      border rounded-xl p-6 transition-all
      ${variantStyles[variant]}
    `}>
      <h3 className="text-xl font-bold text-brand-dark mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-600 mb-4">
          {description}
        </p>
      )}

      {onAction && (
        <button
          onClick={onAction}
          className="btn-primary"  {/* Use custom Tailwind class */}
        >
          Take Action
        </button>
      )}
    </div>
  );
};

export default MyComponent;
```

### Component Best Practices

#### ✅ Do's

**1. Use TypeScript Interfaces**
```tsx
interface ProductCardProps {
  product: Product;
  onPurchase?: (productId: string) => void;
}
```

**2. Provide Default Props**
```tsx
const { variant = 'default', size = 'md' } = props;
```

**3. Handle Loading States**
```tsx
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return <LoadingSpinner />;
}
```

**4. Use Semantic HTML**
```tsx
<article className="card">
  <header>
    <h2>{title}</h2>
  </header>
  <section>
    {content}
  </section>
</article>
```

**5. Add ARIA Labels**
```tsx
<button
  aria-label="Close dialog"
  onClick={onClose}
>
  <X className="w-4 h-4" />
</button>
```

#### ❌ Don'ts

**1. Avoid Inline Styles**
```tsx
{/* ❌ Bad */}
<div style={{ backgroundColor: '#00575A', padding: '16px' }}>

{/* ✅ Good */}
<div className="bg-brand-primary p-4">
```

**2. Don't Hardcode Colors**
```tsx
{/* ❌ Bad */}
<div className="bg-[#00575A]">

{/* ✅ Good */}
<div className="bg-brand-primary">
```

**3. Avoid Deep Nesting**
```tsx
{/* ❌ Bad - too many levels */}
<div>
  <div>
    <div>
      <div>
        <p>Content</p>
      </div>
    </div>
  </div>
</div>

{/* ✅ Good - flat structure */}
<Card>
  <CardHeader title="Title" />
  <CardBody>Content</CardBody>
</Card>
```

---

## Styling Best Practices

### Using Tailwind Utility Classes

#### Spacing
```tsx
{/* Padding */}
<div className="p-4">     {/* 16px all sides */}
<div className="px-6">    {/* 24px horizontal */}
<div className="py-3">    {/* 12px vertical */}

{/* Margin */}
<div className="m-4">     {/* 16px all sides */}
<div className="mx-auto">  {/* Horizontal centering */}
<div className="mb-8">    {/* 32px bottom */}

{/* Gap (Flexbox/Grid) */}
<div className="flex gap-4">        {/* 16px between items */}
<div className="grid gap-x-6 gap-y-4"> {/* Different x/y gaps */}
```

#### Responsive Design
```tsx
<div className="
  w-full               {/* Mobile: full width */}
  md:w-1/2             {/* Tablet: half width */}
  lg:w-1/3             {/* Desktop: third width */}
">
  Responsive content
</div>

{/* Grid columns */}
<div className="
  grid
  grid-cols-1          {/* Mobile: 1 column */}
  md:grid-cols-2       {/* Tablet: 2 columns */}
  lg:grid-cols-3       {/* Desktop: 3 columns */}
  gap-6
">
  {items.map(item => <GridItem key={item.id} {...item} />)}
</div>
```

#### Interactive States
```tsx
<button className="
  bg-brand-primary
  text-white
  hover:bg-teal-800          {/* Hover state */}
  active:bg-teal-900         {/* Active/pressed state */}
  focus:outline-none         {/* Remove default outline */}
  focus:ring-2               {/* Custom focus ring */}
  focus:ring-brand-primary
  focus:ring-offset-2
  disabled:opacity-50        {/* Disabled state */}
  disabled:cursor-not-allowed
  transition-all             {/* Smooth transitions */}
  duration-200
">
  Interactive Button
</button>
```

### Custom Tailwind Classes

Define reusable component classes in `src/index.css`:

```css
@layer components {
  /* Button variants */
  .btn-primary {
    @apply bg-brand-accent text-brand-primary font-bold rounded-xl px-4 py-2.5 hover:bg-yellow-400 transition-all shadow-lg;
  }

  .btn-secondary {
    @apply bg-brand-primary text-white font-bold rounded-xl px-4 py-2.5 hover:bg-teal-800 transition-all shadow-md;
  }

  /* Card styles */
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-100 p-6;
  }

  .card-hover {
    @apply card hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300;
  }

  /* Input styles */
  .input-default {
    @apply border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent;
  }

  .input-error {
    @apply border border-red-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent;
  }
}
```

**Usage:**
```tsx
<div className="card-hover">
  <button className="btn-primary">
    Click Me
  </button>
</div>
```

---

## TypeScript Integration

### Type Definitions

**Location:** `src/types.ts`

```typescript
// User types
export interface User {
  id: string;
  name: string;
  email: string;
  rank: UserRank;
  totalSales: number;
  teamVolume: number;
}

export enum UserRank {
  MEMBER = 'Member',
  PARTNER = 'Partner',
  FOUNDER_CLUB = 'Founder Club',
}

// Product types
export interface Product {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  imageUrl: string;
  description: string;
  salesCount: number;
  stock: number;
}

// Transaction types
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  taxAmount: number;
  netAmount: number;
  date: string;
  productId?: string;
}

export type TransactionType = 'Direct Sale' | 'Team Volume Bonus' | 'Withdrawal';
```

### Component Props TypeScript

```typescript
import { Product } from '@/types';

// Extending HTML element props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// Custom props
interface ProductCardProps {
  product: Product;
  onPurchase?: (productId: string) => void;
  className?: string;
}

// Event handler types
interface FormProps {
  onSubmit: (data: FormData) => void;
  onChange: (field: string, value: string) => void;
}
```

### Type-Safe State Management (Zustand)

**Location:** `src/store.ts`

```typescript
import create from 'zustand';
import { User, Product, Transaction } from './types';

interface AppState {
  // State
  isAuthenticated: boolean;
  user: User;
  products: Product[];
  transactions: Transaction[];

  // Actions
  login: () => void;
  logout: () => void;
  simulateOrder: (productId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  user: mockUser,
  products: mockProducts,
  transactions: mockTransactions,

  // Actions
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),

  simulateOrder: async (productId: string) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    // Implementation...
  },
}));
```

**Usage:**
```tsx
import { useStore } from '@/store';

function MyComponent() {
  const { user, products, simulateOrder } = useStore();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onPurchase={simulateOrder}
        />
      ))}
    </div>
  );
}
```

---

## Performance Optimization

### Code Splitting

Use React lazy loading for pages:

```tsx
import { lazy, Suspense } from 'react';

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));

// Use with Suspense
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

Prevent unnecessary re-renders:

```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
const ProductCard = memo(({ product, onPurchase }) => {
  // Component logic
});

// Memoize expensive calculations
function Dashboard() {
  const totalEarnings = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.netAmount, 0);
  }, [transactions]);

  // Memoize callbacks
  const handlePurchase = useCallback((productId: string) => {
    simulateOrder(productId);
  }, [simulateOrder]);

  return (
    <div>
      <h1>Total Earnings: {formatVND(totalEarnings)}</h1>
      {products.map(p => (
        <ProductCard
          key={p.id}
          product={p}
          onPurchase={handlePurchase}
        />
      ))}
    </div>
  );
}
```

### Zustand Selectors

Avoid unnecessary re-renders by selecting only needed state:

```tsx
// ❌ Bad - rerenders on any state change
function MyComponent() {
  const store = useStore();
  return <div>{store.user.name}</div>;
}

// ✅ Good - rerenders only when user changes
function MyComponent() {
  const user = useStore(state => state.user);
  return <div>{user.name}</div>;
}

// ✅ Even better - select only needed field
function MyComponent() {
  const userName = useStore(state => state.user.name);
  return <div>{userName}</div>;
}
```

### Image Optimization

```tsx
{/* Use appropriate image formats */}
<img
  src="/images/product.webp"  {/* WebP for better compression */}
  alt="Product name"
  loading="lazy"               {/* Lazy load images */}
  decoding="async"             {/* Async decoding */}
  width="400"                  {/* Explicit dimensions */}
  height="400"
/>

{/* Use srcset for responsive images */}
<img
  srcSet="
    /images/product-400.webp 400w,
    /images/product-800.webp 800w,
    /images/product-1200.webp 1200w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  src="/images/product-800.webp"
  alt="Product name"
/>
```

---

## Testing Components

### Setup Testing Environment

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

**src/test/setup.ts:**
```typescript
import '@testing-library/jest-dom';
```

### Component Test Examples

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button variant="primary">Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('applies correct variant styles', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-brand-accent');
  });
});
```

### Utility Function Tests

```typescript
// format.test.ts
import { formatVND, formatNumber } from '@/utils/format';

describe('Format Utilities', () => {
  describe('formatVND', () => {
    it('formats Vietnamese currency correctly', () => {
      expect(formatVND(1500000)).toBe('1.500.000 ₫');
      expect(formatVND(0)).toBe('0 ₫');
      expect(formatVND(999)).toBe('999 ₫');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1.000');
      expect(formatNumber(1500000)).toBe('1.500.000');
    });
  });
});
```

---

## Related Documentation

- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) - Main design system guide
- [Component Reference](./components-reference.md) - Component API documentation
- [Color System](./color-system.md) - Color usage guidelines
- [CLAUDE.md](../../CLAUDE.md) - AI assistant guide

---

**Last Updated:** 2025-11-20
**Maintained by:** WellNexus Development Team
