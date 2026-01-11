/**
 * URL Utilities
 * Phase 10: Forms and Responsive
 */

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * Parse query string to object
 */
export function parseQueryString(search: string): Record<string, string> {
    if (!search || search === '?') return {};

    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const result: Record<string, string> = {};

    params.forEach((value, key) => {
        result[key] = value;
    });

    return result;
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });

    const result = searchParams.toString();
    return result ? `?${result}` : '';
}

/**
 * Update query params immutably
 */
export function updateQueryParams(
    currentSearch: string,
    updates: Record<string, string | number | boolean | undefined | null>
): string {
    const current = parseQueryString(currentSearch);
    const merged = { ...current, ...updates };

    // Remove null/undefined values
    Object.keys(merged).forEach(key => {
        if (merged[key] === undefined || merged[key] === null) {
            delete merged[key];
        }
    });

    return buildQueryString(merged);
}

// ============================================================================
// URL MANIPULATION
// ============================================================================

/**
 * Join URL paths safely
 */
export function joinPaths(...paths: string[]): string {
    return paths
        .map((path, index) => {
            if (index === 0) {
                return path.replace(/\/+$/, '');
            }
            return path.replace(/^\/+|\/+$/g, '');
        })
        .filter(Boolean)
        .join('/');
}

/**
 * Get base URL from full URL
 */
export function getBaseUrl(url: string): string {
    try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return '';
    }
}

/**
 * Check if URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

/**
 * Check if URL is external
 */
export function isExternalUrl(url: string): boolean {
    if (!isAbsoluteUrl(url)) return false;
    try {
        const urlHost = new URL(url).host;
        const currentHost = typeof window !== 'undefined' ? window.location.host : '';
        return urlHost !== currentHost;
    } catch {
        return false;
    }
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Build app route with params
 */
export function buildRoute(path: string, params: Record<string, string | number> = {}): string {
    let route = path;

    Object.entries(params).forEach(([key, value]) => {
        route = route.replace(`:${key}`, String(value));
    });

    return route;
}

/**
 * Get current path without query
 */
export function getCurrentPath(): string {
    return typeof window !== 'undefined' ? window.location.pathname : '';
}

/**
 * Check if path matches pattern
 */
export function matchPath(pattern: string, path: string): boolean {
    const regex = new RegExp(
        '^' + pattern.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$'
    );
    return regex.test(path);
}

// ============================================================================
// HASH UTILITIES
// ============================================================================

/**
 * Get hash from URL
 */
export function getHash(): string {
    return typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
}

/**
 * Set hash in URL
 */
export function setHash(hash: string): void {
    if (typeof window !== 'undefined') {
        window.location.hash = hash;
    }
}

/**
 * Scroll to element by hash
 */
export function scrollToHash(hash: string): void {
    const element = document.getElementById(hash);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}
