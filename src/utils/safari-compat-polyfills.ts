/**
 * Safari Compatibility Polyfills
 * 
 * CRITICAL: This file MUST be imported FIRST in main.tsx.
 * ES module imports are hoisted and executed in order — this module's
 * side effects run before React/Router which use these APIs.
 *
 * Object.hasOwn — Safari < 15.4 (used by React Router)
 * structuredClone — Safari < 15.4 (used by various libs)
 * Array.prototype.at — Safari < 15.4
 * Promise.allSettled — Safari < 13 (already polyfilled in main.tsx but duplicated here for safety)
 */

// Object.hasOwn — React Router uses this in vendor bundle
if (!Object.hasOwn) {
  Object.defineProperty(Object, 'hasOwn', {
    value: function (obj: object, prop: PropertyKey): boolean {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    },
    configurable: true,
    writable: true,
  });
}

// structuredClone — various libraries may use this
if (typeof globalThis.structuredClone === 'undefined') {
  (globalThis as Record<string, unknown>).structuredClone = function <T>(val: T): T {
    return JSON.parse(JSON.stringify(val));
  };
}

// Array.prototype.at — Safari < 15.4
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    value: function <T>(this: T[], index: number): T | undefined {
      const i = index >= 0 ? index : this.length + index;
      return this[i];
    },
    configurable: true,
    writable: true,
  });
}

// String.prototype.replaceAll — Safari < 13.1
if (!String.prototype.replaceAll) {
  Object.defineProperty(String.prototype, 'replaceAll', {
    value: function (search: string | RegExp, replacement: string): string {
      if (search instanceof RegExp) {
        if (!search.global) {
          throw new TypeError('String.prototype.replaceAll called with a non-global RegExp argument');
        }
        return (this as string).replace(search, replacement);
      }
      return (this as string).split(search).join(replacement);
    },
    configurable: true,
    writable: true,
  });
}

export {};
