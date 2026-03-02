/**
 * CSRF Token Generator and Session Store — generates and persists CSRF tokens in sessionStorage
 */

/**
 * Generate CSRF token (Safari-safe with Math.random fallback)
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);

    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
        try {
            crypto.getRandomValues(array);
        } catch {
            for (let i = 0; i < 32; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
    } else {
        for (let i = 0; i < 32; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }

    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store and retrieve CSRF token from sessionStorage
 */
export const csrfToken = {
    get(): string {
        let token = sessionStorage.getItem('csrf_token');
        if (!token) {
            token = generateCsrfToken();
            sessionStorage.setItem('csrf_token', token);
        }
        return token;
    },
    refresh(): string {
        const token = generateCsrfToken();
        sessionStorage.setItem('csrf_token', token);
        return token;
    },
};
