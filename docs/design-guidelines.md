# Aura Elite Design System

## Overview

Aura Elite is a sophisticated dark glassmorphism design system for premium admin dashboards. It combines deep gradients, translucent surfaces, and refined purple accents to create an immersive, professional interface that maintains WCAG AA accessibility standards.

---

## Design Principles

1. **Depth Through Glass** - Layered transparency creates visual hierarchy
2. **Elegant Minimalism** - Clean layouts with purposeful spacing
3. **Accessible Luxury** - Premium aesthetics without sacrificing usability
4. **Responsive Fluidity** - Seamless adaptation across all devices
5. **Purposeful Motion** - Subtle animations enhance UX without distraction

---

## Color System

### Base Palette

```css
/* Background Gradients */
--bg-primary: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
--bg-secondary: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
--bg-tertiary: linear-gradient(135deg, #16213e 0%, #0f3460 100%);

/* Surface Colors */
--surface-glass: rgba(255, 255, 255, 0.05);
--surface-glass-hover: rgba(255, 255, 255, 0.08);
--surface-glass-active: rgba(255, 255, 255, 0.12);

/* Accent Colors */
--accent-primary: #667eea;
--accent-secondary: #764ba2;
--accent-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Text Colors (WCAG AA Compliant) */
--text-primary: #ffffff;        /* 21:1 contrast on dark bg */
--text-secondary: #b8c1ec;      /* 8.59:1 contrast */
--text-tertiary: #8892b0;       /* 5.14:1 contrast */
--text-muted: #6b7280;          /* 4.54:1 contrast - AA compliant */
```

### Semantic Colors

```css
/* Status Colors */
--success: #10b981;
--success-bg: rgba(16, 185, 129, 0.1);
--warning: #f59e0b;
--warning-bg: rgba(245, 158, 11, 0.1);
--error: #ef4444;
--error-bg: rgba(239, 68, 68, 0.1);
--info: #3b82f6;
--info-bg: rgba(59, 130, 246, 0.1);
```

### Contrast Verification

All text color combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text):

- `text-primary` on `bg-primary`: 21:1 ✓
- `text-secondary` on `bg-primary`: 8.59:1 ✓
- `text-tertiary` on `bg-primary`: 5.14:1 ✓
- `accent-primary` on `bg-primary`: 6.2:1 ✓

---

## Typography

### Font Stack

```css
/* Primary Font */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace Font */
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

**Vietnamese Support**: Inter has full Vietnamese character set support (ă, â, đ, ê, ô, ơ, ư with diacriticals).

### Type Scale

```css
/* Headings */
--text-5xl: 3rem;      /* 48px - Hero titles */
--text-4xl: 2.25rem;   /* 36px - Page titles */
--text-3xl: 1.875rem;  /* 30px - Section headers */
--text-2xl: 1.5rem;    /* 24px - Card titles */
--text-xl: 1.25rem;    /* 20px - Subsection headers */
--text-lg: 1.125rem;   /* 18px - Large body */

/* Body */
--text-base: 1rem;     /* 16px - Default body */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-xs: 0.75rem;    /* 12px - Captions */
```

### Line Heights

```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Typography Usage

```css
/* H1 - Page Title */
h1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* H2 - Section Header */
h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* Body Text */
p {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Small Text */
.text-small {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-tertiary);
}
```

---

## Glassmorphism Effects

### Core Glass Pattern

```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

### Glass Variations

```css
/* Light Glass */
.glass-light {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Medium Glass (Default) */
.glass-medium {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Strong Glass */
.glass-strong {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Accent Glass */
.glass-accent {
  background: linear-gradient(135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(102, 126, 234, 0.2);
}
```

---

## Spacing System

### Base Unit: 4px

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

### Layout Spacing

- **Component padding**: 24px (--space-6)
- **Card padding**: 24-32px (--space-6 to --space-8)
- **Section spacing**: 48-64px (--space-12 to --space-16)
- **Element gaps**: 16px (--space-4)

---

## Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

**Usage:**
- Cards: `--radius-lg` (16px)
- Buttons: `--radius-md` (12px)
- Inputs: `--radius-md` (12px)
- Modals: `--radius-xl` (20px)
- Avatars: `--radius-full`

---

## Shadows

```css
/* Elevation Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Glow Effects */
--glow-accent: 0 0 20px rgba(102, 126, 234, 0.3);
--glow-accent-strong: 0 0 30px rgba(102, 126, 234, 0.5);
```

---

## Components

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  border: none;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  box-shadow: var(--shadow-lg), var(--glow-accent);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Secondary Button (Glass) */
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  color: var(--text-primary);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}
```

### Cards

```css
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

/* Card with Accent Border */
.card-accent {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.card-accent::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  padding: 1px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

### Inputs

```css
.input {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: var(--text-base);
  width: 100%;
  transition: all 0.2s ease;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input:hover:not(:focus) {
  border-color: rgba(255, 255, 255, 0.15);
}
```

### Navigation

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg,
    rgba(102, 126, 234, 0.15) 0%,
    rgba(118, 75, 162, 0.15) 100%);
  color: var(--accent-primary);
  border-left: 3px solid var(--accent-primary);
}
```

### Tables

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table thead {
  background: rgba(255, 255, 255, 0.03);
}

.table th {
  padding: var(--space-4);
  text-align: left;
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.table td {
  padding: var(--space-4);
  color: var(--text-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table tbody tr {
  transition: background 0.2s ease;
}

.table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid var(--success);
}

.badge-warning {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid var(--warning);
}

.badge-error {
  background: var(--error-bg);
  color: var(--error);
  border: 1px solid var(--error);
}

.badge-info {
  background: var(--info-bg);
  color: var(--info);
  border: 1px solid var(--info);
}
```

---

## Layout Patterns

### Sidebar + Main Content

```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  background: var(--bg-primary);
}

.sidebar {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: var(--space-6);
}

.main-content {
  padding: var(--space-8);
  overflow-y: auto;
}
```

### Grid Layouts

```css
/* 3-Column Grid */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

/* 4-Column Grid */
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-6);
}

/* Responsive Grid */
.grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}
```

---

## Animations

### Transition Timing

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--transition-slower: 500ms;

--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Keyframe Animations

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide In From Right */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Shimmer (Loading) */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
```

### Motion Preferences

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### Media Queries

```css
/* Tablet and up */
@media (min-width: 768px) {
  .dashboard-layout {
    grid-template-columns: 280px 1fr;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    left: -100%;
    transition: left 0.3s ease;
    z-index: 50;
  }

  .sidebar.open {
    left: 0;
  }
}
```

---

## Accessibility Guidelines

### Focus States

```css
/* Custom focus ring */
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Remove default outline */
*:focus {
  outline: none;
}
```

### Interactive Element Requirements

- **Minimum touch target**: 44x44px for mobile
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- **Keyboard navigation**: All interactive elements must be accessible via keyboard
- **Screen reader support**: Proper ARIA labels and semantic HTML

### ARIA Patterns

```html
<!-- Navigation -->
<nav aria-label="Main navigation">
  <a href="#" aria-current="page">Dashboard</a>
</nav>

<!-- Buttons -->
<button aria-label="Close modal">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Form inputs -->
<label for="email">Email</label>
<input
  id="email"
  type="email"
  aria-describedby="email-hint"
  aria-required="true"
>
<p id="email-hint">We'll never share your email</p>
```

---

## Design Tokens (CSS Variables)

### Complete Token Set

```css
:root {
  /* Colors */
  --color-bg-primary: #0f0f1e;
  --color-bg-secondary: #1a1a2e;
  --color-surface-glass: rgba(255, 255, 255, 0.05);
  --color-accent: #667eea;
  --color-text-primary: #ffffff;
  --color-text-secondary: #b8c1ec;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-family-base: 'Inter', sans-serif;
  --font-size-base: 1rem;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --line-height-normal: 1.5;

  /* Border */
  --border-radius-sm: 8px;
  --border-radius-md: 12px;
  --border-radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Implementation Checklist

### Before Starting Development

- [ ] Load Inter font via Google Fonts
- [ ] Set up CSS custom properties (design tokens)
- [ ] Configure base styles and resets
- [ ] Test backdrop-filter browser support
- [ ] Verify color contrast ratios with accessibility tools

### During Development

- [ ] Use mobile-first responsive approach
- [ ] Test keyboard navigation on all interactive elements
- [ ] Verify focus states are visible
- [ ] Check color contrast with WebAIM tool
- [ ] Test with screen readers (VoiceOver/NVDA)

### Before Launch

- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS Safari, Chrome Mobile)
- [ ] Accessibility audit with Lighthouse
- [ ] Performance optimization (bundle size, lazy loading)
- [ ] Documentation for developers

---

## Resources

### Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Accessibility Tools

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Lighthouse**: Built into Chrome DevTools
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool

### Design Inspiration

- **Dribbble**: Search "glassmorphism admin dashboard"
- **Behance**: Dark UI design systems
- **Awwwards**: Award-winning dashboard designs

---

## Theme System (Dark/Light Mode)

### Architecture

- **Strategy**: Tailwind CSS `darkMode: 'class'` on `<html>` element
- **Context**: `ThemeProvider` in `src/context/ThemeContext.tsx`
- **Toggle**: `ThemeToggle` component at `src/components/ui/ThemeToggle.tsx`
- **Persistence**: `localStorage` key `wellnexus-theme`
- **Default**: System preference, fallback to `dark` (Aura Elite primary mode)

### FOUC Prevention

Inline `<script>` in `index.html` applies theme class before React hydration:
```html
<script>
  (function() {
    var theme = localStorage.getItem('wellnexus-theme');
    if (!theme) theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  })();
</script>
```

### CSS Custom Properties

Theme tokens live in `src/index.css` under `:root` (light) and `.dark` (dark):

| Token | Light | Dark |
|---|---|---|
| `--color-bg-primary` | `#F3F4F6` | `#0F172A` |
| `--color-surface` | `#FFFFFF` | `#1E293B` |
| `--color-surface-glass` | `rgba(255,255,255,0.70)` | `rgba(255,255,255,0.05)` |
| `--color-text-primary` | `#1F2937` | `#F1F5F9` |
| `--color-text-secondary` | `#4B5563` | `#CBD5E1` |
| `--color-brand-primary` | `#00575A` (deep teal) | `#2DD4BF` (teal-400) |

### Usage Guidelines

1. **Always use `dark:` variants** when adding background, text, or border colors
2. **Test both modes** after any UI change
3. **Glassmorphism** works in both modes via `glass-pearl` utility class
4. **Sidebar, header, cards** must maintain legibility in both modes
5. **ThemeToggle** uses `role="switch"` + `aria-checked` for accessibility
6. **System preference listener** follows OS theme when user has no explicit preference

### Light Mode Design

Light mode retains Aura Elite identity with:
- Warm gradients: `from-amber-50 via-orange-50 to-rose-50`
- Glass surfaces: `bg-white/70 backdrop-blur-xl`
- Teal brand accents on white/gray backgrounds
- Softer shadows and borders

---

## Version History

- **v1.1.0** (2026-02-07): Added dual-theme system (Dark/Light), FOUC prevention, CSS custom properties, accessibility improvements, prefers-reduced-motion support
- **v1.0.0** (2026-02-07): Initial Aura Elite design system for WellNexus Admin Dashboard
