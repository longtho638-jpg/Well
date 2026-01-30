# Changelog

All notable changes to WellNexus are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-01-30

### Added
- Professional documentation (CONTRIBUTING.md, LICENSE, ARCHITECTURE.md)
- Comprehensive test coverage (224 tests, 100% passing)
- Production deployment automation via Vercel

### Changed
- Architecture refactoring: 1,169 lines reduced (38.3% code reduction)
- Extracted 14 reusable components for better maintainability
- Improved bundle optimization (~350 KB gzipped)

### Fixed
- Build time optimization (12-15s)
- Type safety improvements (0 TypeScript errors)

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
