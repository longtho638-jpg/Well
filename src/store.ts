/**
 * WellNexus Unified Store (Legacy Entry Point)
 * 
 * REFACTOR: This file now re-exports from the domain-driven store directory.
 * All logic has been decomposed into specialized slices.
 */

export { useStore } from './store/index';
export type { AppState } from './store/index';
