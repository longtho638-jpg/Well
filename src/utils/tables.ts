/**
 * Table Utilities
 * Phase 17: Forms and Tables
 */

// ============================================================================
// SORTING
// ============================================================================

export type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
    key: keyof T;
    direction: SortDirection;
}

export function sortBy<T>(
    items: T[],
    key: keyof T,
    direction: SortDirection = 'asc'
): T[] {
    return [...items].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return direction === 'asc' ? comparison : -comparison;
    });
}

export function multiSort<T>(items: T[], sorts: SortConfig<T>[]): T[] {
    return [...items].sort((a, b) => {
        for (const { key, direction } of sorts) {
            const aVal = a[key];
            const bVal = b[key];

            if (aVal === bVal) continue;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal < bVal ? -1 : 1;
            return direction === 'asc' ? comparison : -comparison;
        }
        return 0;
    });
}

// ============================================================================
// FILTERING
// ============================================================================

export function filterBySearch<T>(
    items: T[],
    searchTerm: string,
    keys: (keyof T)[]
): T[] {
    if (!searchTerm.trim()) return items;

    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(item =>
        keys.some(key => {
            const value = item[key];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(lowerSearch);
        })
    );
}

export function filterByField<T>(
    items: T[],
    field: keyof T,
    value: T[keyof T] | T[keyof T][]
): T[] {
    if (value === null || value === undefined) return items;

    if (Array.isArray(value)) {
        return items.filter(item => value.includes(item[field]));
    }

    return items.filter(item => item[field] === value);
}

// ============================================================================
// PAGINATION
// ============================================================================

interface PaginationResult<T> {
    data: T[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export function paginate<T>(
    items: T[],
    page: number,
    pageSize: number
): PaginationResult<T> {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (currentPage - 1) * pageSize;
    const data = items.slice(startIndex, startIndex + pageSize);

    return {
        data,
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
    };
}

export function getPageNumbers(
    currentPage: number,
    totalPages: number,
    maxVisible = 5
): (number | '...')[] {
    if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [];
    const halfVisible = Math.floor(maxVisible / 2);

    if (currentPage <= halfVisible + 1) {
        for (let i = 1; i <= maxVisible - 1; i++) pages.push(i);
        pages.push('...', totalPages);
    } else if (currentPage >= totalPages - halfVisible) {
        pages.push(1, '...');
        for (let i = totalPages - maxVisible + 2; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1, '...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...', totalPages);
    }

    return pages;
}

// ============================================================================
// TABLE STATE
// ============================================================================

export interface TableState<T> {
    sort: SortConfig<T> | null;
    search: string;
    filters: Partial<Record<keyof T, unknown>>;
    page: number;
    pageSize: number;
}

export function createTableState<T>(pageSize = 10): TableState<T> {
    return {
        sort: null,
        search: '',
        filters: {},
        page: 1,
        pageSize,
    };
}

export function applyTableState<T>(
    items: T[],
    state: TableState<T>,
    searchKeys: (keyof T)[]
): PaginationResult<T> {
    let result = items;

    // Apply search
    if (state.search) {
        result = filterBySearch(result, state.search, searchKeys);
    }

    // Apply filters
    for (const [key, value] of Object.entries(state.filters)) {
        if (value !== undefined && value !== null && value !== '') {
            result = filterByField(result, key as keyof T, value as T[keyof T]);
        }
    }

    // Apply sort
    if (state.sort) {
        result = sortBy(result, state.sort.key, state.sort.direction);
    }

    // Apply pagination
    return paginate(result, state.page, state.pageSize);
}
