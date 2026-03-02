/**
 * Obfuscated LocalStorage Wrapper — base64+encodeURIComponent secure storage with prefixed keys
 */

const ENCRYPTION_KEY = 'wellnexus_secure_v1';

/**
 * Encode sensitive data (basic obfuscation — not true encryption)
 */
export function encodeSecure(data: string): string {
    return btoa(encodeURIComponent(data));
}

/**
 * Decode secure data
 */
export function decodeSecure(encoded: string): string | null {
    try {
        return decodeURIComponent(atob(encoded));
    } catch {
        return null;
    }
}

/**
 * Secure localStorage wrapper with obfuscated values
 */
export const secureStorage = {
    set(key: string, value: unknown): void {
        const encoded = encodeSecure(JSON.stringify(value));
        localStorage.setItem(`${ENCRYPTION_KEY}_${key}`, encoded);
    },

    get<T>(key: string): T | null {
        const encoded = localStorage.getItem(`${ENCRYPTION_KEY}_${key}`);
        if (!encoded) return null;

        const decoded = decodeSecure(encoded);
        if (!decoded) return null;

        try {
            return JSON.parse(decoded) as T;
        } catch {
            return null;
        }
    },

    remove(key: string): void {
        localStorage.removeItem(`${ENCRYPTION_KEY}_${key}`);
    },
};
