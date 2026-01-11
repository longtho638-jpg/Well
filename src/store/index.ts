/**
 * Store Index - Re-export Unified Store
 * 
 * This file provides backward compatibility while the codebase
 * migrates to individual slice imports.
 * 
 * Usage:
 * - New code: import { useAuthStore } from '@/store/slices/authSlice'
 * - Legacy code: import { useStore } from '@/store' (still works)
 */

// Re-export from slices for direct slice access
export * from './slices';

// For now, the main store is still in src/store.ts
// This will be migrated to a combined store once all consumers are updated
