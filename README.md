
# WellNexus MVP (Seed Stage)

A Hybrid Community Commerce platform for Vietnam, featuring AI coaching and automated tax compliance.

## ✨ Features

- 🛍️ **Social Commerce** - MLM/Affiliate marketplace with commission tracking
- 🤖 **AI Coach** - Personalized advice powered by Google Gemini
- 💰 **Smart Wallet** - Automatic tax compliance (Vietnam PIT 10%)
- 📊 **Dashboard** - Real-time analytics and team volume tracking
- 🎯 **Gamification** - Quest system and rank progression
- ♿ **Accessible** - WCAG AA compliant with screen reader support
- 📱 **Responsive** - Optimized for desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup (Optional)
For AI Coach feature, create `.env` file:
```bash
cp .env.example .env
# Edit .env and add your Gemini API key from https://ai.google.dev/
```

### 3. Run Local Development
```bash
npm run dev
```
Access the app at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
npm run preview
```

## 📦 Single File Deployment
For a zero-config, portable version, check `src/SingleFileApp.tsx`. 
You can copy this single file into any React project with `lucide-react` and `recharts` installed to run the entire app logic without the folder structure.

## 🛠 Deployment (Firebase)

This project is configured for Firebase Hosting.

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- A Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)

### Steps
1. **Login to Firebase:**
   ```bash
   firebase login
   ```

2. **Initialize Project:**
   ```bash
   firebase init hosting
   ```
   - Select "Use an existing project".
   - **Public directory:** `dist` (Important for Vite).
   - **Configure as a single-page app:** `Yes`.

3. **Build & Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

## 📂 Project Structure

```
src/
├── components/
│   ├── ui/                      # Reusable component library
│   │   ├── Modal.tsx            # Accessible modal with focus trap
│   │   ├── Button.tsx           # Multi-variant button component
│   │   └── Input.tsx            # Form input with validation
│   ├── Dashboard/               # Dashboard-specific components
│   │   ├── HeroCard.tsx         # Founder Club progress card
│   │   ├── StatsGrid.tsx        # Stats cards (sales, team, payout)
│   │   ├── RevenueChart.tsx     # Revenue visualization
│   │   └── TopProducts.tsx      # Best sellers list
│   ├── WithdrawalModal.tsx      # Withdrawal request form
│   ├── CommissionWallet.tsx     # Wallet & transaction history
│   ├── ProductCard.tsx          # Product display card
│   └── Sidebar.tsx              # Main navigation
├── pages/                       # Route pages
│   ├── Dashboard.tsx
│   ├── Marketplace.tsx
│   ├── ProductDetail.tsx
│   └── LandingPage.tsx
├── services/
│   └── geminiService.ts         # Google Gemini AI integration
├── utils/
│   ├── format.ts                # Currency & number formatting
│   └── tax.ts                   # Vietnam tax calculations
├── data/
│   └── mockData.ts              # Demo data for Seed Stage
└── store.ts                     # Zustand state management
```

## 🎨 Design System

**Comprehensive design system documentation available!**

- **Primary:** Deep Teal (`#00575A`)
- **Accent:** Marigold (`#FFBF00`)
- **Font:** Inter
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React

📖 **Documentation:**
- [**DESIGN_SYSTEM.md**](./DESIGN_SYSTEM.md) - Complete design system overview
- [Component Reference](./docs/design-system/components-reference.md) - Component API docs
- [Color System](./docs/design-system/color-system.md) - Color usage guidelines
- [Implementation Guide](./docs/design-system/implementation-guide.md) - Developer setup

**Key Features:**
- ✅ WCAG AA accessibility standards
- ✅ Responsive design (mobile-first)
- ✅ TypeScript component library
- ✅ Tailwind CSS configuration
- ✅ Reusable UI components

## 🆕 Recent Updates

### v1.0.0-seed (Latest)
- ✅ **Component Library** - Reusable Modal, Button, Input components
- ✅ **Withdrawal Flow** - Complete withdrawal request modal with validation
- ✅ **Responsive Fixes** - Fixed tablet/mobile layout issues
- ✅ **Accessibility** - WCAG AA compliance (85%+)
  - Focus trap in modals
  - Keyboard navigation (Escape, Tab, Enter)
  - ARIA labels on all interactive elements
  - Screen reader support
- ✅ **Share Features** - Clipboard API for copy/share functionality
- ✅ **CSV Export** - Download transaction history
- ✅ **Google Gemini AI** - Fixed API integration (v0.21.0)
- ✅ **Claude Kit** - Enhanced development workflow tools

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** TailwindCSS 3
- **Routing:** React Router v6
- **State:** Zustand
- **Animations:** Framer Motion
- **AI:** Google Generative AI
- **Dev Tools:** Claude Kit (commands, hooks, agents)

## 📝 Development

### Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier (via Claude Kit)
- ✅ Accessibility-first approach
- ✅ Component reusability
- ⚠️ Test coverage: 0% (TODO)

### Environment Variables
```bash
# .env
VITE_GEMINI_API_KEY=your_key_here  # Optional - for AI Coach
```

### Known Issues
- 2 moderate npm vulnerabilities (non-critical)
- AI Coach requires API key (falls back to static messages)
- Mock authentication (no real user login yet)

## 🤝 Contributing

This is a Seed Stage MVP. Contributions welcome for:
- Unit tests (Vitest + Testing Library)
- E2E tests (Playwright)
- Backend integration (Firebase/Supabase)
- Mobile app (React Native)
- Dark mode
- Internationalization (vi/en)
