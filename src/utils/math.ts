/**
 * Math Utilities
 * Phase 14: Math and Random
 */

// ============================================================================
// BASIC MATH
// ============================================================================

/**
 * Sum array of numbers
 */
export function sum(numbers: number[]): number {
    return numbers.reduce((acc, n) => acc + n, 0);
}

/**
 * Average of numbers
 */
export function average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return sum(numbers) / numbers.length;
}

/**
 * Median of numbers
 */
export function median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

/**
 * Min and max of numbers
 */
export function minMax(numbers: number[]): { min: number; max: number } {
    if (numbers.length === 0) return { min: 0, max: 0 };
    return {
        min: Math.min(...numbers),
        max: Math.max(...numbers),
    };
}

// ============================================================================
// RANGE AND INTERPOLATION
// ============================================================================

/**
 * Generate range of numbers
 */
export function range(start: number, end: number, step = 1): number[] {
    const result: number[] = [];
    for (let i = start; i < end; i += step) {
        result.push(i);
    }
    return result;
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Inverse lerp (get t from value)
 */
export function inverseLerp(a: number, b: number, v: number): number {
    return (v - a) / (b - a);
}

/**
 * Map value from one range to another
 */
export function mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number {
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

// ============================================================================
// FINANCIAL CALCULATIONS
// ============================================================================

/**
 * Calculate growth percentage
 */
export function growthRate(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate compound growth
 */
export function compoundGrowth(
    principal: number,
    rate: number,
    periods: number
): number {
    return principal * Math.pow(1 + rate / 100, periods);
}

/**
 * Format large numbers (Vietnamese style)
 */
export function formatLargeNumber(num: number): string {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' triệu';
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Standard deviation
 */
export function standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = average(numbers);
    const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
    return Math.sqrt(average(squareDiffs));
}

/**
 * Percentile of numbers
 */
export function percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return lerp(sorted[lower], sorted[upper], index - lower);
}
