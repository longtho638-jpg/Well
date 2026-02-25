# Component Reference Guide

**WellNexus Design System v1.0.0-seed**

Complete API documentation for all UI components in the WellNexus platform.

---

## Table of Contents

1. [Button Component](#button-component)
2. [Input Component](#input-component)
3. [Modal Component](#modal-component)
4. [ProductCard Component](#productcard-component)
5. [CommissionWallet Component](#commissionwallet-component)
6. [Sidebar Component](#sidebar-component)
7. [Dashboard Components](#dashboard-components)

---

## Button Component

**Location:** `src/components/ui/Button.tsx`

### API Reference

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `isLoading` | `boolean` | `false` | Shows loading spinner |
| `icon` | `ReactNode` | - | Icon to display before text |
| `children` | `ReactNode` | required | Button label text |
| `disabled` | `boolean` | `false` | Disables button interaction |
| `className` | `string` | `''` | Additional CSS classes |

### Variants

#### Primary
**Use Case:** Main call-to-action buttons

```tsx
<Button variant="primary" size="md">
  Submit Order
</Button>
```

**Visual Appearance:**
- Background: Marigold (`#FFBF00`)
- Text: Deep Teal (`#00575A`)
- Hover: Lighter yellow (`#FFD700`)
- Shadow: Large elevated shadow

---

#### Secondary
**Use Case:** Alternative important actions

```tsx
<Button variant="secondary" size="md">
  View Details
</Button>
```

**Visual Appearance:**
- Background: Deep Teal (`#00575A`)
- Text: White
- Hover: Darker teal
- Shadow: Medium shadow

---

#### Outline
**Use Case:** Tertiary actions, less emphasis

```tsx
<Button variant="outline" size="sm">
  Cancel
</Button>
```

**Visual Appearance:**
- Background: Transparent
- Border: Light gray
- Text: Dark gray
- Hover: Light gray background

---

#### Ghost
**Use Case:** Minimal emphasis, inline actions

```tsx
<Button variant="ghost" size="sm">
  Edit
</Button>
```

**Visual Appearance:**
- Background: Transparent
- Text: Gray
- Hover: Light gray background

---

#### Danger
**Use Case:** Destructive actions (delete, remove)

```tsx
<Button variant="danger" size="md">
  Delete Account
</Button>
```

**Visual Appearance:**
- Background: Red (`#EF4444`)
- Text: White
- Hover: Darker red
- Shadow: Medium shadow

---

### Sizes

```tsx
// Small (12px text, 6px vertical padding)
<Button size="sm">Small Button</Button>

// Medium (14px text, 10px vertical padding)
<Button size="md">Medium Button</Button>

// Large (16px text, 14px vertical padding)
<Button size="lg">Large Button</Button>
```

### Loading State

```tsx
<Button variant="primary" isLoading>
  Processing Payment
</Button>

// Renders: ⏳ Loading...
```

**Behavior:**
- Replaces content with spinner icon
- Automatically disables the button
- Shows "Loading..." text

### With Icon

```tsx
import { ShoppingBag } from 'lucide-react';

<Button
  variant="primary"
  icon={<ShoppingBag className="w-4 h-4" />}
>
  Buy Now
</Button>
```

### Complete Examples

#### Form Submit Button
```tsx
<form onSubmit={handleSubmit}>
  {/* form fields */}
  <Button
    variant="primary"
    size="lg"
    type="submit"
    isLoading={isSubmitting}
    className="w-full"
  >
    Create Account
  </Button>
</form>
```

#### Confirmation Dialog
```tsx
<div className="flex gap-3 justify-end">
  <Button variant="outline" onClick={onCancel}>
    Cancel
  </Button>
  <Button variant="danger" onClick={onConfirm}>
    Delete
  </Button>
</div>
```

---

## Input Component

**Location:** `src/components/ui/Input.tsx`

### API Reference

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error';
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'error'` | `'default'` | Visual state |
| `label` | `string` | - | Input label text |
| `helperText` | `string` | - | Helper/error message |
| `icon` | `ReactNode` | - | Icon to display inside input |
| `type` | `string` | `'text'` | HTML input type |
| `placeholder` | `string` | - | Placeholder text |

### Examples

#### Basic Text Input
```tsx
<Input
  type="text"
  placeholder="Enter your name"
  variant="default"
/>
```

#### With Label and Helper Text
```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  helperText="We'll never share your email"
  variant="default"
/>
```

#### Error State
```tsx
<Input
  label="Password"
  type="password"
  variant="error"
  helperText="Password must be at least 8 characters"
/>
```

#### Search Input with Icon
```tsx
import { Search } from 'lucide-react';

<Input
  type="search"
  placeholder="Search products..."
  icon={<Search className="w-4 h-4" />}
/>
```

---

## Modal Component

**Location:** `src/components/ui/Modal.tsx`

### API Reference

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Controls modal visibility |
| `onClose` | `() => void` | required | Close handler function |
| `title` | `string` | - | Modal title |
| `children` | `ReactNode` | required | Modal content |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Modal width |

### Example

```tsx
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to continue?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

---

## ProductCard Component

**Location:** `src/components/ProductCard.tsx`

### API Reference

```typescript
interface ProductCardProps {
  product: Product;
}

interface Product {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  imageUrl: string;
  description: string;
  salesCount: number;
  stock: number;
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `product` | `Product` | Product data object |

### Features

- **Product Image:** Hover zoom effect (110% scale)
- **Commission Badge:** Displays earnings potential
- **Stock Indicator:** Shows available quantity
- **Out of Stock State:** Grayscale image + overlay
- **Share Button:** Copies product link to clipboard
- **Buy Button:** Simulates purchase with loading state
- **Success Animation:** Checkmark confirmation

### Example

```tsx
import ProductCard from '@/components/ProductCard';

const product = {
  id: '1',
  name: 'ANIMA 119',
  price: 15900000,
  commissionRate: 0.25,
  imageUrl: 'https://example.com/product.jpg',
  description: 'Premium health supplement',
  salesCount: 245,
  stock: 50
};

<ProductCard product={product} />
```

### States

#### Default
```
┌─────────────────────┐
│  [Product Image]    │
│  ┌──────────────┐   │
│  │ Earn 3.9M ₫  │   │
│  └──────────────┘   │
├─────────────────────┤
│ ANIMA 119           │
│ 15,900,000 ₫        │
│ [Share] [Buy Now]   │
└─────────────────────┘
```

#### Out of Stock
```
┌─────────────────────┐
│  [Grayscale Image]  │
│  ┌──────────────┐   │
│  │ Out of Stock │   │
│  └──────────────┘   │
├─────────────────────┤
│ ANIMA 119           │
│ 15,900,000 ₫        │
│ [Share] [Disabled]  │
└─────────────────────┘
```

#### Loading
```
┌─────────────────────┐
│  [Product Image]    │
├─────────────────────┤
│ ANIMA 119           │
│ [Share] [⏳ ...]    │
└─────────────────────┘
```

---

## CommissionWallet Component

**Location:** `src/components/CommissionWallet.tsx`

### API Reference

```typescript
interface CommissionWalletProps {
  // Uses global state from Zustand store
}
```

### Features

- **Total Balance Display:** Shows available commission balance
- **Tax Summary:** Displays total tax deducted
- **Transaction History:** Lists all commission earnings
- **Withdrawal Button:** Opens withdrawal modal
- **Transaction Types:**
  - Direct Sale (personal sales commission)
  - Team Volume Bonus (downline commissions)
  - Withdrawal (cash-out requests)

### Example

```tsx
import CommissionWallet from '@/components/CommissionWallet';

<CommissionWallet />
```

### Transaction Display

```
┌──────────────────────────────────┐
│  💰 Commission Wallet            │
├──────────────────────────────────┤
│  Available Balance: 12,450,000 ₫ │
│  Total Tax Paid: 245,000 ₫       │
├──────────────────────────────────┤
│  Recent Transactions:            │
│                                  │
│  ✅ Direct Sale                  │
│     +3,975,000 ₫                 │
│     Tax: -197,500 ₫              │
│     Nov 20, 2025                 │
│                                  │
│  ✅ Team Volume Bonus            │
│     +1,500,000 ₫                 │
│     Tax: 0 ₫ (below threshold)   │
│     Nov 19, 2025                 │
└──────────────────────────────────┘
```

---

## Sidebar Component

**Location:** `src/components/Sidebar.tsx`

### Features

- **Logo Area:** WellNexus branding
- **Navigation Links:** Dashboard, Marketplace, Wallet, Quests
- **Active State Indicator:** Left border + background tint
- **AI Coach Widget:** Fixed at bottom
- **Responsive:** Hidden on mobile (bottom nav shown instead)

### Example

```tsx
import Sidebar from '@/components/Sidebar';

<div className="flex">
  <Sidebar />
  <main className="flex-1">
    {/* Page content */}
  </main>
</div>
```

### Navigation Items

```tsx
const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    path: '/dashboard/marketplace',
    label: 'Marketplace',
    icon: ShoppingBag
  },
  {
    path: '/dashboard/wallet',
    label: 'Wallet',
    icon: Wallet
  },
  {
    path: '/dashboard/quests',
    label: 'Quests',
    icon: Target
  },
];
```

---

## Dashboard Components

### HeroCard

**Location:** `src/components/Dashboard/HeroCard.tsx`

**Purpose:** Display Founder Club progress

```tsx
import HeroCard from '@/components/Dashboard/HeroCard';

<HeroCard />
```

**Features:**
- Gradient background (Deep Teal)
- Progress bar visualization
- Rank progression display
- Call-to-action to upgrade

---

### StatsGrid

**Location:** `src/components/Dashboard/StatsGrid.tsx`

**Purpose:** Display key performance metrics

```tsx
import StatsGrid from '@/components/Dashboard/StatsGrid';

<StatsGrid />
```

**Metrics:**
- Total Sales (VND)
- Team Volume (VND)
- Active Quests (count)
- Commission Rate (percentage)

---

### RevenueChart

**Location:** `src/components/Dashboard/RevenueChart.tsx`

**Purpose:** Visualize 7-day revenue trend

```tsx
import RevenueChart from '@/components/Dashboard/RevenueChart';

<RevenueChart />
```

**Features:**
- Line chart with gradient fill
- Interactive tooltips
- Responsive sizing
- Recharts library integration

---

## Component Best Practices

### Do's ✅

- **Use TypeScript:** Always define prop interfaces
- **Handle Loading States:** Show feedback during async operations
- **Provide Accessibility:** Include ARIA labels and semantic HTML
- **Responsive Design:** Test on mobile and desktop
- **Error Boundaries:** Wrap components that might fail

### Don'ts ❌

- **Avoid Inline Styles:** Use Tailwind classes instead
- **Don't Hardcode Colors:** Use theme tokens from Tailwind config
- **No Magic Numbers:** Use spacing scale (4px base unit)
- **Avoid Deep Nesting:** Keep component hierarchy shallow
- **Don't Skip PropTypes:** Always validate props with TypeScript

---

## Testing Components

### Example Test (Vitest + React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button variant="primary">Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

---

## Extending Components

### Adding a New Variant

```typescript
// 1. Update ButtonProps interface
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  // ... other props
}

// 2. Add variant styles
const variantStyles = {
  // ... existing variants
  success: 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg focus:ring-green-500',
};

// 3. Document in this file
```

### Creating a Composite Component

```tsx
// Example: SearchInput (combines Input + Icon + Button)
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchInput({ onSearch, placeholder }: SearchInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || 'Search...'}
        icon={<Search className="w-4 h-4" />}
      />
      <Button variant="primary" type="submit">
        Search
      </Button>
    </form>
  );
}
```

---

## PasswordStrengthMeter Component

**Location:** `src/components/Auth/PasswordStrengthMeter.tsx`

### API Reference

```typescript
interface PasswordStrengthMeterProps {
  score: number;       // 0-4 score from zxcvbn or similar
  feedback: string[];  // Array of feedback strings
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `score` | `number` | Strength score (0=Very Weak, 4=Very Strong) |
| `feedback` | `string[]` | List of suggestions for improvement |

### Features

- **Visual Indicator:** Color-coded progress bar (Red -> Orange -> Yellow -> Green)
- **Text Feedback:** Displays strength label and specific improvement suggestions
- **Animations:** Smooth transitions for strength changes

### Example

```tsx
import PasswordStrengthMeter from '@/components/Auth/PasswordStrengthMeter';

<PasswordStrengthMeter
  score={3}
  feedback={['Add another word or two', 'Uncommon words are better']}
/>
```

---

## Related Documentation

- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) - Main design system guide
- [Color System](./color-system.md) - Color usage guidelines
- [Implementation Guide](./implementation-guide.md) - Developer setup guide

---

**Last Updated:** 2025-11-20
**Maintained by:** WellNexus Development Team
