// Tenant-scoped Supabase REST access (server-only).
//
// Why REST: direct Postgres (Drizzle/postgres-js) is unreliable from Vercel
// serverless; PostgREST over HTTPS is not. Why scoped: the service-role key bypasses
// RLS, so tenant isolation must be enforced here - every read/update/delete is
// filtered by tenant_id and every insert is stamped with it.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = SupabaseClient<any, 'public', any>;

export function db(): Db {
  return getSupabaseClient() as Db;
}

export class DbError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'DbError';
  }
}

interface PgResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

/** Throw on PostgREST errors instead of silently continuing with `data: null`. */
export function unwrap<T>(result: PgResult<T>, context: string): T {
  if (result.error) {
    throw new DbError(`${context}: ${result.error.message}`, result.error.code);
  }
  return result.data as T;
}

type Row = Record<string, unknown>;

function stampTenant<T extends Row>(
  tenantId: string,
  rows: T | T[]
): Array<T & { tenant_id: string }> {
  return (Array.isArray(rows) ? rows : [rows]).map(r => ({ ...r, tenant_id: tenantId }));
}

function withoutTenant<T extends Row>(values: T): Omit<T, 'tenant_id'> {
  // tenant_id is immutable: never let an update move a row to another farm

  const { tenant_id: _ignored, ...rest } = values;
  return rest;
}

/**
 * Query builder bound to one tenant. Usage:
 *   const t = tenantDb(ctx.tenantId);
 *   const { data, error } = await t.select('animals', 'id, tag').eq('status', 'active');
 */
export function tenantDb(tenantId: string) {
  if (!tenantId) {
    throw new DbError('tenantDb requires a tenantId');
  }
  const client = db();
  return {
    tenantId,
    select: (table: string, columns = '*', options?: { count?: 'exact'; head?: boolean }) =>
      client.from(table).select(columns, options).eq('tenant_id', tenantId),
    insert: <T extends Row>(table: string, rows: T | T[]) =>
      client.from(table).insert(stampTenant(tenantId, rows)),
    upsert: <T extends Row>(table: string, rows: T | T[], options?: { onConflict?: string }) =>
      client.from(table).upsert(stampTenant(tenantId, rows), options),
    update: <T extends Row>(table: string, values: T) =>
      client.from(table).update(withoutTenant(values)).eq('tenant_id', tenantId),
    delete: (table: string) => client.from(table).delete().eq('tenant_id', tenantId),
  };
}

export type TenantDb = ReturnType<typeof tenantDb>;

/** snake_case DB row -> camelCase object (keeps Drizzle-shaped return values stable). */
export function toCamel<T = Row>(row: Row | null | undefined): T | null {
  if (!row) return null;
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return out as T;
}

/** camelCase input -> snake_case DB columns; undefined values are dropped. */
export function toSnake(obj: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    out[key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)] = value;
  }
  return out;
}

const PAGE_SIZE = 1000; // PostgREST default max-rows

/**
 * Read every row of a query in pages, so aggregates are not silently truncated at
 * PostgREST's row cap. `build` must return a fresh, fully filtered + ordered query.
 */
export async function fetchAllRows<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: () => any,
  context: string,
  maxRows = 50_000
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < maxRows; from += PAGE_SIZE) {
    const page = unwrap(await build().range(from, from + PAGE_SIZE - 1), context) as T[];
    rows.push(...(page || []));
    if (!page || page.length < PAGE_SIZE) break;
  }
  return rows;
}

/** All live (not soft-deleted) farms - for platform-wide cron jobs. */
export async function listActiveTenants(): Promise<Array<{ id: string; farm_name: string }>> {
  return fetchAllRows<{ id: string; farm_name: string }>(
    () => db().from('tenants').select('id, farm_name').is('deleted_at', null).order('id'),
    'List active tenants'
  );
}
