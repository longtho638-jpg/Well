# Tech Debt Analysis Report

## Overview
This report analyzes the technical debt in the `wellnexus` codebase, focusing on code duplication, complexity, and maintainability.

## 1. Code Duplication
- **High Severity**: `src/components/PremiumEffects.tsx` and `src/components/UltimateEffects.tsx`
  - **Issue**: Both files implement similar visual effects (gradients, cards, text animations) with slightly different implementations. This violates DRY (Don't Repeat Yourself).
  - **Recommendation**: Create a unified `ui-effects` library or component set. Extract common logic into custom hooks (e.g., `useMousePosition`, `useScrollReveal`).

## 2. Complexity & Maintainability
- **Medium Severity**: `src/components/MarketingTools/ai-landing-page-builder.tsx`
  - **Issue**: Large component (360+ lines) handling UI, state, file uploads, and logic.
  - **Recommendation**: Split into smaller sub-components:
    - `TemplateSelector`
    - `PortraitUploader`
    - `LandingPagePreview`
    - `StatsDashboard`
- **Medium Severity**: `src/pages/Admin.tsx`
  - **Issue**: Contains hardcoded navigation configuration, sidebar logic, and layout styles mixed with component logic.
  - **Recommendation**: Extract navigation config to a constant file. Create a separate `AdminLayout` component.

## 3. Data Management
- **Medium Severity**: `src/data/mockData.ts`
  - **Issue**: Extensive use of hardcoded mock data (500+ lines).
  - **Recommendation**: Move to a proper API service layer. If mock data is needed for dev, keep it separate from production code or use a mock server (e.g., MSW).

## 4. Internationalization (i18n)
- **Low Severity**: `src/locales/*.ts`
  - **Issue**: Large translation files (>2000 lines).
  - **Recommendation**: Split translations by feature/module (e.g., `auth.ts`, `admin.ts`, `landing.ts`) to improve maintainability and reduce bundle size if lazy loaded.

## 5. Priority Fix List (Top 5)

1.  **Refactor Effects Components**: Merge `PremiumEffects.tsx` and `UltimateEffects.tsx` into a reusable UI library.
2.  **Refactor AI Landing Page Builder**: Break down `ai-landing-page-builder.tsx` into smaller, focused components.
3.  **Extract Admin Navigation**: Move navigation logic out of `Admin.tsx` into a configuration file.
4.  **Standardize Mock Data**: Create a clear boundary for mock data usage to ease the transition to real APIs.
5.  **Split Translation Files**: Modularize `vi.ts` and `en.ts` for better manageability.

## Conclusion
The codebase is generally well-structured but shows signs of "copy-paste" development in visual components and growing complexity in page-level components. Addressing these issues now will prevent maintenance headaches as the project scales.
