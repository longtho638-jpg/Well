/**
 * Random and ID Utilities
 * Phase 14: Math and Random
 */

// ============================================================================
// RANDOM NUMBERS
// ============================================================================

/**
 * Random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
export function randomFloat(min: number, max: number, decimals = 2): number {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
}

/**
 * Random boolean with probability
 */
export function randomBool(probability = 0.5): boolean {
    return Math.random() < probability;
}

/**
 * Random element from array
 */
export function randomElement<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[randomInt(0, array.length - 1)];
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Random sample from array
 */
export function sample<T>(array: T[], size: number): T[] {
    return shuffle(array).slice(0, size);
}

// ============================================================================
// UNIQUE IDS
// ============================================================================

/**
 * Generate UUID v4
 */
export function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Generate short ID (8 characters)
 */
export function shortId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Generate nano ID (21 characters by default)
 */
export function nanoId(size = 21): string {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let id = '';
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    for (let i = 0; i < size; i++) {
        id += alphabet[bytes[i] % alphabet.length];
    }
    return id;
}

/**
 * Generate prefixed ID
 */
export function prefixedId(prefix: string): string {
    return `${prefix}_${shortId()}`;
}

/**
 * Generate timestamp-based ID
 */
export function timestampId(): string {
    return `${Date.now().toString(36)}_${shortId()}`;
}

// ============================================================================
// WEIGHTED RANDOM
// ============================================================================

interface WeightedItem<T> {
    value: T;
    weight: number;
}

/**
 * Select item based on weights
 */
export function weightedRandom<T>(items: WeightedItem<T>[]): T | undefined {
    if (items.length === 0) return undefined;

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
        random -= item.weight;
        if (random <= 0) return item.value;
    }

    return items[items.length - 1].value;
}

// ============================================================================
// SEEDED RANDOM (for reproducible results)
// ============================================================================

export class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    int(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    element<T>(array: T[]): T | undefined {
        if (array.length === 0) return undefined;
        return array[this.int(0, array.length - 1)];
    }
}

export function seededRandom(seed: number): SeededRandom {
    return new SeededRandom(seed);
}
