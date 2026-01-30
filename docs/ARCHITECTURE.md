# WellNexus Architecture Overview

## System Architecture

WellNexus is built as a modern, scalable web application using a component-based architecture.

### Technology Stack

**Frontend:**
- React 18.2 with TypeScript
- Vite 5.1 for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Zustand for state management

**Backend Services:**
- Firebase for authentication and database
- Supabase for data management
- Google Gemini AI for coaching features

**Testing:**
- Vitest for unit and integration tests
- Testing Library for component tests
- 224+ tests with 100% pass rate

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
│   ├── services/        # External service integrations
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── data/            # Mock data (MVP phase)
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

**Zustand Store** (`src/store.ts`):
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
- `geminiService.ts` - Google Gemini AI integration
- `firebase.ts` - Firebase configuration
- `api.ts` - API abstraction layer
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
External API (Firebase/Gemini/Supabase)
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
- Build time: ~12-15 seconds
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

- Environment variables for sensitive data
- HTTPS enforced
- Firebase security rules
- Input validation
- XSS protection (React built-in)
- SQL injection protection (Supabase parameterized queries)

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

**Current State (MVP):**
- Mock data in `src/data/mockData.ts`
- Firebase for backend
- Suitable for initial user base

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

- Vercel analytics for performance
- Error tracking via browser console
- Build status via GitHub Actions (future)
- User feedback collection

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
