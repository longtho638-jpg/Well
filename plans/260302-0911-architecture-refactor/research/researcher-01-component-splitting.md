# React Architecture Refactoring Research
## Component Splitting + Monorepo + File Size Enforcement

**Date:** 2026-03-02 | **Status:** Complete | **Environment:** React 19, TS 5.9, Vite 7.3, Zustand

---

## 1. COMPONENT SPLITTING PATTERNS — BREAKING 300+ LINE FILES

### Real Patterns from Production (2025)

**Current State (Well Project):**
- AdminSecuritySettings: 385 LOC
- ai-landing-page-builder: 364 LOC
- CopilotPage: 358 LOC
- AuditLog: 330 LOC
- 14 files exceed 250 LOC (audit required)

### Proven Splitting Strategies

#### A. **Feature-Sliced Design (FSD)** — Enterprise Standard
Layers: `app → pages → widgets → features → entities → shared`

**Extract pattern:**
```
AdminSecuritySettings (385 LOC) →
├── features/security-settings/ui/settings-form.tsx (120 LOC) — form rendering
├── features/security-settings/hooks/use-security-config.ts (80 LOC) — data fetch
├── entities/user-security/ui/policy-card.tsx (60 LOC) — reusable card
├── shared/ui/form-field.tsx (40 LOC) — input wrapper
└── features/security-settings/model/types.ts (30 LOC) — domain types
```

**Benefit:** Clear boundaries, easier testing, reusable entities.

#### B. **Custom Hooks Extraction** — Zustand-Ready (Your Stack)
Extract state + effects → hooks (Zustand already handles state).

**Pattern — Use in 300+ LOC files:**
```typescript
// Before: 350 LOC in component
export const AdminSecuritySettings = () => {
  const [config, setConfig] = useState({...});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => { /* 50 LOC fetch logic */ }, []);
  useEffect(() => { /* 30 LOC validation */ }, [config]);
  // 200+ LOC JSX
};

// After: Split into 3 files (~100 LOC each)
// 1. hooks/use-security-config.ts
export const useSecurityConfig = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => { /* fetch */ }, []);
  useEffect(() => { /* validate */ }, [config]);
  return { config, setConfig, loading, errors };
};

// 2. ui/security-form.tsx
export const SecurityForm = ({ config, setConfig, errors }) => {
  return <form>{/* 80 LOC JSX */}</form>;
};

// 3. components/AdminSecuritySettings.tsx
export const AdminSecuritySettings = () => {
  const { config, setConfig, loading, errors } = useSecurityConfig();
  return <SecurityForm config={config} setConfig={setConfig} errors={errors} />;
};
```

**Best for:** Business logic + UI separation (works with Zustand).

#### C. **Container/Presentational Decomposition**
Separate data fetching from rendering.

```typescript
// Container (100 LOC): data + state
export const AuditLogContainer = () => {
  const { logs, filter, setFilter } = useAuditLogs();
  return <AuditLogView logs={logs} filter={filter} onFilter={setFilter} />;
};

// Presenter (80 LOC): pure rendering
export const AuditLogView = ({ logs, filter, onFilter }) => {
  return (<table>{/* render logs */}</table>);
};
```

### Action Items for Well Project

| File | LOC | Strategy | Est. Split |
|------|-----|----------|-----------|
| AdminSecuritySettings | 385 | FSD + hooks | 4 files × 80 LOC |
| ai-landing-page-builder | 364 | Container/Presenter | 3 files × 110 LOC |
| CopilotPage | 358 | Custom hooks | 4 files × 85 LOC |
| AuditLog | 330 | FSD | 3 files × 100 LOC |

---

## 2. MONOREPO WORKSPACE CONFLICTS — "Cannot use --no-workspaces and --workspace"

### Root Cause Analysis

**Error:** `npm ERR! Cannot use --no-workspaces and --workspace at the same time`

**Triggers:**
1. `.npmrc` has conflicting workspace settings (root + app level)
2. Nested `package.json` in `apps/*` conflicts with root workspace definition
3. `npm install --no-workspaces --workspace=@well/admin` (manual flag conflict)

### Fix Strategy (Monorepo Best Practices)

**1. Root Structure (mekong-cli/):**
```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "name": "mekong-cli"
}
```

**2. App package.json (apps/well/):**
```json
{
  "name": "@mekong/well",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": { /* app-specific only */ }
}
```

**3. Root .npmrc (NO CONFLICTS):**
```
# ✅ GOOD: Clean workspace config
# Don't duplicate workspace-related settings at root

# ❌ BAD (causes conflict):
# workspaces-update=false
# workspaces=false
```

**4. Command Rules:**
```bash
# ✅ From root: Install all workspaces
npm install

# ✅ From root: Work in specific app
npm install --workspace=@mekong/well

# ✅ From app directory: Only if no root package-lock.json exists
cd apps/well && npm install

# ❌ NEVER: Mix conflicting flags
npm install --no-workspaces --workspace=@mekong/well
```

### Well Project Action

Check `.npmrc` at:
- `/Users/macbookprom1/mekong-cli/.npmrc` — Root config
- `/Users/macbookprom1/.npmrc` — Global config (source of truth)

**Fix:** Remove workspace overrides from nested .npmrc files.

---

## 3. FILE SIZE ENFORCEMENT — ESLINT + TOOLS

### ESLint max-lines Configuration

**Setup for Well (Vite + React):**

```javascript
// .eslintrc.cjs (at app root: apps/well/)
module.exports = {
  rules: {
    'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true }],
    'max-nested-callbacks': ['warn', 3],
  }
};
```

**Interpretation:**
- **max: 200** — File hard limit (component + imports + styles)
- **skipBlankLines: true** — Don't count blank lines (realistic LOC)
- **skipComments: true** — Don't count comments (focus on actual code)
- **max-lines-per-function: 80** — Warn on large functions (extract hooks)

### Enforcement in CI/CD

**Pre-commit hook (.husky/pre-commit):**
```bash
npx eslint src --max-warnings=0 --rule 'max-lines: error'
# Fail if any file > 200 LOC
```

**GitHub Actions (.github/workflows/lint.yml):**
```yaml
- name: Check file sizes
  run: npx eslint src --rule 'max-lines: error' --max-warnings=0
```

### Alternative: Custom Build Script

**scripts/validate-file-sizes.ts:**
```typescript
import fs from 'fs';
import path from 'path';

const MAX_LINES = 200;
const srcDir = 'src';

const files = fs.readdirSync(srcDir, { recursive: true });
const violations = files
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
  .map(f => ({
    file: f,
    lines: fs.readFileSync(path.join(srcDir, f), 'utf-8').split('\n').length
  }))
  .filter(f => f.lines > MAX_LINES);

if (violations.length > 0) {
  console.error('❌ Files exceeding', MAX_LINES, 'lines:');
  violations.forEach(v => console.error(`  ${v.file}: ${v.lines}`));
  process.exit(1);
}
console.log('✅ All files under', MAX_LINES, 'lines');
```

**Run in CI:**
```bash
npm run validate:file-sizes
```

### Tools Comparison

| Tool | Setup | CI/CD | Notes |
|------|-------|-------|-------|
| ESLint max-lines | 5 min | ✅ | Industry standard, Vite-compatible |
| max-lines-per-function | 5 min | ✅ | Catches function bloat |
| Custom script | 15 min | ✅ | Maximum control, lightweight |
| SonarQube | 1 hour | ✅ | Enterprise, overkill for <100K LOC |

**Recommendation for Well:** ESLint `max-lines` (quick win, no config overhead).

---

## Implementation Roadmap

### Phase 1: Baseline (1 day)
- [ ] Audit all files > 250 LOC (14 violations in Well)
- [ ] Document splitting strategy per file (FSD vs hooks vs container)
- [ ] Setup ESLint max-lines rule (200 LOC limit)

### Phase 2: Refactoring (3–5 days)
- [ ] Split AdminSecuritySettings (385 → 4 files)
- [ ] Split ai-landing-page-builder (364 → 3 files)
- [ ] Extract reusable hooks (Zustand + custom hooks)
- [ ] Validate TypeScript strict mode post-split

### Phase 3: Enforcement (1 day)
- [ ] Enable ESLint max-lines in pre-commit
- [ ] Add CI check to GitHub Actions
- [ ] Document architecture in CONTRIBUTING.md

---

## Key Takeaways

1. **Component Splitting:** Use FSD for entities/features, custom hooks for logic, containers for data
2. **Monorepo:** Single root workspaces declaration, no nested workspace settings
3. **File Size:** ESLint max-lines (200 LOC) + pre-commit enforcement prevents future bloat
4. **Zustand Fit:** Custom hooks layer (logic) + components (UI) = clean separation

---

## Sources

- [React Design Patterns 2025](https://www.bacancytechnology.com/blog/react-architecture-patterns-and-best-practices)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Custom Hooks Pattern](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [npm Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces/)
- [ESLint max-lines](https://eslint.org/docs/latest/rules/max-lines)
- [Turbo Monorepo Structure](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
- [Production Hooks Patterns](https://www.fullstack.com/labs/resources/blog/production-level-patterns-for-react-hooks)
