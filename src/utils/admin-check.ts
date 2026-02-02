/**
 * Admin Check Utility
 *
 * Centralizes admin authorization logic using environment variables.
 * WARNING: Client-side admin check only. Backend MUST verify admin status via Supabase RLS.
 */

import { authLogger } from '@/utils/logger';

// Load admin emails from environment variable
// Format: comma-separated list of emails (case-insensitive)
const ADMIN_EMAILS_ENV = import.meta.env.VITE_ADMIN_EMAILS || '';

const ADMIN_EMAILS = ADMIN_EMAILS_ENV
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter((email: string) => email.length > 0);

/**
 * Checks if the provided email belongs to an admin.
 *
 * @param email - The user's email address
 * @returns boolean - True if the email is in the admin whitelist
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase().trim();
  const isAdminUser = ADMIN_EMAILS.includes(normalizedEmail);

  if (isAdminUser) {
    authLogger.info('Admin access verified', { email: normalizedEmail });
  }

  return isAdminUser;
}

/**
 * Returns a copy of the allowed admin emails.
 * Useful for debugging or displaying authorized accounts (if appropriate).
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}
