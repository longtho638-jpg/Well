/**
 * Vibe Supabase SDK — Typed Query Helpers
 *
 * Eliminates repetitive Supabase query patterns across services.
 * Provides typed wrappers for common operations: fetchOne, fetchMany,
 * insertOne, updateWhere, rpcCall, invokeFunction.
 *
 * All functions accept a SupabaseLike client — no singleton capture.
 */

// ─── Generic Supabase interface (avoids hard @supabase/supabase-js dep) ──

interface SupabaseQueryBuilder {
  select: (columns?: string, options?: { count?: string }) => SupabaseQueryBuilder;
  eq: (column: string, value: string | number | boolean) => SupabaseQueryBuilder;
  in: (column: string, values: Array<string | number>) => SupabaseQueryBuilder;
  gt: (column: string, value: string | number) => SupabaseQueryBuilder;
  insert: (row: Record<string, unknown> | Record<string, unknown>[], options?: { count?: string }) => SupabaseQueryBuilder;
  update: (updates: Record<string, unknown>) => SupabaseQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  range: (from: number, to: number) => SupabaseQueryBuilder;
  single: () => Promise<{ data: unknown; error: { message: string } | null }>;
  maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
  then: (resolve: (value: { data: unknown[]; error: { message: string } | null; count: number | null }) => void) => void;
}

export interface SupabaseLike {
  from: (table: string) => SupabaseQueryBuilder;
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  functions: { invoke: (name: string, options: { body: Record<string, unknown> }) => Promise<{ data: unknown; error: { message: string } | null }> };
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
}

// ─── Result Types ───────────────────────────────────────────────

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

export interface QueryListResult<T> {
  data: T[];
  error: string | null;
  count: number | null;
}

// ─── Typed Query Helpers ────────────────────────────────────────

/** Fetch single row with typed result */
export async function fetchOne<T>(
  supabase: SupabaseLike,
  table: string,
  column: string,
  value: string | number,
  select = '*',
): Promise<QueryResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(column, value)
    .single();

  return {
    data: data as T | null,
    error: error?.message ?? null,
  };
}

/** Fetch multiple rows with optional pagination */
export async function fetchMany<T>(
  supabase: SupabaseLike,
  table: string,
  options: {
    select?: string;
    filters?: Record<string, string | number | boolean>;
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<QueryListResult<T>> {
  const {
    select = '*',
    filters = {},
    orderBy,
    ascending = false,
    limit,
    offset,
  } = options;

  let query = supabase.from(table).select(select, { count: 'exact' });

  for (const [key, val] of Object.entries(filters)) {
    query = query.eq(key, val);
  }

  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  if (offset !== undefined) {
    query = query.range(offset, offset + (limit ?? 10) - 1);
  }

  const { data, error, count } = await (query as unknown as Promise<{ data: unknown[]; error: { message: string } | null; count: number | null }>);

  return {
    data: (data as T[]) ?? [],
    error: error?.message ?? null,
    count: count ?? null,
  };
}

/** Insert single row and return it */
export async function insertOne<T>(
  supabase: SupabaseLike,
  table: string,
  row: Record<string, unknown>,
  select = '*',
): Promise<QueryResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select(select)
    .single();

  return {
    data: data as T | null,
    error: error?.message ?? null,
  };
}

/** Atomic update with filters */
export async function updateWhere<T>(
  supabase: SupabaseLike,
  table: string,
  updates: Record<string, unknown>,
  filters: Record<string, string | number>,
  select = '*',
): Promise<QueryResult<T>> {
  let query = supabase.from(table).update(updates);

  for (const [key, val] of Object.entries(filters)) {
    query = query.eq(key, val);
  }

  const { data, error } = await query.select(select).single();

  return {
    data: data as T | null,
    error: error?.message ?? null,
  };
}

/** Call Postgres RPC function with typed result */
export async function rpcCall<T>(
  supabase: SupabaseLike,
  functionName: string,
  params: Record<string, unknown> = {},
): Promise<QueryResult<T>> {
  const { data, error } = await supabase.rpc(functionName, params);

  return {
    data: data as T | null,
    error: error?.message ?? null,
  };
}

/** Invoke Supabase Edge Function */
export async function invokeFunction<T>(
  supabase: SupabaseLike,
  name: string,
  body: Record<string, unknown>,
): Promise<QueryResult<T>> {
  const { data, error } = await supabase.functions.invoke(name, { body });

  return {
    data: data as T | null,
    error: error?.message ?? null,
  };
}

/** Get current authenticated user ID or null */
export async function getCurrentUserId(
  supabase: SupabaseLike,
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
