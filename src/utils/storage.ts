/**
 * Storage Utilities
 * Phase 9: Events and Notifications
 */

import { storeLogger } from './logger';

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
        const keys = Object.keys(localStorage);
        keys
            .filter((key) => key.startsWith(this.prefix))
            .forEach((key) => localStorage.removeItem(key));
    }

    has(key: string): boolean {
        return localStorage.getItem(this.getKey(key)) !== null;
    }

    keys(): string[] {
        return Object.keys(localStorage)
            .filter((key) => key.startsWith(this.prefix))
            .map((key) => key.slice(this.prefix.length));
    }
}

export const storage = new Storage();

// ============================================================================
// SESSION STORAGE WRAPPER
// ============================================================================

class SessionStorage extends Storage {
    constructor(options: StorageOptions = {}) {
        super({ prefix: 'wellnexus_session_', ...options });
    }

    get<T>(key: string, defaultValue: T): T;
    get<T>(key: string): T | null;
    get<T>(key: string, defaultValue?: T): T | null {
        try {
            const item = sessionStorage.getItem(`wellnexus_session_${key}`);
            if (item === null) return defaultValue ?? null;
            return JSON.parse(item) as T;
        } catch {
            return defaultValue ?? null;
        }
    }

    set<T>(key: string, value: T): void {
        try {
            sessionStorage.setItem(`wellnexus_session_${key}`, JSON.stringify(value));
        } catch (error) {
            storeLogger.error('Session storage set error', error);
        }
    }

    remove(key: string): void {
        sessionStorage.removeItem(`wellnexus_session_${key}`);
    }
}

export const sessionStore = new SessionStorage();

// ============================================================================
// INDEXED DB WRAPPER (for larger data)
// ============================================================================

interface IDBOptions {
    dbName: string;
    storeName: string;
    version?: number;
}

class IndexedDBStore {
    private dbName: string;
    private storeName: string;
    private version: number;
    private db: IDBDatabase | null = null;

    constructor(options: IDBOptions) {
        this.dbName = options.dbName;
        this.storeName = options.storeName;
        this.version = options.version || 1;
    }

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
        });
    }

    async get<T>(id: string): Promise<T | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result?.data ?? null);
        });
    }

    async set<T>(id: string, data: T): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put({ id, data, updatedAt: Date.now() });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async delete(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async clear(): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

export const idbStore = new IndexedDBStore({
    dbName: 'wellnexus',
    storeName: 'cache',
});
