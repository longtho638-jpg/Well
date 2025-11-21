# WellNexus Design System Documentation

**Version:** 1.0.0-seed
**Last Updated:** 2025-11-20

Welcome to the WellNexus Design System documentation. This directory contains comprehensive guides for designers and developers working with the WellNexus platform.

---

## 📚 Documentation Structure

### Main Documentation
- **[DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)** - Complete design system overview

### Detailed Guides

1. **[Component Reference](./components-reference.md)**
   - Complete API documentation for all UI components
   - Button, Input, Modal, ProductCard, and more
   - Props, variants, sizes, and usage examples
   - Testing patterns and best practices

2. **[Color System](./color-system.md)**
   - Brand color palette (Deep Teal & Marigold)
   - Color tokens and usage guidelines
   - WCAG accessibility compliance
   - Color combinations and contrast ratios

3. **[Implementation Guide](./implementation-guide.md)**
   - Setup and installation instructions
   - Tailwind CSS configuration
   - TypeScript integration
   - Performance optimization tips
   - Testing strategies

---

## 🎨 Quick Start

### For Designers

1. **Review the brand colors:**
   - Primary: Deep Teal `#00575A`
   - Accent: Marigold `#FFBF00`
   - Background: Off-White `#F3F4F6`

2. **Understand component patterns:**
   - [Component Reference](./components-reference.md) for UI specifications
   - [Color System](./color-system.md) for usage guidelines

3. **Check accessibility standards:**
   - All colors meet WCAG AA standards
   - Minimum contrast ratios: 4.5:1 for normal text

### For Developers

1. **Setup your environment:**
   ```bash
   npm install
   npm run dev
   ```

2. **Import components:**
   ```tsx
   import { Button } from '@/components/ui/Button';
   import ProductCard from '@/components/ProductCard';
   ```

3. **Use Tailwind classes:**
   ```tsx
   <div className="bg-brand-primary text-white p-6 rounded-xl">
     Content
   </div>
   ```

4. **Follow the guides:**
   - [Implementation Guide](./implementation-guide.md) for detailed setup
   - [Component Reference](./components-reference.md) for API docs

---

## 🎯 Key Principles

### 1. Trustworthy & Professional
- Clean lines and ample whitespace
- Deep Teal primary color for reliability
- Professional typography with Inter font

### 2. Empowering & Energetic
- Marigold accent for calls to action
- Gamification elements and progress indicators
- Smooth transitions and hover effects

### 3. Simple & Intuitive
- Mobile-first responsive design
- Clear typography hierarchy
- Consistent navigation patterns

---

## 🧩 Component Overview

### Base UI Components
Located in `src/components/ui/`:

- **Button** - 5 variants (primary, secondary, outline, ghost, danger)
- **Input** - Text fields with validation states
- **Modal** - Dialogs and overlays

### Composite Components
Located in `src/components/`:

- **ProductCard** - Product display with commission badge
- **CommissionWallet** - Transaction history and balance
- **Sidebar** - Navigation with AI coach widget
- **Dashboard Components** - HeroCard, StatsGrid, RevenueChart

### Usage
See [Component Reference](./components-reference.md) for complete API documentation.

---

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Deep Teal** | `#00575A` | Primary brand, navigation, headers |
| **Marigold** | `#FFBF00` | CTAs, highlights, commissions |
| **Off-White** | `#F3F4F6` | Page backgrounds |
| **White** | `#FFFFFF` | Card surfaces |
| **Dark Gray** | `#1F2937` | Primary text |
| **Gray 500** | `#6B7280` | Secondary text |

**Accessibility:** All color combinations meet WCAG AA standards (4.5:1 contrast ratio).

See [Color System](./color-system.md) for detailed usage guidelines.

---

## 🔧 Configuration Files

### Tailwind Config
**Location:** `/home/user/Well/tailwind.config.js`

```javascript
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#00575A',
        accent: '#FFBF00',
        bg: '#F3F4F6',
        dark: '#1F2937',
        surface: '#FFFFFF',
      },
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
}
```

### TypeScript Config
**Location:** `/home/user/Well/tsconfig.json`

Path alias for imports:
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

### Vite Config
**Location:** `/home/user/Well/vite.config.ts`

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

---

## 📦 Component Library Structure

```
src/
├── components/
│   ├── ui/                      # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   │
│   ├── ProductCard.tsx          # Product display component
│   ├── CommissionWallet.tsx     # Wallet & transactions
│   ├── Sidebar.tsx              # Navigation
│   ├── OnboardingQuest.tsx      # Gamification
│   │
│   └── Dashboard/               # Dashboard-specific components
│       ├── HeroCard.tsx
│       ├── StatsGrid.tsx
│       ├── RevenueChart.tsx
│       └── TopProducts.tsx
│
├── utils/
│   ├── format.ts                # Currency & number formatting
│   └── tax.ts                   # Vietnam tax calculations
│
└── types.ts                     # TypeScript type definitions
```

---

## 🧪 Testing

### Running Tests
```bash
npm test              # Run all tests
npm test:ui           # Run tests with UI
npm test:coverage     # Generate coverage report
```

### Test Structure
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });
});
```

See [Implementation Guide](./implementation-guide.md) for testing best practices.

---

## 🚀 Performance

### Optimization Techniques

1. **Code Splitting**
   ```tsx
   const Dashboard = lazy(() => import('@/pages/Dashboard'));
   ```

2. **Memoization**
   ```tsx
   const ProductCard = memo(({ product }) => { /* ... */ });
   ```

3. **Zustand Selectors**
   ```tsx
   const user = useStore(state => state.user);
   ```

4. **Image Optimization**
   ```tsx
   <img loading="lazy" decoding="async" />
   ```

See [Implementation Guide](./implementation-guide.md) for detailed optimization strategies.

---

## 🌐 Accessibility (WCAG 2.1 AA)

### Standards We Meet

✅ **Color Contrast:** 4.5:1 for normal text, 3:1 for large text
✅ **Keyboard Navigation:** All interactive elements accessible
✅ **Screen Readers:** Semantic HTML + ARIA labels
✅ **Touch Targets:** Minimum 44x44 pixels

### Best Practices

**Do's:**
- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- Provide ARIA labels for icon-only buttons
- Include alt text for images
- Ensure sufficient color contrast

**Don'ts:**
- Never use color alone to convey information
- Don't hide focus outlines
- Avoid small touch targets (<44px)
- Don't create inaccessible custom controls

See [Color System](./color-system.md) for accessibility guidelines.

---

## 📖 Additional Resources

### Documentation
- [README.md](../../README.md) - Project overview
- [CLAUDE.md](../../CLAUDE.md) - AI assistant guide
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Deployment instructions
- [USER_ONBOARDING.md](../../USER_ONBOARDING.md) - End-user manual

### External Resources
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [Lucide Icons](https://lucide.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Business Context
- **Vietnam Tax Law:** [Circular 111/2013/TT-BTC](https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-111-2013-TT-BTC-huong-dan-Luat-Thue-thu-nhap-ca-nhan-207089.aspx)

---

## 🤝 Contributing

When extending the design system:

1. **Maintain Consistency:** Follow existing patterns
2. **Document Changes:** Update relevant documentation files
3. **Test Accessibility:** Ensure WCAG AA compliance
4. **Provide Examples:** Include code snippets
5. **Get Feedback:** Review with the team

---

## 📝 Changelog

### Version 1.0.0-seed (2025-11-20)
- ✅ Initial design system documentation
- ✅ Component reference guide
- ✅ Color system documentation
- ✅ Implementation guide for developers
- ✅ Accessibility standards defined
- ✅ Testing patterns established

---

## 🔗 Quick Links

| Document | Purpose |
|----------|---------|
| [Main Design System](../../DESIGN_SYSTEM.md) | Complete overview |
| [Component Reference](./components-reference.md) | Component API docs |
| [Color System](./color-system.md) | Color usage guide |
| [Implementation Guide](./implementation-guide.md) | Developer setup |

---

**For questions or support, contact the WellNexus development team.**

**Repository:** [longtho638-jpg/Well](https://github.com/longtho638-jpg/Well)
**Branch:** `claude/design-system-docs-01JsmmdmctiQr4Km28oma8qx`

---

**Last Updated:** 2025-11-20
**Maintained by:** WellNexus Development Team
