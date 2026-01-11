/**
 * Data Transformation Utilities
 * Phase 8: Data and Components
 */

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Group array by key
 */
export function groupBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return items.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<K, T[]>);
}

/**
 * Sort array by key with direction
 */
export function sortBy<T>(
    items: T[],
    keyFn: (item: T) => string | number,
    direction: 'asc' | 'desc' = 'asc'
): T[] {
    return [...items].sort((a, b) => {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'asc' ? comparison : -comparison;
    });
}

/**
 * Remove duplicates by key
 */
export function uniqueBy<T, K>(items: T[], keyFn: (item: T) => K): T[] {
    const seen = new Set<K>();
    return items.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Chunk array into groups
 */
export function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

/**
 * Partition array by predicate
 */
export function partition<T>(
    items: T[],
    predicate: (item: T) => boolean
): [T[], T[]] {
    const truthy: T[] = [];
    const falsy: T[] = [];
    items.forEach(item => {
        (predicate(item) ? truthy : falsy).push(item);
    });
    return [truthy, falsy];
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    return keys.reduce((acc, key) => {
        if (key in obj) acc[key] = obj[key];
        return acc;
    }, {} as Pick<T, K>);
}

/**
 * Omit specific keys from object
 */
export function omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result as Omit<T, K>;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key of Object.keys(source) as (keyof T)[]) {
        const targetValue = result[key];
        const sourceValue = source[key];

        if (isObject(targetValue) && isObject(sourceValue)) {
            result[key] = deepMerge(targetValue as object, sourceValue as object) as T[keyof T];
        } else if (sourceValue !== undefined) {
            result[key] = sourceValue as T[keyof T];
        }
    }

    return result;
}

function isObject(item: unknown): item is object {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

/**
 * Slugify string for URLs
 */
export function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Round to decimal places
 */
export function roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return roundTo((value / total) * 100, 1);
}
