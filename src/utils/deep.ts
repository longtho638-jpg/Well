/**
 * Object and Array Deep Utilities
 * Phase 14: Math and Random
 */

const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

// ============================================================================
// DEEP CLONE
// ============================================================================

/**
 * Deep clone object/array
 */
export function deepClone<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (value instanceof Date) {
        return new Date(value.getTime()) as T;
    }

    if (Array.isArray(value)) {
        return value.map(item => deepClone(item)) as T;
    }

    const cloned = {} as T;
    for (const key in value) {
        if (FORBIDDEN_KEYS.includes(key)) continue;

        if (Object.prototype.hasOwnProperty.call(value, key)) {
            cloned[key] = deepClone(value[key]);
        }
    }
    return cloned;
}

// ============================================================================
// DEEP COMPARE
// ============================================================================

/**
 * Deep equality check
 */
export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
    }

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
}

// ============================================================================
// DEEP GET/SET
// ============================================================================

/**
 * Get nested value by path
 */
export function deepGet<T = unknown>(
    obj: Record<string, unknown>,
    path: string,
    defaultValue?: T
): T {
    const keys = path.split('.');

    // Security check
    if (keys.some(k => FORBIDDEN_KEYS.includes(k))) {
        return defaultValue as T;
    }

    let current: unknown = obj;

    for (const key of keys) {
        if (current === null || current === undefined) {
            return defaultValue as T;
        }
        current = (current as Record<string, unknown>)[key];
    }

    return (current ?? defaultValue) as T;
}

/**
 * Set nested value by path (immutable)
 */
export function deepSet<T extends Record<string, unknown>>(
    obj: T,
    path: string,
    value: unknown
): T {
    const keys = path.split('.');

    // Security check
    if (keys.some(k => FORBIDDEN_KEYS.includes(k))) {
        return obj;
    }

    const clone = deepClone(obj);

    let current: Record<string, unknown> = clone;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    return clone;
}

// ============================================================================
// FLATTEN / UNFLATTEN
// ============================================================================

/**
 * Flatten nested object
 */
export function flatten(
    obj: Record<string, unknown>,
    prefix = ''
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
        } else {
            result[fullKey] = value;
        }
    }

    return result;
}

/**
 * Unflatten dot-notation object
 */
export function unflatten(
    obj: Record<string, unknown>
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key in obj) {
        const keys = key.split('.');

        // Security check
        if (keys.some(k => FORBIDDEN_KEYS.includes(k))) {
            continue;
        }

        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current)) {
                current[k] = {};
            }
            current = current[k] as Record<string, unknown>;
        }

        current[keys[keys.length - 1]] = obj[key];
    }

    return result;
}

// ============================================================================
// DIFF
// ============================================================================

interface Diff {
    type: 'added' | 'removed' | 'changed';
    path: string;
    oldValue?: unknown;
    newValue?: unknown;
}

/**
 * Get differences between two objects
 */
export function diff(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    path = ''
): Diff[] {
    const diffs: Diff[] = [];
    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

    for (const key of allKeys) {
        const fullPath = path ? `${path}.${key}` : key;
        const oldVal = oldObj[key];
        const newVal = newObj[key];

        if (!(key in oldObj)) {
            diffs.push({ type: 'added', path: fullPath, newValue: newVal });
        } else if (!(key in newObj)) {
            diffs.push({ type: 'removed', path: fullPath, oldValue: oldVal });
        } else if (!deepEqual(oldVal, newVal)) {
            if (typeof oldVal === 'object' && typeof newVal === 'object' && !Array.isArray(oldVal)) {
                diffs.push(...diff(
                    oldVal as Record<string, unknown>,
                    newVal as Record<string, unknown>,
                    fullPath
                ));
            } else {
                diffs.push({ type: 'changed', path: fullPath, oldValue: oldVal, newValue: newVal });
            }
        }
    }

    return diffs;
}
