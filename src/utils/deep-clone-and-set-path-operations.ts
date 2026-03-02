/**
 * Deep clone, deep get/set by dot-path, flatten/unflatten nested objects.
 * Extracted from utils/deep.ts to keep it under 200 LOC.
 */

const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

export function deepClone<T>(value: T): T {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime()) as T;
    if (Array.isArray(value)) return value.map(item => deepClone(item)) as T;
    const cloned = {} as T;
    for (const key in value) {
        if (FORBIDDEN_KEYS.includes(key)) continue;
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            cloned[key] = deepClone(value[key]);
        }
    }
    return cloned;
}

export function deepGet<T = unknown>(
    obj: Record<string, unknown>,
    path: string,
    defaultValue?: T
): T {
    const keys = path.split('.');
    if (keys.some(k => FORBIDDEN_KEYS.includes(k))) return defaultValue as T;
    let current: unknown = obj;
    for (const key of keys) {
        if (current === null || current === undefined) return defaultValue as T;
        current = (current as Record<string, unknown>)[key];
    }
    return (current ?? defaultValue) as T;
}

export function deepSet<T extends Record<string, unknown>>(
    obj: T,
    path: string,
    value: unknown
): T {
    const keys = path.split('.');
    if (keys.some(k => FORBIDDEN_KEYS.includes(k))) return obj;
    const clone = deepClone(obj);
    let current: Record<string, unknown> = clone;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') current[key] = {};
        current = current[key] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    return clone;
}

export function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
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

export function unflatten(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
        const keys = key.split('.');
        if (keys.some(k => FORBIDDEN_KEYS.includes(k))) continue;
        let current = result;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current)) current[k] = {};
            current = current[k] as Record<string, unknown>;
        }
        current[keys[keys.length - 1]] = obj[key];
    }
    return result;
}
