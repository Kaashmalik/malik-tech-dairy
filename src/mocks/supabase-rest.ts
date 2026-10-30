/**
 * Minimal chainable fake of the Supabase/PostgREST query builder for unit tests.
 * Records every call so tests can assert tenant scoping, and resolves to the
 * result queued for that table/operation.
 *
 *   const fake = createSupabaseFake();
 *   jest.mock('@/lib/supabase/server', () => ({ getSupabaseClient: () => fake.client }));
 *   fake.respond('notifications', 'insert', { data: { id: 'n1' } });
 */
type Op = 'select' | 'insert' | 'upsert' | 'update' | 'delete';

export interface FakeResult {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
}

export interface RecordedQuery {
  table: string;
  op: Op;
  payload?: unknown;
  calls: Array<[string, ...unknown[]]>;
}

export function createSupabaseFake() {
  const queries: RecordedQuery[] = [];
  const responses = new Map<string, FakeResult[]>();

  function next(table: string, op: Op): FakeResult {
    const queue = responses.get(`${table}:${op}`);
    return queue?.length ? (queue.length > 1 ? queue.shift()! : queue[0]) : { data: [] };
  }

  function builder(table: string, op: Op, payload?: unknown) {
    const record: RecordedQuery = { table, op, payload, calls: [] };
    queries.push(record);
    const resolve = () => {
      const r = next(table, op);
      return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
    };
    const proxy: Record<string, unknown> = new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === 'then') {
            return (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
              Promise.resolve(resolve()).then(onFulfilled, onRejected);
          }
          return (...args: unknown[]) => {
            record.calls.push([prop, ...args]);
            return proxy;
          };
        },
      }
    );
    return proxy;
  }

  const client = {
    from: (table: string) => ({
      select: (...args: unknown[]) => {
        const b = builder(table, 'select');
        (b.select as (...a: unknown[]) => unknown)(...args);
        return b;
      },
      insert: (rows: unknown) => builder(table, 'insert', rows),
      upsert: (rows: unknown, opts?: unknown) => builder(table, 'upsert', { rows, opts }),
      update: (values: unknown) => builder(table, 'update', values),
      delete: () => builder(table, 'delete'),
    }),
  };

  return {
    client,
    queries,
    respond(table: string, op: Op, ...results: FakeResult[]) {
      responses.set(`${table}:${op}`, results);
    },
    reset() {
      queries.length = 0;
      responses.clear();
    },
    /** All filter calls of a recorded query, e.g. [['eq','tenant_id','t1'], ...] */
    filters(q: RecordedQuery) {
      return q.calls.filter(([name]) =>
        ['eq', 'neq', 'in', 'is', 'or', 'gte', 'lte'].includes(name)
      );
    },
  };
}
