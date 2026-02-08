/**
 * Circuit Breaker Pattern for External API Calls
 * Prevents cascading failures by short-circuiting requests to failing services.
 *
 * States: CLOSED (normal) → OPEN (failing, reject calls) → HALF_OPEN (test recovery)
 */

import { NetworkError } from './errors';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit (default: 5) */
  failureThreshold?: number;
  /** Time in ms before attempting recovery (default: 30000) */
  resetTimeout?: number;
  /** Name for logging/debugging */
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30_000;
    this.name = options.name ?? 'default';
  }

  /**
   * Execute a function through the circuit breaker.
   * @param fn - The async function to protect
   * @param fallback - Optional fallback when circuit is open
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        if (fallback) return fallback();
        throw new NetworkError(
          `Circuit breaker [${this.name}] is OPEN — service unavailable`,
          { circuit: this.name, state: this.state }
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  /** Current circuit state */
  getState(): CircuitState {
    return this.state;
  }

  /** Reset circuit to closed state */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

// ─── Pre-configured breakers for external services ────────────

/** Circuit breaker for Supabase Edge Functions (Gemini, PayOS, etc.) */
export const edgeFunctionBreaker = new CircuitBreaker({
  name: 'edge-functions',
  failureThreshold: 5,
  resetTimeout: 30_000,
});

/** Circuit breaker for Supabase database queries */
export const databaseBreaker = new CircuitBreaker({
  name: 'database',
  failureThreshold: 10,
  resetTimeout: 15_000,
});

/** Circuit breaker for payment service (PayOS) */
export const paymentBreaker = new CircuitBreaker({
  name: 'payment',
  failureThreshold: 3,
  resetTimeout: 60_000,
});
