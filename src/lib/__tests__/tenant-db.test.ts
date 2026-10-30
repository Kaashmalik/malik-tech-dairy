/**
 * @jest-environment node
 */
import { createSupabaseFake } from '@/mocks/supabase-rest';

const fake = createSupabaseFake();
jest.mock('@/lib/supabase/server', () => ({ getSupabaseClient: () => fake.client }));
jest.mock('@/lib/reports/pdf', () => ({ generatePDFReport: jest.fn() }));
jest.mock('@/lib/audit', () => ({ logAuditEvent: jest.fn() }));

import { fetchAllRows, tenantDb, toCamel, toSnake } from '@/lib/supabase/tenant-db';
import { csvCell, toCsv } from '@/lib/services/reports/report.service';
import { sanitizeSearchTerm } from '@/lib/services/animals/animal.service';

beforeEach(() => fake.reset());

describe('tenantDb', () => {
  it('scopes selects, updates and deletes by tenant_id', async () => {
    const t = tenantDb('farm_a');
    await t.select('animals').eq('id', 'x');
    await t.update('animals', { name: 'n' }).eq('id', 'x');
    await t.delete('animals').eq('id', 'x');
    for (const q of fake.queries) {
      expect(fake.filters(q)[0]).toEqual(['eq', 'tenant_id', 'farm_a']);
    }
  });

  it('stamps inserts with the tenant and overrides a spoofed tenant_id', async () => {
    await tenantDb('farm_a').insert('animals', [{ tag: '1' }, { tag: '2', tenant_id: 'farm_b' }]);
    expect(fake.queries[0].payload).toEqual([
      { tag: '1', tenant_id: 'farm_a' },
      { tag: '2', tenant_id: 'farm_a' },
    ]);
  });

  it('never lets an update move a row to another tenant', async () => {
    await tenantDb('farm_a').update('animals', { name: 'n', tenant_id: 'farm_b' });
    expect(fake.queries[0].payload).toEqual({ name: 'n' });
  });

  it('refuses to build a query without a tenant', () => {
    expect(() => tenantDb('')).toThrow(/tenantId/);
  });
});

describe('fetchAllRows', () => {
  it('pages past the 1000-row cap', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ i }));
    fake.respond('milk_logs', 'select', { data: full }, { data: [{ i: 1000 }] });
    const rows = await fetchAllRows(() => tenantDb('farm_a').select('milk_logs'), 'test');
    expect(rows).toHaveLength(1001);
    expect(fake.queries).toHaveLength(2);
  });
});

describe('case mapping', () => {
  it('round-trips snake and camel keys and drops undefined', () => {
    expect(toCamel({ date_of_birth: 'd', tenant_id: 't' })).toEqual({
      dateOfBirth: 'd',
      tenantId: 't',
    });
    expect(toSnake({ dateOfBirth: 'd', skip: undefined })).toEqual({ date_of_birth: 'd' });
  });
});

describe('CSV export', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell(null)).toBe('');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell(-5)).toBe('-5'); // numbers are not formulas
  });

  it('builds a header row plus data rows', () => {
    expect(toCsv(['A', 'B'], [[1, 'x']])).toBe('A,B\n1,x');
  });
});

describe('sanitizeSearchTerm', () => {
  it('strips PostgREST filter syntax but keeps Urdu and tags', () => {
    expect(sanitizeSearchTerm('PK-102,tenant_id.neq.x)')).toBe('PK-102tenant_id.neq.x');
    expect(sanitizeSearchTerm('  گائے ')).toBe('گائے');
  });
});
