# Changelog

All notable changes to WellNexus are documented in this file.

## [2.1.0] - 2026-01-09

### 🚀 WOW Session - 13 Phases Complete

#### Performance
- **Bundle Optimization**: Main chunk 1.72MB → 201KB (-88%)
- **Code Splitting**: 16 pages lazy loaded via React.lazy()
- **Build Time**: 3.4s stable

#### Features
- **PWA Support**: manifest.json, installable on mobile/desktop
- **Dark/Light Theme**: Animated toggle with localStorage persistence
- **Skeleton Loading**: Reusable components for loading states
- **Keyboard Shortcuts**: useKeyboardShortcuts hook with modifier keys

#### Security
- **Vulnerabilities**: 5 → 2 (moderate only)
- **Best Practices**: Lighthouse 100/100
- **Error Boundary**: Full UI with analytics tracking

#### Testing
- **Unit Tests**: 196 → 230 (+34 tests)
- **All tests passing**: 230/230 ✅

### Files Changed
- `vite.config.ts` - Chunk splitting
- `src/App.tsx` - Lazy loading
- `public/manifest.json` - PWA
- `src/components/ui/ThemeToggle.tsx` - NEW
- `src/components/ui/Skeleton.tsx` - NEW
- `src/hooks/useKeyboardShortcuts.ts` - NEW
- `README.md` - Updated stats

---

## [2.0.0] - 2026-01-08

### Initial Release
- Agent-OS with 24+ AI agents
- AgencyOS Integration (85+ commands)
- Social Commerce platform
- HealthFi Wallet (SHOP + GROW tokens)
- Supabase backend
