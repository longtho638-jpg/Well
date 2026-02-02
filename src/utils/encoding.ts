/**
 * Encoding Utilities
 * Phase 15: Regex and Config
 */

// ============================================================================
// BASE64
// ============================================================================

export function base64Encode(text: string): string {
    return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g,
        (_, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
}

export function base64Decode(encoded: string): string {
    return decodeURIComponent(atob(encoded).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
}

export function isBase64(str: string): boolean {
    try {
        return btoa(atob(str)) === str;
    } catch {
        return false;
    }
}

// ============================================================================
// URL ENCODING
// ============================================================================

export function urlEncode(obj: Record<string, string | number | boolean>): string {
    return Object.entries(obj)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

export function urlDecode(str: string): Record<string, string> {
    const result: Record<string, string> = {};
    const params = new URLSearchParams(str);
    params.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

// ============================================================================
// HASH FUNCTIONS
// ============================================================================

/**
 * SHA-256 hash with Safari fallback
 * Safari-safe: uses simple hash for non-HTTPS contexts
 */
export async function sha256(message: string): Promise<string> {
    // Try crypto.subtle first (requires HTTPS in Safari)
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.warn('crypto.subtle.digest failed, using fallback hash:', error);
        }
    }

    // Fallback: simple hash (not cryptographically secure, but works)
    return simpleHashString(message);
}

/**
 * Simple string hash fallback for Safari non-HTTPS contexts
 */
function simpleHashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Pad to 64 hex characters (256 bits) like SHA-256
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return hexHash.repeat(8).substring(0, 64);
}

export function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export function hashCode(str: string): string {
    return simpleHash(str).toString(36);
}

// ============================================================================
// STRING COMPRESSION (LZ-string style - simple)
// ============================================================================

export function compress(str: string): string {
    try {
        return btoa(encodeURIComponent(str));
    } catch {
        return str;
    }
}

export function decompress(compressed: string): string {
    try {
        return decodeURIComponent(atob(compressed));
    } catch {
        return compressed;
    }
}

// ============================================================================
// HEX ENCODING
// ============================================================================

export function stringToHex(str: string): string {
    return Array.from(str)
        .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
}

export function hexToString(hex: string): string {
    const hexPairs = hex.match(/.{1,2}/g) || [];
    return hexPairs.map(pair => String.fromCharCode(parseInt(pair, 16))).join('');
}

// ============================================================================
// JWT UTILITIES (decode only, not verify)
// ============================================================================

export function parseJwt(token: string): Record<string, unknown> | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}
