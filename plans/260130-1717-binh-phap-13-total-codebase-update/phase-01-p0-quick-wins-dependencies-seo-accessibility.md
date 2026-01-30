---
phase: 1
title: "P0 Quick Wins: Dependencies, SEO, Accessibility"
priority: P0
effort: 1 day
status: completed
---

# Phase 01: P0 Quick Wins - Dependencies, SEO, Accessibility

**Goal**: Fix critical production blockers that prevent go-live

**Scope**:
1. Upgrade outdated core dependencies (React 19, Vite 7, TypeScript 5.7)
2. Add complete SEO meta tags (OpenGraph, Twitter, robots.txt, sitemap)
3. Fix accessibility violations (ARIA roles, keyboard navigation)

---

## Context Links

- **Codebase Scan Report**: `/Users/macbookprom1/Well/plans/reports/explorer-260130-1717-codebase-scan.md`
- **Current package.json**: `/Users/macbookprom1/Well/package.json`
- **Design Guidelines**: `/Users/macbookprom1/Well/docs/design-guidelines.md`

---

## Key Insights

**From Explorer Scan:**
- React 18.3.1 → 19.2.x available (performance improvements)
- Vite partially updated but plugin outdated (@vitejs/plugin-react: 4.7.0 → 5.1.2)
- TypeScript 5.4.0 → 5.7+ (better type inference)
- **Zero SEO meta tags** in index.html (critical for social commerce visibility)
- **Interactive divs** in ProductCard lack ARIA roles (fails WCAG 2.1 AA)

**Critical Path:**
1. Dependencies first (foundation for everything)
2. SEO second (no code changes, pure metadata)
3. Accessibility third (UI refactoring with tests)

---

## Requirements

### Functional Requirements

**FR1-1: Dependency Upgrades**
- Upgrade React to 19.2.x with backward compatibility
- Upgrade Vite to 7.x and related plugins
- Upgrade TypeScript to 5.7.x
- Update all testing libraries (vitest, testing-library)
- Ensure zero breaking changes to existing functionality

**FR1-2: SEO Implementation**
- Add meta description to index.html
- Add OpenGraph tags (og:title, og:description, og:image, og:url)
- Add Twitter card tags
- Create robots.txt allowing all crawlers
- Generate sitemap.xml with priority pages
- Add JSON-LD structured data for Organization

**FR1-3: Accessibility Fixes**
- Replace interactive `<div>` with `<button>` or add ARIA roles
- Add keyboard navigation (Enter/Space) to all clickable elements
- Ensure all images have meaningful alt text
- Add focus indicators for keyboard users
- Test with screen reader (VoiceOver/NVDA)

### Non-Functional Requirements

**NFR1-1: Performance**
- Build time must stay under 10s
- No bundle size increase > 5%
- React 19 concurrent features enabled

**NFR1-2: Quality**
- All 230+ existing tests pass
- TypeScript compilation: 0 errors
- ESLint violations: no new issues

**NFR1-3: Compatibility**
- Maintain Node 18+ support
- Browser support: Chrome/Firefox/Safari latest 2 versions

---

## Architecture

### Dependency Upgrade Strategy

```
Current State:
├── React 18.3.1 (legacy concurrent mode)
├── Vite 7.3.1 (core OK, plugins outdated)
└── TypeScript 5.4.0

Target State:
├── React 19.2.x (new concurrent features)
├── Vite 7.x + updated plugins
└── TypeScript 5.7.x (improved inference)

Migration Path:
1. Update React 19 + react-dom
2. Update @vitejs/plugin-react to 5.x
3. Update TypeScript to 5.7.x
4. Update testing libraries (vitest, testing-library)
5. Run tests + type check
6. Fix breaking changes (if any)
```

### SEO Meta Tags Structure

```html
<!-- index.html additions -->
<head>
  <!-- Basic Meta -->
  <meta name="description" content="WellNexus 2.0: Agentic HealthFi OS - Hybrid Community Commerce platform for Vietnam" />

  <!-- OpenGraph (Facebook, LinkedIn) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://wellnexus.vn/" />
  <meta property="og:title" content="WellNexus 2.0: Agentic HealthFi OS" />
  <meta property="og:description" content="Hybrid Community Commerce platform powered by 24+ AI agents" />
  <meta property="og:image" content="https://wellnexus.vn/og-image.png" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="WellNexus 2.0: Agentic HealthFi OS" />
  <meta name="twitter:description" content="Hybrid Community Commerce platform powered by 24+ AI agents" />
  <meta name="twitter:image" content="https://wellnexus.vn/og-image.png" />

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "WellNexus",
    "url": "https://wellnexus.vn",
    "logo": "https://wellnexus.vn/logo.png"
  }
  </script>
</head>
```

### Accessibility Pattern

```tsx
// BEFORE (ProductCard.tsx)
<div onClick={handleClick} className="card">
  Click me
</div>

// AFTER
<button
  type="button"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="card"
  aria-label="Purchase product"
>
  Click me
</button>

// OR (if must use div)
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="card"
  aria-label="Purchase product"
>
  Click me
</div>
```

---

## Related Code Files

### Files to Modify

**Dependencies:**
- `/Users/macbookprom1/Well/package.json` - Update all dependencies
- `/Users/macbookprom1/Well/tsconfig.json` - Update TypeScript config if needed

**SEO:**
- `/Users/macbookprom1/Well/index.html` - Add meta tags
- `/Users/macbookprom1/Well/public/robots.txt` - Create
- `/Users/macbookprom1/Well/public/sitemap.xml` - Create

**Accessibility:**
- `/Users/macbookprom1/Well/src/components/ProductCard.tsx` - Fix interactive divs
- `/Users/macbookprom1/Well/src/components/ui/card.tsx` - Add ARIA support
- `/Users/macbookprom1/Well/src/pages/LandingPage.tsx` - Fix clickable elements

### Files to Create

- `/Users/macbookprom1/Well/public/robots.txt`
- `/Users/macbookprom1/Well/public/sitemap.xml`
- `/Users/macbookprom1/Well/public/og-image.png` (generate with ai-multimodal)

---

## Implementation Steps

### Step 1: Dependency Upgrades (30 min)

1. **Backup current state**
   ```bash
   git checkout -b binh-phap-13-updates
   cp package.json package.json.backup
   ```

2. **Update React ecosystem**
   ```bash
   npm install react@19 react-dom@19
   npm install -D @types/react@19 @types/react-dom@19
   ```

3. **Update Vite and plugins**
   ```bash
   npm install -D vite@latest @vitejs/plugin-react@latest
   ```

4. **Update TypeScript**
   ```bash
   npm install -D typescript@latest
   ```

5. **Update testing libraries**
   ```bash
   npm install -D vitest@latest @vitest/ui@latest
   npm install -D @testing-library/react@latest @testing-library/user-event@latest
   ```

6. **Verify installation**
   ```bash
   npm install
   tsc --noEmit
   npm run build
   npm run test:run
   ```

### Step 2: SEO Implementation (20 min)

1. **Update index.html with meta tags**
   - Add meta description
   - Add OpenGraph tags
   - Add Twitter card tags
   - Add JSON-LD structured data

2. **Create robots.txt**
   ```txt
   User-agent: *
   Allow: /
   Sitemap: https://wellnexus.vn/sitemap.xml
   ```

3. **Generate sitemap.xml**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://wellnexus.vn/</loc>
       <priority>1.0</priority>
       <changefreq>daily</changefreq>
     </url>
     <url>
       <loc>https://wellnexus.vn/marketplace</loc>
       <priority>0.8</priority>
       <changefreq>daily</changefreq>
     </url>
   </urlset>
   ```

4. **Generate OG image** (using ai-multimodal skill)
   - Prompt: "Create OpenGraph image 1200x630px for WellNexus HealthFi platform, dark gradient background, logo, tagline"
   - Save to `/public/og-image.png`

### Step 3: Accessibility Fixes (40 min)

1. **Fix ProductCard.tsx**
   - Replace interactive divs with buttons
   - Add keyboard event handlers
   - Add ARIA labels
   - Test keyboard navigation

2. **Fix ui/card.tsx**
   - Add optional `role` prop
   - Add `tabIndex` support
   - Ensure focus styles visible

3. **Fix LandingPage.tsx**
   - Audit all clickable elements
   - Add ARIA roles where needed
   - Test with VoiceOver (Mac) or NVDA (Windows)

4. **Manual testing checklist**
   - [ ] All buttons accessible via Tab key
   - [ ] Enter/Space activate buttons
   - [ ] Focus indicators visible
   - [ ] Screen reader announces elements correctly

---

## Todo List

### Dependencies
- [x] Create git branch `binh-phap-13-updates`
- [x] Backup package.json
- [x] Update React to 19.x
- [x] Update Vite to latest
- [x] Update TypeScript to 5.7.x
- [x] Update testing libraries
- [x] Run `npm install`
- [x] Verify `tsc --noEmit` (0 errors)
- [x] Verify `npm run build` (passes)
- [x] Verify `npm run test:run` (all pass)

### SEO
- [x] Add meta description to index.html
- [x] Add OpenGraph tags
- [x] Add Twitter card tags
- [x] Add JSON-LD structured data
- [x] Create robots.txt
- [x] Create sitemap.xml
- [x] Generate og-image.png (ai-multimodal)
- [x] Test social media previews (Facebook, Twitter)

### Accessibility
- [x] Audit ProductCard.tsx for interactive divs
- [x] Replace divs with buttons or add ARIA
- [x] Add keyboard event handlers
- [x] Update ui/card.tsx with ARIA support
- [x] Audit LandingPage.tsx clickable elements
- [x] Test keyboard navigation (Tab, Enter, Space)
- [x] Test with screen reader (VoiceOver/NVDA)
- [x] Document accessibility patterns in code

---

## Success Criteria

**Definition of Done:**
- ✅ All dependencies at latest stable versions
- ✅ `npm install` completes without warnings
- ✅ `tsc --noEmit` produces 0 errors
- ✅ `npm run build` passes in < 10s
- ✅ All 230+ tests pass
- ✅ SEO meta tags complete (validated with Facebook Debugger)
- ✅ Accessibility: WCAG 2.1 AA compliance (keyboard navigation works)
- ✅ No bundle size increase > 5%

**Validation Methods:**
1. Run full test suite
2. Manual QA on critical flows (login, purchase, navigation)
3. Test SEO with Facebook Sharing Debugger
4. Test a11y with Lighthouse audit (score > 90)

---

## Risk Assessment

**Potential Issues:**

1. **React 19 Breaking Changes**
   - Risk: API changes in concurrent mode
   - Mitigation: Review migration guide, test thoroughly
   - Rollback: Revert to package.json.backup

2. **Bundle Size Increase**
   - Risk: React 19 may increase bundle
   - Mitigation: Check bundle analyzer, use code splitting
   - Acceptance: < 5% increase

3. **Accessibility Refactoring**
   - Risk: Changing HTML structure may break CSS
   - Mitigation: Preserve className, test visually
   - Rollback: Git commit per file

---

## Security Considerations

**Dependency Updates:**
- Review npm audit output for vulnerabilities
- Check for CVEs in React 19, Vite 7
- Verify all packages from official npm registry

**SEO Implementation:**
- Validate robots.txt doesn't expose sensitive routes
- Ensure sitemap.xml only lists public pages
- No sensitive data in meta tags

---

## Next Steps

After Phase 1 completion:
1. Commit changes with conventional commit message
2. Run full regression test suite
3. Deploy to staging for manual QA
4. Proceed to Phase 2: Code Cleanup & Linting
