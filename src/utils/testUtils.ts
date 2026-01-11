/**
 * Testing Utilities
 * Phase 7: Developer Experience
 */

import React, { ReactElement } from 'react';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate random ID
 */
export function generateId(prefix = 'id'): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Generate random Vietnamese name
 */
export function generateName(): string {
    const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ'];
    const middleNames = ['Văn', 'Thị', 'Minh', 'Hoàng', 'Thanh', 'Kim', 'Ngọc', 'Anh'];
    const lastNames = ['An', 'Bình', 'Châu', 'Dũng', 'Hùng', 'Lan', 'Mai', 'Nam', 'Phúc', 'Quang'];

    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

/**
 * Generate random email
 */
export function generateEmail(name?: string): string {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'wellnexus.vn'];
    const slug = (name || generateName()).toLowerCase().replace(/\s+/g, '.');
    return `${slug}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

/**
 * Generate random phone number (Vietnam format)
 */
export function generatePhone(): string {
    const prefixes = ['090', '091', '093', '094', '096', '097', '098', '032', '033', '034'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `${prefix}${suffix}`;
}

/**
 * Generate random amount in VND
 */
export function generateAmount(min = 100000, max = 10000000): number {
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Generate random date within range
 */
export function generateDate(daysBack = 30): Date {
    const now = new Date();
    const pastDate = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
    return pastDate;
}

// ============================================================================
// MOCK USER
// ============================================================================

export interface MockUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    rank: number;
    totalSales: number;
    teamVolume: number;
    shopBalance: number;
    growBalance: number;
}

export function generateMockUser(overrides: Partial<MockUser> = {}): MockUser {
    const name = generateName();
    return {
        id: generateId('user'),
        name,
        email: generateEmail(name),
        phone: generatePhone(),
        rank: Math.floor(Math.random() * 8) + 1,
        totalSales: generateAmount(0, 50000000),
        teamVolume: generateAmount(0, 100000000),
        shopBalance: generateAmount(0, 5000000),
        growBalance: Math.floor(Math.random() * 10000),
        ...overrides,
    };
}

// ============================================================================
// MOCK PRODUCT
// ============================================================================

export interface MockProduct {
    id: string;
    name: string;
    price: number;
    bonusRevenue: number;
    stock: number;
    salesCount: number;
}

export function generateMockProduct(overrides: Partial<MockProduct> = {}): MockProduct {
    const names = ['ANIMA 119', 'Immune Boost', 'Vitality Plus', 'Energy Max', 'Sleep Well'];
    return {
        id: generateId('prod'),
        name: names[Math.floor(Math.random() * names.length)],
        price: generateAmount(500000, 2000000),
        bonusRevenue: generateAmount(100000, 500000),
        stock: Math.floor(Math.random() * 100) + 10,
        salesCount: Math.floor(Math.random() * 500),
        ...overrides,
    };
}

// ============================================================================
// MOCK TRANSACTION
// ============================================================================

export interface MockTransaction {
    id: string;
    userId: string;
    amount: number;
    type: 'Direct Sale' | 'Team Volume Bonus' | 'Withdrawal';
    status: 'pending' | 'completed' | 'failed';
    date: string;
}

export function generateMockTransaction(overrides: Partial<MockTransaction> = {}): MockTransaction {
    const types: MockTransaction['type'][] = ['Direct Sale', 'Team Volume Bonus', 'Withdrawal'];
    const statuses: MockTransaction['status'][] = ['pending', 'completed', 'failed'];

    return {
        id: generateId('tx'),
        userId: generateId('user'),
        amount: generateAmount(),
        type: types[Math.floor(Math.random() * types.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        date: generateDate().toISOString().split('T')[0],
        ...overrides,
    };
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wait for async operations
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for condition to be true
 */
export async function waitFor(
    condition: () => boolean,
    options = { timeout: 5000, interval: 100 }
): Promise<void> {
    const startTime = Date.now();

    while (!condition()) {
        if (Date.now() - startTime > options.timeout) {
            throw new Error('waitFor timeout');
        }
        await wait(options.interval);
    }
}

/**
 * Create spy function
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(
    implementation?: T
): T & { calls: Parameters<T>[]; callCount: number } {
    const calls: Parameters<T>[] = [];

    const spy = ((...args: Parameters<T>) => {
        calls.push(args);
        return implementation?.(...args);
    }) as T & { calls: Parameters<T>[]; callCount: number };

    Object.defineProperty(spy, 'calls', { get: () => calls });
    Object.defineProperty(spy, 'callCount', { get: () => calls.length });

    return spy;
}
