/**
 * Shared Supabase Mock Utilities
 * Reusable mock builders for Supabase client with proper method chaining
 */

import { vi } from 'vitest'

/**
 * Create a mock Supabase query builder that supports method chaining
 * Supports: .from().select().eq().gte().lt().single() etc.
 *
 * @param response - Optional response to return for .then() and execution methods
 */
export const createMockQuery = (response?: { data?: any; error?: any }) => {
  const defaultResponse = response || { data: null, error: null }

  const mock: any = {
    // Query methods - return this for chaining
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),

    // Filter methods - return this for chaining
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),

    // Transform methods - return this for chaining
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    withSchema: vi.fn().mockReturnThis(),

    // Execution methods - return response
    single: vi.fn().mockResolvedValue(defaultResponse),
    maybeSingle: vi.fn().mockResolvedValue(defaultResponse),
  }

  // Properly implement Promise interface for async/await support
  Object.defineProperty(mock, 'then', {
    writable: true,
    configurable: true,
    value: function then(resolve: any, reject: any) {
      return Promise.resolve(defaultResponse).then(resolve, reject)
    }
  })

  Object.defineProperty(mock, 'catch', {
    writable: true,
    configurable: true,
    value: function catch_(reject: any) {
      return Promise.resolve(defaultResponse).catch(reject)
    }
  })

  Object.defineProperty(mock, 'finally', {
    writable: true,
    configurable: true,
    value: function finally_(callback: any) {
      return Promise.resolve(defaultResponse).finally(callback)
    }
  })

  return mock
}

/**
 * Create a mock Supabase client with proper method chaining support
 * Optional tableResponses map allows different responses per table
 */
export const createMockSupabase = (tableResponses?: Record<string, any>) => {
  const mock: any = {
    from: vi.fn((table: string) => {
      if (tableResponses?.[table]) {
        return tableResponses[table]
      }
      return createMockQuery()
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  }
  return mock
}

/**
 * Create a query builder with custom chained response
 * Usage: createChainedQuery({ select: { data: { plan_slug: 'basic' } } })
 */
export const createChainedQuery = (response: { data?: any; error?: any }) => {
  const mock: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(response),
    maybeSingle: vi.fn().mockResolvedValue(response),
  }
  return mock
}
