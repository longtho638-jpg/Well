# Security Fix Report: API Key Exposure Removal

**Date:** 2026-02-02
**Status:** Completed
**Priority:** Medium

## 1. Vulnerability Mitigation
We have identified and removed hardcoded fallback API keys in the client bundle. These fallbacks posed a security risk as they could potentially expose test/demo credentials in the production build.

### Remediation Actions
- **Firebase Service** (`src/services/firebase.ts`): Removed fallbacks for `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`.
- **Supabase Client** (`src/lib/supabase.ts`): Removed placeholder URL and Anon Key fallbacks.
- **API Utilities** (`src/utils/api.ts`, `src/utils/constants.ts`): Removed hardcoded fallback to `https://api.wellnexus.vn` (now defaults to empty string if env var missing, but validation catches it).

## 2. Configuration Validation
Implemented a Fail-Fast mechanism to ensure the application starts with a valid configuration.

### New Components
- **Validator** (`src/utils/validate-config.ts`): Checks for presence of all required `VITE_*` environment variables during app initialization.
- **Integration** (`src/main.tsx`): Calls `validateConfig()` before mounting the React app.
- **Behavior**:
  - **Development**: Logs detailed error to console if keys are missing.
  - **Production**: Throws critical error to prevent app startup with invalid config.

### Required Environment Variables
The following variables are now mandatory:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

## 3. Verification
- **Unit Tests**: Created `src/utils/validate-config.test.ts`.
  - Verified valid config passes.
  - Verified missing keys trigger error/warning.
  - Verified production mode enforces strict validation.
  - Result: **PASSED** (3 tests)
- **Build**: Ran `npm run build`.
  - Result: **PASSED**

## 4. Recommendations
- Ensure local `.env` files are updated with real values.
- Ensure CI/CD pipelines inject these environment variables during build.
