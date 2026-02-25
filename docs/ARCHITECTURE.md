# WellNexus Architecture Overview

## System Architecture

WellNexus is built as a modern, scalable web application using a component-based architecture.

### Technology Stack

**Frontend:**
- React 19.2.4 with TypeScript 5.9.3 (Strict Mode)
- Vite 7.3.1 for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Zustand for state management (6 slices pattern)
- i18next for internationalization (Vietnamese + English)

**Backend Services:**
- Supabase (PRIMARY) -- Auth, PostgreSQL Database, Edge Functions, Realtime
- Google Gemini AI for coaching features (via Edge Function)
- PayOS for payment processing (via Edge Function)
- Resend for transactional emails (via Edge Function)

**Testing:**
- Vitest 4.x for unit and integration tests
- Testing Library for component tests
- 307+ tests across 30 files with 100% pass rate

### Project Structure

```
Well/
├── src/
│   ├── agents/           # Agent-OS framework and business agents
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI component library
│   │   ├── Dashboard/   # Dashboard-specific components
│   │   ├── Referral/    # Referral system components
│   │   └── ...
│   ├── pages/           # Route-level page components
│   ├── services/        # External service integrations (Supabase, PayOS, Gemini)
│   ├── hooks/           # Custom React hooks (useAuth, useWallet, useAgentOS)
│   ├── utils/           # Utility functions (commission, tokenomics, format)
│   ├── store/           # Zustand store (6 slices: auth, wallet, team, agent, ui, cart)
│   ├── locales/         # i18n translations (vi.ts, en.ts)
│   ├── styles/          # Global styles and design tokens
│   └── types.ts         # TypeScript type definitions
├── public/              # Static assets
├── docs/                # Project documentation
├── plans/               # Development plans and reports
└── dist/                # Production build output
```

### Key Components

#### 1. Agent-OS Framework

A modular agent system for business automation:
- Coach Agent: AI-powered business coaching
- Sales Copilot: Objection handling and sales assistance
- Reward Engine: Automated commission calculations
- Project Manager: Task and workflow automation

#### 2. State Management

**Zustand Store** (`src/store/`):
- Single source of truth for application state
- User authentication state
- Product catalog
- Transaction history
- Team metrics
- Referral data

#### 3. Routing Architecture

**React Router v6** with protected routes:
```
/ (Landing Page)
/dashboard (Main Dashboard - Protected)
  ├── /marketplace
  ├── /wallet
  ├── /team
  ├── /referral
  └── /admin
```

#### 4. Service Layer

Abstraction layer for external services:
- `geminiService.ts` - Google Gemini AI integration (via Edge Function)
- `supabase.ts` - Supabase client configuration
- `payos-client.ts` - PayOS payment integration
- `referral-service.ts` - Referral tree and downline management
- `email-service-client-side-trigger.ts` - Email triggers via Edge Function
- `copilotService.ts` - Sales assistant logic

### Data Flow

```
User Action
    ↓
React Component
    ↓
Custom Hook (optional)
    ↓
Zustand Store / Service Layer
    ↓
External API (Supabase Auth/DB/Edge Functions / Gemini)
    ↓
State Update
    ↓
Component Re-render
```

### Build & Deployment

**Build Process:**
1. TypeScript compilation (`tsc`)
2. Vite bundling and optimization
3. Code splitting for vendors
4. Gzip compression
5. Asset hashing for cache busting

**Production Build:**
```bash
npm run build
# Output: dist/ directory (~350 KB gzipped)
```

**Deployment:**
- Platform: Vercel
- Auto-deploy: On push to main branch
- CI/CD: GitHub Actions (build + test + security audit)
- Build time: ~3.2 seconds
- Production URL: https://wellnexus.vn/

### Performance Optimizations

1. **Code Splitting:**
   - React vendor chunk (86.72 KB)
   - Supabase vendor chunk (44.35 KB)
   - Motion vendor chunk (40.64 KB)
   - Page-level code splitting

2. **Bundle Optimization:**
   - Tree shaking
   - Minification
   - Gzip compression
   - Asset optimization

3. **Runtime Performance:**
   - Lazy loading for routes
   - Memoization for expensive components
   - Zustand selectors for optimal re-renders

### Security

- Environment variables for sensitive data (server-side secrets via Supabase)
- HTTPS enforced
- Supabase Row Level Security (RLS) on all tables
- HMAC-SHA256 webhook verification (PayOS)
- Input validation (zod, DOMPurify)
- XSS protection (React built-in + DOMPurify)
- SQL injection protection (Supabase parameterized queries)
- CSP and HSTS headers via Vercel config
- Secure in-memory token storage (no localStorage for sensitive tokens)

### Testing Strategy

**Unit Tests:**
- Utility functions (format, tax, tokenomics)
- Business logic (commission, wallet, dashboard)
- Test coverage: Format, Tax, Tokenomics, Commission, Wallet

**Component Tests:**
- UI components (Button, Input, Modal)
- Interaction testing
- Accessibility verification

**Integration Tests:**
- User flow testing
- Admin logic
- Dashboard pages
- Affiliate system
- Multi-user scenarios

### Scalability Considerations

**Current State:**
- Supabase PostgreSQL database with RLS
- Supabase Edge Functions for serverless API
- 8 Edge Functions deployed (payment, email, AI, commission)
- Suitable for growing user base

**Future Growth:**
- Replace mock data with API calls
- Implement caching layer
- Add CDN for static assets
- Consider microservices architecture
- Database optimization

### Development Workflow

1. **Local Development:**
   ```bash
   npm run dev  # Start dev server on :5173
   ```

2. **Testing:**
   ```bash
   npm test           # Watch mode
   npm run test:run   # Run once
   ```

3. **Building:**
   ```bash
   npm run build      # Production build
   npm run preview    # Preview build locally
   ```

4. **Deployment:**
   - Push to main → Auto-deploy to Vercel

### Monitoring & Maintenance

- Sentry for error tracking (optional)
- Vercel Analytics for performance (Core Web Vitals)
- GitHub Actions CI/CD pipeline
- Build status badges on README

### Technical Debt & Future Improvements

**Completed:**
- ✅ Phase 2 architecture refactoring (1,169 lines reduced)
- ✅ Component extraction (14 reusable components)
- ✅ TypeScript strict mode
- ✅ Comprehensive test coverage

**Planned (Optional):**
- ESLint configuration
- E2E testing with Playwright
- Storybook for component documentation
- API layer implementation
- Performance monitoring

---

For detailed implementation guides, see:
- `README.md` - Getting started
- `CONTRIBUTING.md` - Development guidelines
- `CHANGELOG.md` - Version history
