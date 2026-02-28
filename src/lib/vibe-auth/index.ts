/**
 * Vibe Auth SDK — Entry Point
 *
 * Provider-agnostic auth SDK for RaaS projects.
 * Currently supports Supabase; extensible to Firebase, Clerk.
 *
 * Usage:
 *   import { evaluateRouteGuard, checkAdminAccess } from '@/lib/vibe-auth';
 *   const verdict = evaluateRouteGuard(config, user, isAuthenticated);
 *   const isAdmin = checkAdminAccess(user, adminEmails);
 */

// Re-export all types
export type {
  AuthProviderName,
  VibeAuthUser,
  VibeAuthResult,
  VibeAuthError,
  VibeAuthState,
  VibeAuthSession,
  AuthEventType,
  VibeAuthEvent,
  AuthEventCallback,
  RouteGuardVerdict,
  RouteGuardConfig,
  AutoLogoutConfig,
  AdminCheckConfig,
  VibeAuthProvider,
} from './types';

// Auth guard utilities
export {
  evaluateRouteGuard,
  createAutoLogoutController,
  checkAdminAccess,
} from './auth-guard-utils';
