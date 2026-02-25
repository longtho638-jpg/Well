/**
 * State Management Utilities
 * Phase 7: Developer Experience
 */

import { StateCreator } from 'zustand';
import { storeLogger } from './logger';

// ============================================================================
// SLICE PATTERN HELPER
// ============================================================================

/**
 * Create a typed slice for Zustand store composition
 */
export function createSlice<T extends object>(
    name: string,
    initialState: T,
    actions: (set: (partial: Partial<T>) => void, get: () => T) => Record<string, unknown>
) {
    return {
        name,
        initialState,
        actions,
    };
}

// ============================================================================
// ASYNC ACTION WRAPPER
// ============================================================================

interface AsyncState {
    isLoading: boolean;
    error: string | null;
}

/**
 * Create async action with loading/error state
 */
export function createAsyncAction<T, Args extends unknown[]>(
    action: (...args: Args) => Promise<T>,
    options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
    }
) {
    return async (
        set: (state: Partial<AsyncState>) => void,
        ...args: Args
    ): Promise<T | null> => {
        set({ isLoading: true, error: null });

        try {
            const result = await action(...args);
            set({ isLoading: false });
            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ isLoading: false, error: message });
            options?.onError?.(error as Error);
            return null;
        }
    };
}

// ============================================================================
// SELECTOR HELPERS
// ============================================================================

/**
 * Create memoized selector
 */
export function createSelector<State, Selected>(
    selector: (state: State) => Selected
): (state: State) => Selected {
    let lastState: State | undefined;
    let lastResult: Selected | undefined;

    return (state: State) => {
        if (state === lastState && lastResult !== undefined) {
            return lastResult;
        }
        lastState = state;
        lastResult = selector(state);
        return lastResult;
    };
}

/**
 * Create multiple selectors from keys
 */
export function createSelectors<State extends object>(
    keys: (keyof State)[]
): Record<string, (state: State) => State[keyof State]> {
    return keys.reduce((acc, key) => ({
        ...acc,
        [key]: (state: State) => state[key],
    }), {});
}

// ============================================================================
// RESET HELPER
// ============================================================================

/**
 * Add reset functionality to store
 */
export function withReset<T extends object>(
    initialState: T
): {
    reset: () => void;
    getInitialState: () => T;
} {
    return {
        reset: () => initialState,
        getInitialState: () => ({ ...initialState }),
    };
}

// ============================================================================
// COMPUTED VALUES
// ============================================================================

/**
 * Create computed value that updates when dependencies change
 */
export function computed<State, Result>(
    selector: (state: State) => Result
): (state: State) => Result {
    return selector;
}

// ============================================================================
// DEBUG MIDDLEWARE
// ============================================================================

/**
 * Simple debug logger middleware
 */
export function debugMiddleware<T extends object>(
    config: StateCreator<T>
): StateCreator<T> {
    return (set, get, api) => {
        const wrappedSet: typeof set = (...args) => {
            storeLogger.debug('Update - Previous:', get());
            (set as (...a: unknown[]) => void)(...args);
            storeLogger.debug('Update - Next:', get());
        };
        return config(wrappedSet, get, api);
    };
}
