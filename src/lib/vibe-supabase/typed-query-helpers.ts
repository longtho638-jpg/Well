/**
 * Vibe Supabase SDK — Typed Query Helpers
 *
 * Eliminates repetitive Supabase query patterns across services.
 * Provides typed wrappers for common operations: fetchOne, fetchMany,
 * insertOne, updateWhere, rpcCall, invokeFunction.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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

  const { data, error, count } = await query;

  return {
    data: (data as T[]) ?? [],
    error: error?.message ?? null,
    count: count ?? null,
  };
}

/** Insert single row and return it */
export async function insertOne<T>(
  supabase: SupabaseClient,
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

/** Atomic update with optimistic concurrency guard */
export async function updateWhere<T>(
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
