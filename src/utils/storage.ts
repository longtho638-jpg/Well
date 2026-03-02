/**
 * Storage Utilities — prefixed localStorage and sessionStorage wrappers with JSON serialization, plus IndexedDB store re-export
 * Phase 9: Events and Notifications
 */

import { storeLogger } from './logger';

export { idbStore } from './storage-indexeddb-async-store-with-versioned-schema';

// ============================================================================
// LOCAL STORAGE WRAPPER
// ============================================================================

interface StorageOptions {
    prefix?: string;
    serializer?: {
        stringify: (value: unknown) => string;
        parse: (text: string) => unknown;
    };
}

class Storage {
    private prefix: string;
    private serializer: { stringify: (v: unknown) => string; parse: (t: string) => unknown };

    constructor(options: StorageOptions = {}) {
        this.prefix = options.prefix || 'wellnexus_';
        this.serializer = options.serializer || JSON;
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    get<T>(key: string, defaultValue: T): T;
    get<T>(key: string): T | null;
    get<T>(key: string, defaultValue?: T): T | null {
        try {
            const item = localStorage.getItem(this.getKey(key));
            if (item === null) return defaultValue ?? null;
            return this.serializer.parse(item) as T;
        } catch {
            return defaultValue ?? null;
        }
    }

    set<T>(key: string, value: T): void {
        try {
            localStorage.setItem(this.getKey(key), this.serializer.stringify(value));
        } catch (error) {
            storeLogger.error('Storage set error', error);
        }
    }

    remove(key: string): void {
        localStorage.removeItem(this.getKey(key));
    }

    clear(): void {
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .forEach(key => localStorage.removeItem(key));
    }

    has(key: string): boolean {
        return localStorage.getItem(this.getKey(key)) !== null;
    }

    keys(): string[] {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.slice(this.prefix.length));
    }
}

export const storage = new Storage();

// ============================================================================
// SESSION STORAGE WRAPPER
// ============================================================================

class SessionStorage {
    private readonly prefix = 'wellnexus_session_';

    get<T>(key: string, defaultValue: T): T;
    get<T>(key: string): T | null;
    get<T>(key: string, defaultValue?: T): T | null {
        try {
            const item = sessionStorage.getItem(`${this.prefix}${key}`);
            if (item === null) return defaultValue ?? null;
            return JSON.parse(item) as T;
        } catch {
            return defaultValue ?? null;
        }
    }

    set<T>(key: string, value: T): void {
        try {
            sessionStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
        } catch (error) {
            storeLogger.error('Session storage set error', error);
        }
    }

    remove(key: string): void {
        sessionStorage.removeItem(`${this.prefix}${key}`);
    }
}

export const sessionStore = new SessionStorage();
