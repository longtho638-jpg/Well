/**
 * Secure Token Storage — in-memory primary store with obfuscated localStorage fallback for page refresh persistence
 */

import { encryptSimple, decryptSimple } from './secure-token-xor-obfuscation-helpers';

class SecureTokenStorage {
    private inMemoryTokens: Record<string, string | null> = {};
    private readonly STORAGE_PREFIX = 'wellnexus_secure_';

    static instance: SecureTokenStorage;

    constructor() {
        this.inMemoryTokens = {
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
        };
        this.cleanupLegacyStorage();
    }

    static getInstance(): SecureTokenStorage {
        if (!SecureTokenStorage.instance) {
            SecureTokenStorage.instance = new SecureTokenStorage();
        }
        return SecureTokenStorage.instance;
    }

    private cleanupLegacyStorage() {
        try {
            ['accessToken', 'refreshToken', 'expiresAt'].forEach(key => {
                const fullKey = this.getKey(key);
                if (sessionStorage.getItem(fullKey)) {
                    sessionStorage.removeItem(fullKey);
                }
            });
        } catch {
            // Ignore storage errors
        }
    }

    // --- Public token API ---

    public setAccessToken(token: string) {
        this.inMemoryTokens.accessToken = token;
        this.persistToLocalStorage('accessToken', token);
    }

    public getAccessToken(): string | null {
        return this.inMemoryTokens.accessToken ?? this.recoverFromLocalStorage('accessToken');
    }

    public setRefreshToken(token: string) {
        this.inMemoryTokens.refreshToken = token;
        this.persistToLocalStorage('refreshToken', token);
    }

    public getRefreshToken(): string | null {
        return this.inMemoryTokens.refreshToken ?? this.recoverFromLocalStorage('refreshToken');
    }

    public setExpiresAt(expiresAt: number) {
        const val = expiresAt.toString();
        this.inMemoryTokens.expiresAt = val;
        this.persistToLocalStorage('expiresAt', val);
    }

    public getExpiresAt(): number | null {
        if (this.inMemoryTokens.expiresAt) {
            return parseInt(this.inMemoryTokens.expiresAt, 10);
        }
        const recovered = this.recoverFromLocalStorage('expiresAt');
        return recovered ? parseInt(recovered, 10) : null;
    }

    public clear() {
        this.inMemoryTokens = { accessToken: null, refreshToken: null, expiresAt: null };
        localStorage.removeItem(this.getKey('accessToken'));
        localStorage.removeItem(this.getKey('refreshToken'));
        localStorage.removeItem(this.getKey('expiresAt'));
    }

    // --- Generic storage interface (for Supabase/external adapters) ---

    public setItem(key: string, value: string): void {
        this.inMemoryTokens[key] = value;
        this.persistToLocalStorage(key, value);
    }

    public getItem(key: string): string | null {
        if (this.inMemoryTokens[key] !== undefined) {
            return this.inMemoryTokens[key];
        }
        const val = this.recoverFromLocalStorage(key);
        if (val !== null) this.inMemoryTokens[key] = val;
        return val;
    }

    public removeItem(key: string): void {
        delete this.inMemoryTokens[key];
        localStorage.removeItem(this.getKey(key));
    }

    // --- Internal helpers ---

    private getKey(key: string): string {
        return `${this.STORAGE_PREFIX}${key}`;
    }

    private persistToLocalStorage(key: string, value: string) {
        try {
            localStorage.setItem(this.getKey(key), encryptSimple(value));
        } catch {
            // localStorage unavailable — skip backup
        }
    }

    private recoverFromLocalStorage(key: string): string | null {
        try {
            const stored = localStorage.getItem(this.getKey(key));
            if (!stored) return null;
            const decrypted = decryptSimple(stored);
            this.inMemoryTokens[key as keyof typeof this.inMemoryTokens] = decrypted;
            return decrypted;
        } catch {
            return null;
        }
    }
}

export const secureTokenStorage = SecureTokenStorage.getInstance();
