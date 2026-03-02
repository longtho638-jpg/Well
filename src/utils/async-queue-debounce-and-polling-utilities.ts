/**
 * Async queue with concurrency control, debounce-async, and polling utilities.
 * Extracted from utils/async.ts to keep it under 200 LOC.
 */

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
                try { resolve(await task()); } catch (error) { reject(error); }
            });
            this.process();
        });
    }

    private async process(): Promise<void> {
        if (this.running >= this.concurrency || this.queue.length === 0) return;
        const task = this.queue.shift();
        if (!task) return;
        this.running++;
        try { await task(); } finally { this.running--; this.process(); }
    }

    get pending(): number { return this.queue.length; }
    get active(): number { return this.running; }
}

export function createQueue(concurrency?: number): AsyncQueue {
    return new AsyncQueue(concurrency);
}

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

export function poll<T>(
    fn: () => Promise<T>,
    interval: number,
    shouldStop: (result: T) => boolean
): Promise<T> {
    return new Promise((resolve, reject) => {
        const check = async () => {
            try {
                const result = await fn();
                if (shouldStop(result)) { resolve(result); } else { setTimeout(check, interval); }
            } catch (error) { reject(error); }
        };
        check();
    });
}
