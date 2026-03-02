/**
 * Async retry, timeout, batch processing, and parallel concurrency utilities.
 * Extracted from utils/async.ts to keep it under 200 LOC.
 */

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    errorMessage = 'Operation timed out'
): Promise<T> {
    return Promise.race([
        promise,
        sleep(ms).then(() => { throw new Error(errorMessage); }),
    ]);
}

export async function retry<T>(
    fn: () => Promise<T>,
    options: {
        maxAttempts?: number;
        delay?: number;
        backoff?: number;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const { maxAttempts = 3, delay = 1000, backoff = 2, onRetry } = options;
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxAttempts) {
                onRetry?.(attempt, lastError);
                await sleep(delay * Math.pow(backoff, attempt - 1));
            }
        }
    }
    throw lastError;
}

export async function batch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        results.push(...await processor(items.slice(i, i + batchSize)));
    }
    return results;
}

export async function parallel<T, R>(
    items: T[],
    concurrency: number,
    processor: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let currentIndex = 0;
    const workers = Array(Math.min(concurrency, items.length)).fill(null).map(async () => {
        while (currentIndex < items.length) {
            const index = currentIndex++;
            results[index] = await processor(items[index]);
        }
    });
    await Promise.all(workers);
    return results;
}
