import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sleep,
  withTimeout,
  retry,
  batch,
  parallel,
  createQueue,
  debounceAsync,
  poll
} from './async';

describe('Async Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sleep', () => {
    it('should wait for the specified time', async () => {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      await expect(withTimeout(promise, 1000)).resolves.toBe('success');
    });

    it('should reject if promise times out', async () => {
      const slowPromise = new Promise(resolve => setTimeout(resolve, 2000));
      const promise = withTimeout(slowPromise, 1000);

      vi.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow('Operation timed out');
    });

    it('should use custom error message', async () => {
      const slowPromise = new Promise(resolve => setTimeout(resolve, 2000));
      const promise = withTimeout(slowPromise, 1000, 'Custom error');

      vi.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow('Custom error');
    });
  });

  describe('retry', () => {
    it('should resolve immediately if function succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      await expect(retry(fn)).resolves.toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry specified number of times', async () => {
      const error = new Error('fail');
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const promise = retry(fn, { maxAttempts: 2, delay: 100 });

      // Advance timers for the delay
      await vi.runAllTimersAsync();

      await expect(promise).resolves.toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max attempts', async () => {
      const error = new Error('fail');
      const fn = vi.fn().mockRejectedValue(error);

      const promise = retry(fn, { maxAttempts: 3, delay: 100 });

      const expectPromise = expect(promise).rejects.toThrow('fail');
      await vi.runAllTimersAsync();
      await expectPromise;

      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('batch', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn().mockImplementation(async (batch) => batch.map((x: number) => x * 2));

      const result = await batch(items, 2, processor);

      expect(result).toEqual([2, 4, 6, 8, 10]);
      expect(processor).toHaveBeenCalledTimes(3); // [1,2], [3,4], [5]
      expect(processor).toHaveBeenCalledWith([1, 2]);
      expect(processor).toHaveBeenCalledWith([3, 4]);
      expect(processor).toHaveBeenCalledWith([5]);
    });
  });

  describe('parallel', () => {
    it('should process items with concurrency limit', async () => {
      const items = [1, 2, 3, 4];
      const processor = vi.fn().mockImplementation(async (x) => {
        await sleep(100);
        return x * 2;
      });

      const promise = parallel(items, 2, processor);

      // First batch starts
      await vi.advanceTimersByTimeAsync(100);
      // Second batch starts
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toEqual([2, 4, 6, 8]);
      expect(processor).toHaveBeenCalledTimes(4);
    });
  });

  describe('createQueue', () => {
    it('should process tasks with concurrency limit', async () => {
      const queue = createQueue(2);
      const results: number[] = [];

      const task = (id: number) => async () => {
        await sleep(100);
        results.push(id);
        return id;
      };

      const p1 = queue.add(task(1));
      const p2 = queue.add(task(2));
      const p3 = queue.add(task(3));

      expect(queue.active).toBe(2);
      expect(queue.pending).toBe(1);

      await vi.advanceTimersByTimeAsync(100);
      await Promise.all([p1, p2]);

      // p3 starts now, but we need to ensure the queue processed it.
      // queue.process() is async recursive but not awaited by add().
      // However, add() awaits the task execution.

      expect(queue.active).toBe(1);

      await vi.advanceTimersByTimeAsync(100);
      await p3;

      expect(results).toHaveLength(3);
      expect(results).toContain(1);
      expect(results).toContain(2);
      expect(results).toContain(3);
    });
  });

  describe('debounceAsync', () => {
    it('should debounce async calls', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const debounced = debounceAsync(fn, 100);

      const p1 = debounced();
      const p2 = debounced();
      const p3 = debounced();

      await vi.advanceTimersByTimeAsync(100);

      const results = await Promise.all([p1, p2, p3]);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(results).toEqual(['result', 'result', 'result']);
    });

    it('should handle errors correctly', async () => {
      const error = new Error('fail');
      const fn = vi.fn().mockRejectedValue(error);
      const debounced = debounceAsync(fn, 100);

      const p1 = debounced();
      const p2 = debounced();

      await vi.advanceTimersByTimeAsync(100);

      await expect(p1).rejects.toThrow('fail');
      await expect(p2).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('poll', () => {
    it('should poll until condition is met', async () => {
      let count = 0;
      const fn = vi.fn().mockImplementation(async () => {
        count++;
        return count;
      });

      const shouldStop = (n: number) => n === 3;

      const promise = poll(fn, 100, shouldStop);

      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
