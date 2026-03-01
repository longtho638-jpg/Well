# Phase 4: Design Token Theme System

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 3](./phase-03-three-tier-storage.md) for preference persistence
- Inspired by: NiceGUI's CSS variable theming + runtime dark mode toggle

## Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Implementation:** pending
- **Review:** pending

Formalize Aura Elite design system as CSS variable tokens. Runtime theme switching without page reload. Token documentation for consistency.

## Key Insights

NiceGUI uses CSS variables for ALL theme values. Theme switch = variable override. Dark mode = one function call. Every component reads from variables, never hardcodes colors.

**Applied to Well:** Aura Elite glassmorphism colors/gradients currently scattered in Tailwind classes. Extract to CSS variables. Enable dark/light mode toggle. Single source of truth for design.

## Requirements
- All Aura Elite colors/gradients as CSS custom properties
- Runtime theme switching (dark ↔ light) via variable swap
- Theme preference persisted in localStorage (Phase 3)
- All components read from tokens, no hardcoded colors

## Architecture

```css
/* src/styles/tokens.css */
:root {
  /* Aura Elite — Dark Theme (default) */
  --aura-bg-primary: #0a0a0f;
  --aura-bg-secondary: #12121a;
  --aura-bg-glass: rgba(255, 255, 255, 0.05);
  --aura-border-glass: rgba(255, 255, 255, 0.1);
  --aura-text-primary: #ffffff;
  --aura-text-secondary: #a0a0b0;
  --aura-accent-primary: #6366f1;
  --aura-accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
  --aura-shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
  --aura-radius-card: 16px;
  --aura-blur-glass: 12px;
}

[data-theme="light"] {
  --aura-bg-primary: #f8f9fa;
  --aura-bg-secondary: #ffffff;
  --aura-bg-glass: rgba(0, 0, 0, 0.03);
  --aura-text-primary: #1a1a2e;
  /* ... */
}
```

## Implementation Steps
1. Audit current Aura Elite color usage across all components
2. Create `src/styles/tokens.css` with CSS custom properties
3. Define light theme variant with `[data-theme="light"]`
4. Create `useTheme()` hook — toggle + persist to localStorage
5. Refactor components to use `var(--aura-*)` instead of hardcoded colors
6. Add Tailwind config integration (map tokens to Tailwind utilities)
7. Add theme toggle to Settings page
8. Test both themes across all pages

## Todo
- [ ] Audit current color usage
- [ ] Create tokens.css with CSS variables
- [ ] Define light theme variant
- [ ] Create useTheme() hook with localStorage persistence
- [ ] Refactor components to use tokens
- [ ] Tailwind config integration
- [ ] Theme toggle in Settings
- [ ] Visual testing both themes

## Success Criteria
- `grep -r "bg-\[#" src/` = 0 (no hardcoded hex colors)
- Theme toggle works without page reload
- Theme preference persists across sessions
- Both themes pass visual review (no broken contrast/readability)

## Risk Assessment
- **Medium:** Large CSS refactor — many files touched. Do page-by-page.
- **Low:** Light theme may look off initially — iterate with design review

## Security Considerations
- No security impact — pure CSS/UI change

## Next Steps
- Phase 5 event pipeline completes the NiceGUI learning series
