/**
 * Safari Polyfills for Web Crypto API and Promise.allSettled
 * Ensures compatibility with Safari < 14 and non-HTTPS contexts
 */

import { createLogger } from './logger';

const logger = createLogger('Polyfills');

// ============================================================================
// PROMISE.ALLSETTLED POLYFILL (Safari < 13)
// ============================================================================

if (!Promise.allSettled) {
  Promise.allSettled = function <T>(promises: Array<Promise<T>>): Promise<Array<PromiseSettledResult<T>>> {
    return Promise.all(
      promises.map(promise =>
        Promise.resolve(promise)
          .then(value => ({ status: 'fulfilled' as const, value }))
          .catch(reason => ({ status: 'rejected' as const, reason }))
      )
    );
  };
}

// ============================================================================
// CRYPTO FALLBACK (Safari in non-HTTPS contexts)
// ============================================================================

/**
 * Check if Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return typeof window !== 'undefined' &&
         window.crypto !== undefined &&
         window.crypto.subtle !== undefined;
}

/**
 * Safe getRandomValues with fallback to Math.random
 */
export function safeGetRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    try {
      return window.crypto.getRandomValues(array);
    } catch (error) {
      logger.warn('crypto.getRandomValues failed, using Math.random fallback:', error);
    }
  }

  // Fallback to Math.random (less secure but works in all contexts)
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

/**
 * Safe crypto.subtle.digest with fallback
 */
export async function safeDigest(algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> {
  if (isCryptoAvailable()) {
    try {
      return await window.crypto.subtle.digest(algorithm, data);
    } catch (error) {
      logger.warn('crypto.subtle.digest failed, using fallback:', error);
    }
  }

  // Fallback: simple hash (not cryptographically secure, but works)
  const bytes = new Uint8Array(data);
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) - hash) + bytes[i];
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to ArrayBuffer with 32 bytes (256 bits) for SHA-256 compatibility
  const hashArray = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hashArray[i] = (hash >> (i % 4 * 8)) & 0xFF;
  }
  return hashArray.buffer;
}

/**
 * Initialize polyfills - call this in main.tsx before app render
 */
export function initializePolyfills(): void {
  // Log crypto availability
  if (!isCryptoAvailable()) {
    logger.warn('Web Crypto API not available. Using fallback implementations.');
  }

  // Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    logger.info('Safari detected. Polyfills active for compatibility.');
  }
}
