/**
 * Deep equality check and object diff utilities.
 * Extracted from utils/deep.ts to keep it under 200 LOC.
 */

export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, (b as unknown[])[index]));
    }
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
}

export interface Diff {
    type: 'added' | 'removed' | 'changed';
    path: string;
    oldValue?: unknown;
    newValue?: unknown;
}

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
