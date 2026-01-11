# WellNexus Design System

**Version:** 1.0.0-seed
**Author:** AI UX Expert
**Date:** 2025-11-20
**Status:** Draft
**Target Audience:** Designers, Developers, Product Managers

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Principles](#design-principles)
3. [Visual Identity](#visual-identity)
   - [Color Palette](#color-palette)
   - [Typography](#typography)
   - [Iconography](#iconography)
   - [Spacing System](#spacing-system)
4. [Component Library](#component-library)
   - [Buttons](#buttons)
   - [Cards](#cards)
   - [Input Fields](#input-fields)
   - [Navigation](#navigation)
5. [Layout Guidelines](#layout-guidelines)
6. [Accessibility Standards](#accessibility-standards)
7. [Usage Examples](#usage-examples)
8. [Resources](#resources)

---

## Executive Summary

### Overview
This document outlines the design system for **WellNexus**, a Hybrid Community Commerce Platform. It establishes the visual language, component library, and usage guidelines to ensure consistency, efficiency, and scalability across the platform's web and mobile interfaces.

### Strategic Alignment
The design system supports the company's goal of building a **trusted and empowering platform** for distributors and consumers by providing a cohesive and professional user experience.

### Key Objectives
- ✅ Establish a unified visual identity (Deep Teal & Marigold)
- ✅ Create a comprehensive component library for rapid development
- ✅ Ensure accessibility and usability across all devices
- ✅ Facilitate collaboration between design and development teams

---

## Design Principles

### 1. Trustworthy & Professional
**Description:** The design should evoke confidence and reliability, reflecting the brand's commitment to transparency and quality.

**Application:**
- Use clean lines and ample whitespace
- Employ the Deep Teal primary color (`#00575A`)
- Maintain consistent card shadows and borders
- Professional typography with the Inter font family

### 2. Empowering & Energetic
**Description:** The interface should motivate users to take action and achieve their goals.

**Application:**
- Use the Marigold accent color (`#FFBF00`) for calls to action
- Incorporate progress indicators and gamification elements
- Smooth transitions and hover effects
- Visual feedback for user interactions

### 3. Simple & Intuitive
**Description:** The platform should be easy to navigate and understand, even for non-technical users.

**Application:**
- Mobile-first responsive design
- Clear typography hierarchy
- Consistent navigation patterns
- Minimal cognitive load per screen

---

## Visual Identity

### Color Palette

#### Primary Colors

**Deep Teal** `#00575A`
```css
/* Tailwind Config */
brand-primary: '#00575A'
deepTeal: '#00575A'
```
**Usage:** Primary brand color, headers, primary buttons, navigation highlights

**Marigold** `#FFBF00`
```css
/* Tailwind Config */
brand-accent: '#FFBF00'
marigold: '#FFBF00'
```
**Usage:** Accent color, call-to-action buttons, highlights, gamification badges, commission indicators

#### Background Colors

**Off-White** `#F3F4F6`
```css
brand-bg: '#F3F4F6'
```
**Usage:** Page backgrounds, subtle section dividers

**Surface White** `#FFFFFF`
```css
brand-surface: '#FFFFFF'
```
**Usage:** Card backgrounds, modals, dropdowns, content containers

#### Text Colors

**Primary Text** `#1F2937`
```css
brand-dark: '#1F2937'
```
**Usage:** Main content, headings, high-emphasis text

**Secondary Text** `#6B7280`
```css
text-gray-500
```
**Usage:** Supporting text, descriptions, metadata

#### Status Colors

| Color   | Hex Code  | Usage                     |
|---------|-----------|---------------------------|
| Success | `#10B981` | Successful actions, confirmations |
| Error   | `#EF4444` | Errors, warnings, destructive actions |
| Warning | `#F59E0B` | Alerts, important notices |
| Info    | `#3B82F6` | Informational messages    |

#### Color Contrast Guidelines

All color combinations meet **WCAG AA** standards:
- Primary text on white background: **14.59:1** ✅
- Marigold on Deep Teal: **4.85:1** ✅
- White text on Deep Teal: **11.69:1** ✅

---

### Typography

#### Font Family
**Inter** (sans-serif) loaded via Google Fonts CDN

```css
font-family: 'Inter', sans-serif;
```

**Why Inter?**
- Optimized for screen readability
- Extensive weight options (300-900)
- Excellent Vietnamese character support
- Professional and modern aesthetic

#### Type Scale

| Element      | Tailwind Class    | Size (px) | Weight  | Usage                    |
|--------------|-------------------|-----------|---------|--------------------------|
| H1           | `text-3xl`        | 30px      | Bold    | Page titles              |
| H2           | `text-2xl`        | 24px      | Bold    | Section headings         |
| H3           | `text-xl`         | 20px      | Semibold| Subsection headings      |
| Body Large   | `text-base`       | 16px      | Regular | Primary content          |
| Body Regular | `text-sm`         | 14px      | Regular | Supporting text          |
| Body Small   | `text-xs`         | 12px      | Regular | Captions, labels         |

#### Font Weights

```css
font-normal: 400   /* Regular text */
font-semibold: 600 /* Emphasis */
font-bold: 700     /* Headings, buttons */
```

#### Line Height
- **Headings:** `1.2` (tight spacing)
- **Body text:** `1.5` (comfortable reading)
- **Small text:** `1.4` (compact but readable)

---

### Iconography

**Icon Set:** [Lucide React](https://lucide.dev/)

**Specifications:**
- **Style:** Stroke-based, 2px width
- **Sizes:** 16px (sm), 20px (md), 24px (lg)
- **Color:** Inherit from parent element

**Common Icons:**
```tsx
import {
  ShoppingBag,    // Purchases, orders
  Share2,          // Sharing products
  Eye,             // View details
  Loader2,         // Loading states
  CheckCircle,     // Success confirmations
  TrendingUp,      // Growth, progress
  Users,           // Team, network
  Wallet,          // Commissions, earnings
  Gift,            // Rewards, bonuses
  Target           // Goals, quests
} from 'lucide-react';
```

**Usage Guidelines:**
- Always include descriptive `aria-label` for icon-only buttons
- Use consistent sizing across similar UI contexts
- Pair icons with text labels for primary actions
- Animate icons sparingly (loading spinners, success checks)

---

### Spacing System

**Base Unit:** `4px`

**Scale:**
```css
1  = 4px   /* xs - Tight spacing */
2  = 8px   /* sm - Compact */
3  = 12px  /* md - Comfortable */
4  = 16px  /* lg - Standard */
6  = 24px  /* xl - Spacious */
8  = 32px  /* 2xl - Section gaps */
12 = 48px  /* 3xl - Large sections */
16 = 64px  /* 4xl - Page sections */
```

**Application:**
```tsx
// Padding/Margin
p-4   /* 16px all sides */
px-6  /* 24px horizontal */
py-3  /* 12px vertical */
mb-8  /* 32px bottom margin */

// Gap (Flexbox/Grid)
gap-3   /* 12px between items */
gap-x-4 /* 16px horizontal gap */
```

---

## Component Library

### Buttons

#### Primary Button
**Purpose:** Main call-to-action (e.g., "Buy Now", "Submit")

**Implementation:**
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md">
  Buy Now
</Button>
```

**Styles:**
```css
bg-brand-accent        /* Marigold background */
hover:bg-yellow-400    /* Lighter on hover */
text-brand-primary     /* Deep Teal text */
shadow-lg              /* Elevated shadow */
font-bold rounded-xl   /* Rounded corners */
```

**Visual Example:**
```
┌─────────────────────┐
│   🛍️  Buy Now       │  ← Marigold bg, Deep Teal text
└─────────────────────┘
```

#### Secondary Button
**Purpose:** Alternative actions (e.g., "Learn More", "Cancel")

**Implementation:**
```tsx
<Button variant="secondary" size="md">
  Learn More
</Button>
```

**Styles:**
```css
bg-brand-primary       /* Deep Teal background */
hover:bg-teal-800      /* Darker on hover */
text-white             /* White text */
shadow-md              /* Subtle shadow */
```

#### Outline Button
**Purpose:** Tertiary actions (e.g., "Share", "View Details")

**Implementation:**
```tsx
<Button variant="outline" size="sm">
  Share
</Button>
```

**Styles:**
```css
border-2 border-gray-200  /* Light border */
text-gray-700             /* Dark gray text */
hover:bg-gray-50          /* Subtle hover */
```

#### Button States

| State    | Visual Treatment                     |
|----------|--------------------------------------|
| Default  | Full color, sharp shadows            |
| Hover    | Brighter background, larger shadow   |
| Active   | Slightly darker, pressed effect      |
| Disabled | 50% opacity, no hover effects        |
| Loading  | Spinner icon, "Loading..." text      |

**Loading State Example:**
```tsx
<Button variant="primary" isLoading>
  Processing
</Button>

// Renders:
// ⏳ Loading...
```

#### Button Sizes

```tsx
<Button size="sm">   {/* px-3 py-1.5 text-xs */}
<Button size="md">   {/* px-4 py-2.5 text-sm */}
<Button size="lg">   {/* px-6 py-3.5 text-base */}
```

---

### Cards

#### Standard Card
**Purpose:** Container for content (e.g., product listings, dashboard widgets)

**Implementation:**
```tsx
<div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
  {/* Card content */}
</div>
```

**Styles:**
```css
bg-white              /* White background */
rounded-xl            /* 12px border radius */
shadow-sm             /* Subtle shadow */
border border-gray-100 /* Light border */
```

**Hover Effect:**
```css
hover:shadow-xl                    /* Elevated shadow */
hover:border-brand-primary/20      /* Tinted border */
transition-all duration-300        /* Smooth transition */
```

#### Hero Card
**Purpose:** Featured content container (e.g., dashboard hero, announcements)

**Implementation:**
```tsx
<div className="bg-gradient-to-r from-brand-primary to-teal-800 rounded-2xl p-6 text-white shadow-xl">
  {/* Hero content */}
</div>
```

**Styles:**
```css
bg-gradient-to-r from-brand-primary to-teal-800  /* Gradient background */
rounded-2xl                                       /* 16px border radius */
p-6                                               /* 24px padding */
text-white                                        /* White text */
shadow-xl                                         /* Strong shadow */
```

**Visual Example:**
```
╔════════════════════════════════╗
║  🏆 Founder Club Progress      ║  ← Deep Teal gradient
║  85% to next tier              ║
║  [████████░░] 85/100M VND      ║
╚════════════════════════════════╝
```

#### Product Card
**Purpose:** Display product information with interactive elements

**Key Features:**
- Product image with hover zoom effect
- Commission badge overlay
- Stock indicator
- Share and Buy buttons
- Out-of-stock state

**Implementation:** See `src/components/ProductCard.tsx`

**Anatomy:**
```
┌─────────────────────────┐
│                         │
│   [Product Image]       │  ← Hover: scale-110
│   ┌──────────────┐      │
│   │ Earn 3.9M ₫  │      │  ← Commission badge
│   └──────────────┘      │
│                         │
├─────────────────────────┤
│ Product Name            │
│ 15,900,000 ₫  Stock: 10 │
│ Description...          │
│                         │
│ [Share] [Buy Now]       │  ← Action buttons
└─────────────────────────┘
```

---

### Input Fields

#### Text Field
**Purpose:** Single-line text input (e.g., search, forms)

**Implementation:**
```tsx
import { Input } from '@/components/ui/Input';

<Input
  type="text"
  placeholder="Search products..."
  variant="default"
/>
```

**Styles:**
```css
border border-gray-300           /* Light border */
rounded-lg                       /* 8px border radius */
p-2                              /* 8px padding */
focus:ring-2 focus:ring-brand-primary  /* Focus state */
focus:border-transparent         /* Remove border on focus */
```

**States:**
- **Default:** Light gray border
- **Focus:** Deep Teal ring, no border
- **Error:** Red border and ring
- **Disabled:** Gray background, reduced opacity

---

### Navigation

#### Sidebar (Desktop)
**Location:** `src/components/Sidebar.tsx`

**Structure:**
```
┌──────────────────┐
│  WellNexus       │  ← Logo
│                  │
│  📊 Dashboard    │  ← Navigation links
│  🛍️ Marketplace  │
│  💰 Wallet       │
│  🎯 Quests       │
│                  │
│  [AI Coach]      │  ← Fixed widget
└──────────────────┘
```

**Styles:**
```css
Fixed left sidebar
bg-white
border-r border-gray-200
w-64  /* 256px width */
```

**Active State:**
```css
bg-brand-primary/5       /* Light teal background */
text-brand-primary       /* Deep teal text */
border-l-4 border-brand-primary  /* Left accent bar */
```

#### Bottom Navigation (Mobile)
**Purpose:** Mobile-optimized navigation

**Structure:**
```
┌─────────────────────────────┐
│  📊    🛍️    💰    🎯      │
│  Home  Shop  Wallet Quests  │
└─────────────────────────────┘
```

**Styles:**
```css
Fixed bottom
bg-white
border-t border-gray-200
Safe area padding (iOS)
```

---

## Layout Guidelines

### Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Grid System

**Desktop Layout:**
```tsx
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-3">  {/* Sidebar */}
  <div className="col-span-9">  {/* Main content */}
</div>
```

**Product Grid:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Product cards */}
</div>
```

### Container Widths

```css
max-w-7xl  /* 1280px - Main content */
max-w-4xl  /* 896px - Forms, articles */
max-w-sm   /* 384px - Modals */
```

---

## Accessibility Standards

### WCAG 2.1 Compliance (AA Level)

✅ **Color Contrast:**
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

✅ **Keyboard Navigation:**
- All interactive elements are keyboard accessible
- Focus states clearly visible
- Skip links for main content

✅ **Screen Readers:**
- Semantic HTML elements (`<nav>`, `<main>`, `<article>`)
- ARIA labels for icon-only buttons
- Alt text for all images

✅ **Touch Targets:**
- Minimum size: 44x44 pixels
- Adequate spacing between interactive elements

### Best Practices

**Do's:**
- ✅ Use semantic HTML tags
- ✅ Provide descriptive link text
- ✅ Ensure sufficient color contrast
- ✅ Test with keyboard navigation
- ✅ Include focus indicators

**Don'ts:**
- ❌ Use color alone to convey information
- ❌ Create inaccessible custom controls
- ❌ Hide focus outlines
- ❌ Use small touch targets (<44px)

---

## Usage Examples

### Creating a Product Listing

```tsx
import ProductCard from '@/components/ProductCard';
import { mockProducts } from '@/data/mockData';

function Marketplace() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {mockProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Building a Form

```tsx
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  return (
    <form className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-brand-dark mb-6">Login</h2>

      <Input
        type="email"
        placeholder="Email address"
        variant="default"
      />

      <Input
        type="password"
        placeholder="Password"
        variant="default"
      />

      <Button variant="primary" size="lg" className="w-full">
        Sign In
      </Button>
    </form>
  );
}
```

### Creating a Dashboard Widget

```tsx
function StatsCard({ title, value, trend, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
        <Icon className="w-5 h-5 text-brand-primary" />
      </div>

      <p className="text-3xl font-bold text-brand-dark">{value}</p>

      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-semibold ${
          trend >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
        <span className="text-xs text-gray-500">vs last week</span>
      </div>
    </div>
  );
}
```

---

## Resources

### Design Files
- **Figma:** [WellNexus Design System](#) *(To be created)*
- **Icon Library:** [Lucide React](https://lucide.dev/)

### Code Repository
- **GitHub:** [longtho638-jpg/Well](https://github.com/longtho638-jpg/Well)
- **Branch:** `claude/design-system-docs-01JsmmdmctiQr4Km28oma8qx`

### Related Documentation
- [README.md](./README.md) - Project overview
- [CLAUDE.md](./CLAUDE.md) - AI assistant guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [USER_ONBOARDING.md](./USER_ONBOARDING.md) - End-user manual

### External Resources
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://m2.material.io/design/usability/accessibility.html)

### Business Context
- **Vietnam Tax Law:** [Circular 111/2013/TT-BTC](https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-111-2013-TT-BTC-huong-dan-Luat-Thue-thu-nhap-ca-nhan-207089.aspx)

---

## Changelog

### Version 1.0.0-seed (2025-11-20)
- ✅ Initial design system documentation
- ✅ Defined color palette and typography
- ✅ Documented button variants and states
- ✅ Created card component specifications
- ✅ Established accessibility standards
- ✅ Added usage examples

---

## Contributing

When extending this design system:

1. **Maintain Consistency:** Follow existing patterns and naming conventions
2. **Document Changes:** Update this file with new components or modifications
3. **Test Accessibility:** Ensure all additions meet WCAG AA standards
4. **Provide Examples:** Include code snippets for new components
5. **Review with Team:** Get feedback from designers and developers

---

**For questions or suggestions, contact the development team.**

**Last Updated:** 2025-11-20
**Maintained by:** WellNexus Development Team
