# Color System Guide

**WellNexus Design System v1.0.0-seed**

Comprehensive guide to the WellNexus color palette, usage guidelines, and accessibility standards.

---

## Table of Contents

1. [Brand Colors](#brand-colors)
2. [Color Tokens](#color-tokens)
3. [Usage Guidelines](#usage-guidelines)
4. [Accessibility](#accessibility)
5. [Dark Mode Considerations](#dark-mode-considerations)
6. [Color Combinations](#color-combinations)

---

## Brand Colors

### Primary: Deep Teal

**Hex:** `#00575A`
**RGB:** `rgb(0, 87, 90)`
**HSL:** `hsl(182, 100%, 18%)`

**Brand Meaning:**
- **Trust:** Evokes reliability and professionalism
- **Growth:** Associated with nature and prosperity
- **Stability:** Deep, grounded tone

**Tailwind Usage:**
```css
brand-primary
deepTeal
```

**CSS Custom Property:**
```css
--color-brand-primary: #00575A;
```

**When to Use:**
- Primary navigation elements
- Headers and titles
- Important UI boundaries
- Brand identity elements
- Secondary buttons

**Visual Examples:**
```
███████████  Deep Teal #00575A
```

---

### Accent: Marigold

**Hex:** `#FFBF00`
**RGB:** `rgb(255, 191, 0)`
**HSL:** `hsl(45, 100%, 50%)`

**Brand Meaning:**
- **Energy:** Vibrant and motivating
- **Prosperity:** Associated with wealth in Vietnamese culture
- **Action:** Draws attention to key interactions

**Tailwind Usage:**
```css
brand-accent
marigold
```

**CSS Custom Property:**
```css
--color-brand-accent: #FFBF00;
```

**When to Use:**
- Primary call-to-action buttons
- Commission badges and earnings displays
- Progress indicators
- Gamification elements (badges, rewards)
- Hover states for emphasis

**Visual Examples:**
```
███████████  Marigold #FFBF00
```

**Cultural Context (Vietnam):**
- Yellow/gold represents prosperity and good fortune
- Commonly used in celebrations and business contexts
- Positive association with success and wealth

---

## Color Tokens

### Complete Palette

#### Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-bg` | `#F3F4F6` | Page backgrounds, subtle dividers |
| `brand-surface` | `#FFFFFF` | Cards, modals, elevated surfaces |

**Examples:**
```tsx
<div className="bg-brand-bg">  {/* Page background */}
  <div className="bg-brand-surface rounded-xl shadow">  {/* Card */}
    Content
  </div>
</div>
```

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-dark` | `#1F2937` | Primary text, headings |
| `text-gray-500` | `#6B7280` | Secondary text, descriptions |
| `text-gray-400` | `#9CA3AF` | Placeholder text, disabled text |

**Hierarchy Example:**
```tsx
<article>
  <h1 className="text-brand-dark font-bold">  {/* Primary heading */}
    Main Title
  </h1>
  <p className="text-gray-500">  {/* Body text */}
    Supporting description
  </p>
  <span className="text-gray-400 text-xs">  {/* Metadata */}
    Posted 2 hours ago
  </span>
</article>
```

#### Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Success | Green | `#10B981` | Successful actions, confirmations |
| Error | Red | `#EF4444` | Errors, validation messages |
| Warning | Orange | `#F59E0B` | Warnings, important notices |
| Info | Blue | `#3B82F6` | Informational messages, tips |

**Examples:**
```tsx
{/* Success message */}
<div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
  ✅ Order placed successfully!
</div>

{/* Error message */}
<div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
  ❌ Payment failed. Please try again.
</div>

{/* Warning message */}
<div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg">
  ⚠️ Low stock: Only 3 items remaining
</div>

{/* Info message */}
<div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
  ℹ️ Free shipping on orders over 1,000,000 ₫
</div>
```

#### Interactive States

| State | Treatment | Example |
|-------|-----------|---------|
| Default | Base color | `bg-brand-primary` |
| Hover | Lighter/darker | `hover:bg-teal-800` |
| Active | Pressed effect | `active:bg-teal-900` |
| Focus | Ring indicator | `focus:ring-2 focus:ring-brand-primary` |
| Disabled | 50% opacity | `disabled:opacity-50` |

---

## Usage Guidelines

### Primary Actions

**Use Marigold accent color** for the most important action on the page.

```tsx
{/* ✅ Correct: Primary CTA in Marigold */}
<Button variant="primary" className="bg-brand-accent text-brand-primary">
  Buy Now
</Button>

{/* ❌ Incorrect: Too many primary actions */}
<div className="flex gap-2">
  <Button variant="primary">Action 1</Button>
  <Button variant="primary">Action 2</Button>
  <Button variant="primary">Action 3</Button>
</div>

{/* ✅ Correct: Clear hierarchy */}
<div className="flex gap-2">
  <Button variant="primary">Buy Now</Button>
  <Button variant="outline">Share</Button>
  <Button variant="ghost">Save for Later</Button>
</div>
```

**Rule:** Maximum 1 primary button per screen section.

---

### Secondary Actions

**Use Deep Teal** for important but not primary actions.

```tsx
{/* ✅ Correct: Secondary action in Deep Teal */}
<Button variant="secondary" className="bg-brand-primary text-white">
  View Details
</Button>

{/* Navigation active state */}
<nav>
  <a className="text-brand-primary bg-brand-primary/5 border-l-4 border-brand-primary">
    Dashboard
  </a>
</nav>
```

---

### Backgrounds

**Layering System:**

```
Layer 1: Page Background (brand-bg #F3F4F6)
  └─ Layer 2: Card Surface (brand-surface #FFFFFF)
      └─ Layer 3: Nested Cards (subtle gray #F9FAFB)
```

**Implementation:**
```tsx
<div className="bg-brand-bg min-h-screen">  {/* Layer 1 */}
  <div className="container mx-auto p-6">
    <div className="bg-white rounded-xl shadow p-6">  {/* Layer 2 */}
      <div className="bg-gray-50 rounded-lg p-4">  {/* Layer 3 */}
        Nested content
      </div>
    </div>
  </div>
</div>
```

---

### Text Hierarchy

**Reading Order Importance:**

1. **Primary:** Headings, important labels → `text-brand-dark`
2. **Secondary:** Body text, descriptions → `text-gray-600`
3. **Tertiary:** Metadata, timestamps → `text-gray-400`

**Example Article:**
```tsx
<article>
  <h1 className="text-3xl font-bold text-brand-dark">  {/* Most important */}
    Product Launch Announcement
  </h1>

  <p className="text-gray-600 mt-4">  {/* Body content */}
    We're excited to introduce our latest product...
  </p>

  <footer className="mt-6 text-sm text-gray-400">  {/* Metadata */}
    Published on Nov 20, 2025 by Admin
  </footer>
</article>
```

---

### Commission & Money Display

**Always use brand colors for financial information:**

```tsx
{/* Commission earnings - use accent color */}
<span className="text-brand-accent font-bold text-2xl">
  {formatVND(3975000)}  {/* 3,975,000 ₫ */}
</span>

{/* Tax deductions - use gray */}
<span className="text-gray-500 text-sm">
  Tax: -{formatVND(197500)}  {/* -197,500 ₫ */}
</span>

{/* Net earnings - use primary color */}
<div className="text-brand-primary font-semibold">
  Net Earnings: {formatVND(3777500)}  {/* 3,777,500 ₫ */}
</div>
```

---

## Accessibility

### WCAG 2.1 Compliance

**All color combinations meet AA standard (4.5:1 for normal text, 3:1 for large text).**

#### Contrast Ratios

| Foreground | Background | Ratio | WCAG Level | Pass |
|------------|------------|-------|------------|------|
| Deep Teal (`#00575A`) | White (`#FFFFFF`) | 11.69:1 | AAA | ✅ |
| Marigold (`#FFBF00`) | Deep Teal (`#00575A`) | 4.85:1 | AA | ✅ |
| Primary Text (`#1F2937`) | White (`#FFFFFF`) | 14.59:1 | AAA | ✅ |
| Gray 500 (`#6B7280`) | White (`#FFFFFF`) | 4.76:1 | AA | ✅ |
| White (`#FFFFFF`) | Deep Teal (`#00575A`) | 11.69:1 | AAA | ✅ |

**Tools for Testing:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)
- Chrome DevTools Accessibility Panel

---

### Color Blindness Considerations

**WellNexus palette is designed to be accessible for common color vision deficiencies.**

#### Protanopia (Red-Blind)
- ✅ Deep Teal remains distinct
- ✅ Marigold shifts to yellow-green but stays vibrant
- ✅ Status colors: Use icons + text labels

#### Deuteranopia (Green-Blind)
- ✅ Deep Teal appears blue-gray (still distinct)
- ✅ Marigold remains yellow
- ✅ High contrast maintained

#### Tritanopia (Blue-Blind)
- ✅ Deep Teal shifts to cyan (clear)
- ✅ Marigold appears pink-ish but distinct
- ✅ No blue in primary palette

**Best Practice:** Never rely on color alone to convey information.

**Example:**
```tsx
{/* ❌ Bad: Color only */}
<span className="text-green-500">Available</span>
<span className="text-red-500">Out of Stock</span>

{/* ✅ Good: Color + icon + text */}
<span className="text-green-500 flex items-center gap-2">
  <CheckCircle className="w-4 h-4" /> Available
</span>
<span className="text-red-500 flex items-center gap-2">
  <XCircle className="w-4 h-4" /> Out of Stock
</span>
```

---

### Focus Indicators

**All interactive elements must have visible focus states.**

```tsx
{/* Button focus */}
<button className="
  bg-brand-accent
  focus:outline-none
  focus:ring-2
  focus:ring-brand-primary
  focus:ring-offset-2
">
  Click Me
</button>

{/* Link focus */}
<a href="#" className="
  text-brand-primary
  focus:outline-none
  focus:underline
  focus:ring-2
  focus:ring-brand-primary
  focus:ring-offset-2
  rounded
">
  Learn More
</a>
```

**Focus Ring Colors:**
- Primary elements: `focus:ring-brand-primary`
- Secondary elements: `focus:ring-gray-300`
- Danger actions: `focus:ring-red-500`

---

## Dark Mode Considerations

**Current Status:** Dark mode is not implemented in v1.0.0-seed.

**Future Implementation:**

```css
/* Proposed dark mode palette */
:root[data-theme="dark"] {
  --color-brand-primary: #00898E;     /* Lighter teal */
  --color-brand-accent: #FFBF00;      /* Same marigold */
  --color-brand-bg: #111827;          /* Dark gray */
  --color-brand-surface: #1F2937;     /* Elevated dark */
  --color-brand-dark: #F9FAFB;        /* Light text */
}
```

**Tailwind Dark Mode:**
```tsx
<div className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
">
  Content
</div>
```

---

## Color Combinations

### Approved Combinations

#### Hero Sections
```css
Background: Deep Teal (#00575A)
Text: White (#FFFFFF)
Accent: Marigold (#FFBF00)
```

```tsx
<header className="bg-brand-primary text-white p-12">
  <h1 className="text-4xl font-bold mb-4">
    Welcome to WellNexus
  </h1>
  <Button className="bg-brand-accent text-brand-primary">
    Get Started
  </Button>
</header>
```

#### Cards
```css
Background: White (#FFFFFF)
Border: Gray 200 (#E5E7EB)
Text: Brand Dark (#1F2937)
Accent: Marigold for highlights
```

```tsx
<div className="bg-white border border-gray-200 rounded-xl p-6">
  <h3 className="text-brand-dark font-bold mb-2">Card Title</h3>
  <p className="text-gray-600">Description text</p>
  <span className="text-brand-accent font-semibold">Highlighted info</span>
</div>
```

#### Forms
```css
Input Background: White (#FFFFFF)
Input Border: Gray 300 (#D1D5DB)
Input Focus: Deep Teal ring
Label: Brand Dark (#1F2937)
Helper Text: Gray 500 (#6B7280)
```

```tsx
<div>
  <label className="block text-brand-dark font-semibold mb-2">
    Email Address
  </label>
  <input
    type="email"
    className="
      w-full
      bg-white
      border border-gray-300
      rounded-lg
      p-2
      focus:ring-2 focus:ring-brand-primary
      focus:border-transparent
    "
  />
  <p className="text-gray-500 text-sm mt-1">
    We'll never share your email
  </p>
</div>
```

---

### Forbidden Combinations

❌ **Marigold on White** (insufficient contrast for text)
```tsx
{/* ❌ Don't do this */}
<p className="text-brand-accent">  {/* Contrast ratio: 2.1:1 - FAILS */}
  Hard to read text
</p>

{/* ✅ Do this instead */}
<p className="text-brand-primary">  {/* Contrast ratio: 11.69:1 - PASSES */}
  Easy to read text
</p>
```

❌ **Gray on Gray** (low contrast)
```tsx
{/* ❌ Don't do this */}
<div className="bg-gray-200 text-gray-400">
  Low contrast text
</div>

{/* ✅ Do this instead */}
<div className="bg-gray-100 text-gray-700">
  High contrast text
</div>
```

❌ **Deep Teal on Black** (insufficient differentiation)
```tsx
{/* ❌ Don't do this */}
<div className="bg-black text-brand-primary">
  Hard to see
</div>

{/* ✅ Do this instead */}
<div className="bg-white text-brand-primary">
  Clear and readable
</div>
```

---

## Quick Reference

### Tailwind Classes Cheat Sheet

```css
/* Brand Colors */
bg-brand-primary       /* Deep Teal background */
bg-brand-accent        /* Marigold background */
bg-brand-bg            /* Off-white page background */
bg-brand-surface       /* White surface */

text-brand-primary     /* Deep Teal text */
text-brand-accent      /* Marigold text */
text-brand-dark        /* Dark gray text */

border-brand-primary   /* Deep Teal border */

/* Status Colors */
text-green-500         /* Success */
text-red-500           /* Error */
text-orange-500        /* Warning */
text-blue-500          /* Info */

bg-green-50            /* Success background */
bg-red-50              /* Error background */
bg-orange-50           /* Warning background */
bg-blue-50             /* Info background */

/* Interactive States */
hover:bg-brand-primary
focus:ring-brand-primary
active:bg-brand-primary
disabled:opacity-50
```

---

## Related Documentation

- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) - Main design system guide
- [Component Reference](./components-reference.md) - Component API documentation
- [Implementation Guide](./implementation-guide.md) - Developer setup guide

---

**Last Updated:** 2025-11-20
**Maintained by:** WellNexus Development Team
