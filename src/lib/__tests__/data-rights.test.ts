/**
 * @jest-environment node
 */
import JSZip from 'jszip';
import { createSupabaseFake } from '@/mocks/supabase-rest';

const fake = createSupabaseFake();
jest.mock('@/lib/supabase/server', () => ({ getSupabaseClient: () => fake.client }));
const deleteOrganization = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({ organizations: { deleteOrganization } }),
}));
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { deleteTenant, exportTenantData, TENANT_DATA_TABLES } from '@/lib/tenant/data-rights';

beforeEach(() => {
  fake.reset();
  deleteOrganization.mockReset();
});

describe('exportTenantData', () => {
  it('exports every table scoped to the farm and skips tables that do not exist', async () => {
    fake.respond('tenants', 'select', { data: { id: 'farm_a', farm_name: 'Malik' } });
    fake.respond('animals', 'select', { data: [{ id: 'a1' }, { id: 'a2' }] });
    fake.respond('heat_detections', 'select', {
      error: { message: 'relation does not exist', code: '42P01' },
    });

    const result = await exportTenantData('farm_a');

    expect(result.counts.animals).toBe(2);
    expect(result.skipped).toEqual(['heat_detections']);
    expect(result.counts).not.toHaveProperty('api_keys');

    const zip = await JSZip.loadAsync(result.zip);
    expect(Object.keys(zip.files)).toEqual(
      expect.arrayContaining(['farm.json', 'manifest.json', 'animals.json'])
    );
    expect(JSON.parse(await zip.file('animals.json')!.async('string'))).toHaveLength(2);

    const tableQueries = fake.queries.filter(
      q => q.op === 'select' && (TENANT_DATA_TABLES as readonly string[]).includes(q.table)
    );
    for (const q of tableQueries) {
      expect(fake.filters(q)[0]).toEqual(['eq', 'tenant_id', 'farm_a']);
    }
  });

  it('fails loudly on real database errors', async () => {
    fake.respond('animals', 'select', { error: { message: 'timeout', code: '57014' } });
    await expect(exportTenantData('farm_a')).rejects.toThrow(/timeout/);
  });
});

describe('deleteTenant', () => {
  it('cancels billing, soft-deletes, deactivates members and removes the Clerk org', async () => {
    await deleteTenant('farm_a');

    const tenantUpdate = fake.queries.find(
      q => q.table === 'tenants' && q.op === 'update' && 'deleted_at' in (q.payload as object)
    );
    expect(tenantUpdate).toBeDefined();
    expect(fake.filters(tenantUpdate!)).toContainEqual(['eq', 'id', 'farm_a']);
    const members = fake.queries.find(q => q.table === 'tenant_members' && q.op === 'update');
    expect(members?.payload).toMatchObject({ status: 'inactive' });
    expect(fake.filters(members!)[0]).toEqual(['eq', 'tenant_id', 'farm_a']);
    const sub = fake.queries.find(q => q.table === 'subscriptions' && q.op === 'upsert');
    expect((sub?.payload as { rows: Record<string, unknown> }).rows).toMatchObject({
      plan: 'free',
    });
    expect(deleteOrganization).toHaveBeenCalledWith('farm_a');
  });
});
