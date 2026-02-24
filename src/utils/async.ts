/**
 * Async Utilities
 * Phase 13: Network and Colors
 */

// ============================================================================
// PROMISE UTILITIES
// ============================================================================

/**
 * Wait for specified duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Timeout a promise
 */
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    errorMessage = 'Operation timed out'
): Promise<T> {
    return Promise.race([
        promise,
        sleep(ms).then(() => {
            throw new Error(errorMessage);
        }),
    ]);
}

/**
 * Retry a function with exponential backoff
 */
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

// ============================================================================
// BATCHING
// ============================================================================

/**
 * Process items in batches
 */
export async function batch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batchItems = items.slice(i, i + batchSize);
        const batchResults = await processor(batchItems);
        results.push(...batchResults);
    }

    return results;
}

/**
 * Process items with concurrency limit
 */
export async function parallel<T, R>(
    items: T[],
    concurrency: number,
    processor: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let currentIndex = 0;

    const workers = Array(Math.min(concurrency, items.length))
        .fill(null)
        .map(async () => {
            while (currentIndex < items.length) {
                const index = currentIndex++;
                results[index] = await processor(items[index]);
            }
        });

    await Promise.all(workers);
    return results;
}

// ============================================================================
// QUEUE
// ============================================================================

type Task = () => Promise<unknown>;

class AsyncQueue {
    private queue: Task[] = [];
    private running = 0;
    private concurrency: number;

    constructor(concurrency = 1) {
        this.concurrency = concurrency;
    }

    add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    resolve(await task());
                } catch (error) {
                    reject(error);
                }
            });
            this.process();
        });
    }

    private async process(): Promise<void> {
        if (this.running >= this.concurrency || this.queue.length === 0) return;

        const task = this.queue.shift();
        if (!task) return;

        this.running++;

        try {
            await task();
        } finally {
            this.running--;
            this.process();
        }
    }

    get pending(): number {
        return this.queue.length;
    }

    get active(): number {
        return this.running;
    }
}

export function createQueue(concurrency?: number): AsyncQueue {
    return new AsyncQueue(concurrency);
}

// ============================================================================
// DEBOUNCE ASYNC
// ============================================================================

export function debounceAsync<T extends (...args: Parameters<T>) => Promise<ReturnType<T>>>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingResolves: { resolve: (value: ReturnType<T>) => void; reject: (reason?: unknown) => void }[] = [];

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
        if (timeoutId) clearTimeout(timeoutId);

        return new Promise((resolve, reject) => {
            pendingResolves.push({ resolve, reject });

            timeoutId = setTimeout(async () => {
                try {
                    const result = await fn(...args);
                    pendingResolves.forEach(({ resolve }) => resolve(result));
                } catch (error) {
                    pendingResolves.forEach(({ reject }) => reject(error));
                } finally {
                    pendingResolves = [];
                }
            }, delay);
        });
    };
}

// ============================================================================
// POLLING
// ============================================================================

export function poll<T>(
    fn: () => Promise<T>,
    interval: number,
    shouldStop: (result: T) => boolean
): Promise<T> {
    return new Promise((resolve, reject) => {
        const check = async () => {
            try {
                const result = await fn();
                if (shouldStop(result)) {
                    resolve(result);
                } else {
                    setTimeout(check, interval);
                }
            } catch (error) {
                reject(error);
            }
        };
        check();
    });
}
