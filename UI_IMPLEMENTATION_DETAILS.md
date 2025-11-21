# WellNexus MVP - Visual Design & Implementation Details

## File Structure Summary

```
src/
├── App.tsx                    # Main router with DashboardLayout
├── index.css                  # Tailwind + custom scrollbar styles
├── components/
│   ├── Sidebar.tsx           # Navigation + AI Coach widget
│   ├── ProductCard.tsx       # Reusable product card component
│   ├── CommissionWallet.tsx  # Wallet balance + transactions
│   ├── OnboardingQuest.tsx   # Gamification component
│   └── Dashboard/
│       ├── HeroCard.tsx      # Hero card with progress
│       ├── StatsGrid.tsx     # 3x stat cards
│       ├── RevenueChart.tsx  # Area chart visualization
│       └── TopProducts.tsx   # Product list component
├── pages/
│   ├── LandingPage.tsx       # Marketing homepage
│   ├── Dashboard.tsx         # Dashboard main page
│   ├── Marketplace.tsx       # Product listing with search
│   └── ProductDetail.tsx     # Product detail page with tabs
├── types.ts                  # TypeScript interfaces
├── store.ts                  # Zustand state management
├── utils/
│   ├── format.ts            # Number formatting utilities
│   └── tax.ts               # Tax calculation logic
└── data/mockData.ts         # Mock data for MVP

tailwind.config.js            # Design system tokens
package.json                  # Dependencies
```

---

## Design System Tokens

### Color System
```javascript
// tailwind.config.js
colors: {
  brand: {
    primary: '#00575A',    // Deep Teal - Primary brand
    accent: '#FFBF00',     // Marigold - Secondary/CTA
    bg: '#F3F4F6',        // Off-white - Page background
    dark: '#1F2937',      // Text primary
    surface: '#FFFFFF',   // Card background
  },
}
```

### Usage Examples from Components:

**HeroCard (Gradient Primary)**
```tsx
className="bg-gradient-to-r from-brand-primary to-teal-900"
```

**ProductCard (White Surface with Border)**
```tsx
className="bg-white rounded-xl border border-gray-100 shadow-sm"
```

**StatsGrid - Success Card (Dark theme)**
```tsx
className="bg-brand-dark p-6 rounded-2xl shadow-lg text-white"
```

---

## Component Library Patterns

### 1. Card Variants

#### Standard White Card
**Used in:** Dashboard stats, Product detail sections
**Location:** `/src/components/Dashboard/StatsGrid.tsx`
```tsx
<motion.div 
  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md"
>
  {/* Content */}
</motion.div>
```

#### Gradient Card
**Used in:** HeroCard, CommissionWallet balance, Sidebar Coach
**Location:** `/src/components/Dashboard/HeroCard.tsx`
```tsx
<div className="bg-gradient-to-r from-brand-primary to-teal-900 rounded-2xl p-8">
  {/* Decorative circles */}
  <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
</div>
```

#### Glassmorphic Card
**Used in:** HeroCard referral section, AI Opportunity Radar
**Location:** `/src/components/Dashboard/HeroCard.tsx`
```tsx
<div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
  {/* Content with opacity classes */}
</div>
```

### 2. Button Patterns

#### Primary CTA Button (Brand Accent)
**Used in:** All major CTAs, Login, Buy Now
**Location:** Multiple files
```tsx
className="bg-brand-accent hover:bg-yellow-400 text-brand-primary px-8 py-4 rounded-xl font-bold shadow-lg transition-all"
```

#### Secondary Button (Border)
**Used in:** Share buttons, Cancel actions
**Location:** `/src/components/ProductCard.tsx`
```tsx
className="border border-gray-200 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50"
```

#### Navigation Button (Sidebar)
**Used in:** Sidebar navigation items
**Location:** `/src/components/Sidebar.tsx`
```tsx
className={`${
  isActive 
    ? 'bg-brand-primary text-white shadow-md' 
    : 'text-gray-500 hover:bg-brand-primary/5'
} rounded-xl text-sm font-medium transition-all`}
```

### 3. Input Patterns

#### Search Input
**Used in:** Marketplace search
**Location:** `/src/pages/Marketplace.tsx`
```tsx
<div className="relative w-full sm:w-72">
  <Search className="absolute inset-y-0 left-0 pl-3 h-5 w-5 text-gray-400" />
  <input 
    placeholder="Search products..." 
    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
  />
</div>
```

#### Select Dropdown
**Used in:** Chart filter
**Location:** `/src/components/Dashboard/RevenueChart.tsx`
```tsx
<select className="appearance-none bg-gray-50 border border-gray-200 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-brand-primary/20">
  <option>Last 7 Days</option>
  <option>Last 30 Days</option>
</select>
```

### 4. Badge/Status Patterns

#### Commission Badge (On Product Cards)
**Location:** `/src/components/ProductCard.tsx`
```tsx
<div className="bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
  Earn {formatVND(commissionAmount)}
</div>
```

#### Status Indicator (Transaction Table)
**Location:** `/src/components/CommissionWallet.tsx`
```tsx
<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
  t.status === 'completed' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-yellow-100 text-yellow-800'
}`}>
  {t.status}
</span>
```

#### AI Recommended Badge (Marketplace)
**Location:** `/src/pages/Marketplace.tsx`
```tsx
<div className="ring-2 ring-yellow-400 ring-offset-2 rounded-xl">
  <div className="bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-t-lg">
    <Sparkles className="w-3 h-3" /> AI Recommended
  </div>
</div>
```

### 5. Progress Indicators

#### Animated Progress Bar
**Used in:** HeroCard (Founder Club), TopProducts
**Location:** `/src/components/Dashboard/HeroCard.tsx`
```tsx
<motion.div 
  initial={{ width: 0 }}
  animate={{ width: `${progressPercent}%` }}
  transition={{ duration: 1.5, ease: "easeOut" }}
  className="h-full bg-brand-accent"
>
  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
</motion.div>
```

#### Chart Progress (Recharts)
**Used in:** Revenue chart
**Location:** `/src/components/Dashboard/RevenueChart.tsx`
```tsx
<Area 
  type="monotone" 
  dataKey="value" 
  stroke="#00575A" 
  strokeWidth={3}
  fill="url(#colorRevenue)"
  animationDuration={1500}
/>
```

---

## Responsive Design Patterns

### Dashboard Layout
```tsx
// App.tsx - DashboardLayout
<div className="flex min-h-screen bg-[#F3F4F6]">
  {/* Desktop Sidebar - Hidden on md */}
  <div className="hidden md:block w-72 flex-shrink-0">
    <Sidebar />
  </div>

  {/* Mobile Header - Only on md */}
  <div className="md:hidden fixed top-0 w-full bg-white z-40 px-4 py-3">
    {/* Mobile menu */}
  </div>

  {/* Main Content - Takes flex-1 */}
  <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-0">
    <Outlet />
  </main>
</div>
```

### Grid Layouts

#### Dashboard Grid
**File:** `/src/pages/Dashboard.tsx`
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <HeroCard user={user} />         {/* col-span-3 */}
  <StatsGrid user={user} />         {/* Renders 3 cards */}
  <RevenueChart data={revenueData} /> {/* col-span-2 */}
  <TopProducts products={products} /> {/* col-span-1 */}
</div>
```

**Issue:** HeroCard uses `col-span-3` but md layout only has 2 columns

#### Product Grid (Marketplace)
**File:** `/src/pages/Marketplace.tsx`
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

#### Wallet Grid
**File:** `/src/components/CommissionWallet.tsx`
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Balance Card: lg:col-span-2 */}
  {/* Tax Info Card: col-span-1 */}
</div>
```

**Issue:** Assumes 3-column grid, breaks on md (2 columns)

---

## Animation Patterns

### Fade & Slide Animations
**Used in:** Dashboard cards, Marketplace products
**Library:** Framer Motion
```tsx
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: idx * 0.05 }}
>
```

### Staggered Animations
**Used in:** OnboardingQuest items
**File:** `/src/components/OnboardingQuest.tsx`
```tsx
{quests.map((quest, idx) => (
  <motion.div 
    initial={{ x: -10, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: idx * 0.1 }}
  >
    {/* Quest item */}
  </motion.div>
))}
```

### Progress Animation
**Used in:** HeroCard progress bar
```tsx
<motion.div 
  animate={{ width: `${progressPercent}%` }}
  transition={{ duration: 1.5, ease: "easeOut" }}
/>
```

### Spinning Loading State
**Used in:** Sidebar AI Advice, ProductCard Buy button
```tsx
<Loader2 className="w-4 h-4 animate-spin" />
<Sparkles className="w-3 h-3 animate-spin" />
```

### Presence Animation
**Used in:** Sidebar advice, Marketplace recommendations
**Library:** Framer Motion AnimatePresence
```tsx
<AnimatePresence mode='wait'>
  {advice ? (
    <motion.div key="advice" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {advice}
    </motion.div>
  ) : (
    <motion.p key="placeholder">Placeholder text</motion.p>
  )}
</AnimatePresence>
```

### Bounce Animation
**Used in:** LandingPage floating elements
```tsx
<div className="animate-bounce" style={{ animationDuration: '3s' }}>
  {/* Floating notification */}
</div>
```

---

## Typography & Text Patterns

### Heading Hierarchy
```tsx
// Large Hero Heading (LandingPage)
<h1 className="text-5xl lg:text-7xl font-extrabold">
  Kinh Doanh Sức Khỏe
</h1>

// Page Heading (Dashboard)
<h2 className="text-2xl font-bold text-brand-dark">Dashboard</h2>

// Section Heading (Cards)
<h3 className="font-bold text-lg text-brand-dark">Revenue Growth</h3>

// Label Text
<p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">
  Personal Sales
</p>

// Body Text
<p className="text-gray-600 text-sm leading-relaxed">{description}</p>

// Micro Copy
<span className="text-xs text-gray-500">Earn {formatVND(commission)}</span>
```

### Typography Classes Used
```
Size:     text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-5xl, text-7xl
Weight:   font-normal, font-medium, font-semibold, font-bold, font-extrabold
Tracking: tracking-tight, tracking-wider, tracking-widest
Leading:  leading-relaxed, leading-tight, leading-snug
Color:    text-brand-dark, text-gray-* (various shades)
Style:    italic, line-through (for completed items)
```

---

## Accessibility Implementation Status

### Implemented Features
```
✓ Semantic HTML tags (<aside>, <nav>, <main>, <button>, <table>)
✓ Image alt attributes
✓ Icon + text labels on buttons
✓ Color + text for status (not color alone)
✓ Hover states on interactive elements
✓ Responsive design (mobile-first)
```

### Missing Accessibility Features
```
✗ aria-label on icon-only buttons
✗ aria-current="page" on active nav items
✗ aria-describedby for form inputs
✗ <label> elements for form inputs
✗ table scope attributes (scope="col")
✗ Focus trap in modal overlays
✗ Keyboard-only navigation support
✗ prefers-reduced-motion support
✗ Skip-to-main-content link
```

### Accessibility Issues by Component

**Sidebar.tsx Issues:**
- Icon-only logout button: Missing `aria-label="Sign Out"`
- Active nav items: Missing `aria-current="page"`
- AI Coach widget: No focus trap when sidebar opens

**ProductCard.tsx Issues:**
- Share button: Missing `aria-label`
- Image: Has `alt` (good)
- Stock status: Conveyed by color and text (good)

**CommissionWallet.tsx Issues:**
- Table headers: Missing `<th scope="col">`
- Info icon: Tooltip not implemented, should have `aria-describedby`
- Export button: Missing `aria-label` for clarity

**Marketplace.tsx Issues:**
- Search input: Missing associated `<label>`
- Search input: Missing `aria-label`
- AI Recommendations: Text is adequate (good)

---

## Key File Dependencies

### App.tsx
- Imports: Router, Sidebar, Dashboard, Marketplace, ProductDetail, CommissionWallet, LandingPage
- State: `useStore()` for authentication
- Routes: 7 routes total (landing, dashboard + nested, fallbacks)

### Sidebar.tsx
- State: `useStore()` for user, quests, logout
- Services: `getCoachAdvice()` from geminiService
- External: Lucide icons, Framer Motion

### ProductCard.tsx
- Props: `Product` interface
- State: Local `isBuying`, `showSuccess`
- External: lucide-react, framer-motion

### CommissionWallet.tsx
- State: `useStore()` for transactions
- Utils: `calculatePIT()` for tax
- External: Recharts (not used here), Framer Motion

### RevenueChart.tsx
- External: recharts (AreaChart, Area, XAxis, YAxis, etc.)
- Props: `ChartDataPoint[]`
- Styling: Custom Recharts tooltip styling

---

## Component Composition Map

```
DashboardLayout
├── Sidebar
│   ├── Brand Logo
│   ├── Navigation Links
│   ├── AI Coach Widget
│   │   └── OnboardingQuest (similar structure)
│   └── User Profile
├── Mobile Header
│   └── Menu Icon → Sidebar Overlay
└── Main Content (Outlet)
    ├── Dashboard
    │   ├── HeroCard
    │   ├── StatsGrid (3x cards)
    │   ├── RevenueChart
    │   └── TopProducts
    ├── Marketplace
    │   ├── Search Input
    │   ├── AI Opportunity Radar
    │   └── ProductCard Grid
    │       └── ProductCard (with AI badge)
    ├── ProductDetail
    │   ├── Breadcrumb
    │   ├── Product Image
    │   ├── Product Info
    │   ├── Price Card
    │   ├── Action Buttons
    │   └── Tabs (Benefits, Ingredients, Usage)
    └── CommissionWallet
        ├── Balance Card
        ├── Tax Info Card
        ├── Withdrawal Button
        └── Transaction Table

LandingPage (Standalone)
├── Navbar
├── Hero Section
├── Features Section
├── CTA Section
└── Footer
```

---

## Color Usage by Component

### Brand Primary (#00575A) Used In:
- Sidebar background
- Navigation buttons (active state)
- Main headings
- Chart strokes
- Icon accents
- Brand logo background
- Card icons backgrounds

### Brand Accent (#FFBF00) Used In:
- Primary CTA buttons
- Badge backgrounds
- Icon highlights
- Progress bar fills
- Text highlights
- AI Coach elements
- Success state indicators

### Brand BG (#F3F4F6) Used In:
- Page background
- Card backgrounds (alternative)
- Empty state backgrounds
- Subtle section backgrounds

### Gray Shades Used For:
- Text hierarchy (gray-900 > gray-600 > gray-500 > gray-400)
- Borders (gray-200, gray-100)
- Backgrounds (gray-50)
- Hover states

---

## Performance Notes

### Animations That May Impact Performance:
- Sidebar overlay with backdrop-blur
- Multiple Framer Motion animations on Dashboard
- Progress bar animations (1.5s duration)
- Scrollable table without virtualization

### Optimization Opportunities:
- Lazy load ProductDetail tabs content
- Memoize ProductCard component
- Use CSS animations instead of JS for simple states
- Implement image lazy loading with `loading="lazy"`
- Split large Dashboard into separate components with React.memo

