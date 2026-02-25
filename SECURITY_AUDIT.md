# Security Audit Report

## 1. Critical Vulnerabilities

### 1.1 Unrestricted INSERT on `users` table
**Severity**: Critical
**File**: `supabase/migrations/20260224_critical_bug_fixes.sql`
**Description**: The RLS policy `users_insert_own` allows any authenticated user to insert a row into the `public.users` table as long as the `id` matches their authentication ID. However, it does not restrict the content of the inserted row. A malicious user can exploit this to grant themselves administrative privileges (e.g., `role: 'admin'`, `role_id: 1`) or modify their balance (`shop_balance`, `grow_balance`).
**Recommendation**:
1. Move user creation logic to a trusted backend process (e.g., Database Trigger or Edge Function).
2. Remove the `INSERT` permission for authenticated users on the `users` table entirely.

### 1.2 Insecure Client-Side User Creation
**Severity**: High
**File**: `src/hooks/useSignup.ts` (Lines 48-58)
**Description**: The application relies on the client to insert the user profile into `public.users` after signup. This exposes the database schema and logic to manipulation. If the client fails to insert (e.g., network error), the user exists in `auth.users` but not `public.users`, leading to a broken state.
**Recommendation**: Implement a PostgreSQL Trigger on `auth.users` to automatically create the `public.users` record securely.

## 2. High Vulnerabilities

### 2.1 Insecure "Add Member" Functionality (Password Handling)
**Severity**: High
**File**: `src/components/network-tree/AddMemberModal.tsx` (Lines 116-124)
**File**: `src/services/referral-service.ts` (Lines 253, 261)
**Description**: The "Add Member" modal allows a logged-in user (sponsor) to set a password for a new user. This is a significant security risk as the sponsor knows the new user's credentials. It violates the principle of least privilege and user privacy.
**Recommendation**:
1. Remove the password field from the "Add Member" form.
2. Use an invitation flow where the new user receives an email with a link to set their own password.

### 2.2 Potential Privilege Escalation via Metadata
**Severity**: Medium/High
**File**: `src/services/referral-service.ts` (Line 264)
**Description**: The `addMember` function passes `role_id` in the `supabase.auth.signUp` metadata. While currently not exploited (as there is no trigger using it), if a trigger blindly trusts this metadata, it could allow privilege escalation if a regular user calls `signUp` with a modified payload.
**Recommendation**:
1. Ensure any backend logic processing `role_id` validates the source of the request or restricts the allowed roles (e.g., only allow `member`, `contributor`).
2. Administrative role assignment should be handled via a separate, secured administrative API.

## 3. Medium/Low Vulnerabilities

### 3.1 Missing Input Validation on `users` table updates
**Severity**: Medium
**File**: `supabase/migrations/20260207_rls_policies.sql`
**Description**: The `users_update_own` policy prevents updating sensitive fields like `role` and `balance`. However, other fields like `name`, `avatar_url`, etc., should be validated for length and content to prevent potential abuse (though XSS risk is low due to React).
**Recommendation**: Add constraints (CHECK constraints) or triggers to validate input data length and format.

### 3.2 Hardcoded Role IDs in Frontend
**Severity**: Low
**File**: `src/components/network-tree/AddMemberModal.tsx`
**Description**: Role IDs (6, 7, 8) are hardcoded in the frontend. If these IDs change in the database, the frontend will break or assign incorrect roles.
**Recommendation**: Fetch valid roles from a `roles` table or constants defined in a shared config.

## 4. Other Findings

### 4.1 Webhook Security
**Status**: Secure
**File**: `supabase/functions/payos-webhook/index.ts`
**Description**: The webhook implementation correctly verifies the signature using a constant-time comparison and checks the `x-webhook-secret` header. It also handles idempotency correctly.

### 4.2 XSS / SQL Injection
**Status**: Secure
**Description**:
- No `dangerouslySetInnerHTML` usage found.
- Supabase client uses parameterized queries, preventing SQL injection in standard usage.
- No raw SQL concatenation found in Edge Functions.
