/**
 * @jest-environment node
 */
const createOrganization = jest.fn();
const deleteOrganization = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: jest.fn(async () => ({
    organizations: { createOrganization, deleteOrganization },
  })),
}));

type Result = { error: { message: string } | null };
const tableCalls: Array<{ table: string; op: string; rows?: unknown; opts?: unknown }> = [];
const failOn = new Set<string>();

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseClient: () => ({
    from: (table: string) => ({
      upsert: async (rows: unknown, opts: unknown): Promise<Result> => {
        tableCalls.push({ table, op: 'upsert', rows, opts });
        return { error: failOn.has(table) ? { message: `${table} boom` } : null };
      },
      delete: () => ({
        eq: async (): Promise<Result> => {
          tableCalls.push({ table, op: 'delete' });
          return { error: null };
        },
      }),
    }),
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  buildSubscriptionRow,
  provisionFarm,
  ProvisioningError,
  slugifyFarmName,
  upsertTenantRecords,
} from '@/lib/tenant/provision';

beforeEach(() => {
  tableCalls.length = 0;
  failOn.clear();
  createOrganization.mockReset();
  deleteOrganization.mockReset();
});

describe('slugifyFarmName', () => {
  it('produces a Clerk-compatible slug', () => {
    expect(slugifyFarmName('  Malik Dairy Farm #1 ')).toBe('malik-dairy-farm-1');
  });

  it('falls back when the name has no latin characters', () => {
    expect(slugifyFarmName('ملک ڈیری')).toBe('farm-new');
  });

  it('pads very short slugs', () => {
    expect(slugifyFarmName('AB')).toBe('farm-ab');
  });
});

describe('buildSubscriptionRow', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('never lets a free plan expire', () => {
    const row = buildSubscriptionRow('org_1', 'free', now);
    expect(new Date(row.renew_date).getUTCFullYear()).toBe(2126);
    expect(row.status).toBe('active');
  });

  it('renews paid plans after 30 days', () => {
    const row = buildSubscriptionRow('org_1', 'professional', now);
    expect(row.renew_date).toBe('2026-01-31T00:00:00.000Z');
  });
});

describe('upsertTenantRecords', () => {
  const input = {
    tenantId: 'org_1',
    slug: 'malik',
    farmName: 'Malik',
    ownerId: 'user_1',
    plan: 'free' as const,
  };

  it('does not overwrite existing rows on the webhook path', async () => {
    await upsertTenantRecords({ ...input, ignoreExisting: true });
    const sub = tableCalls.find(c => c.table === 'subscriptions');
    expect(sub?.opts).toEqual({ onConflict: 'tenant_id', ignoreDuplicates: true });
  });

  it('upserts owner membership on the (tenant_id, user_id) key', async () => {
    await upsertTenantRecords({ ...input, ignoreExisting: false });
    const member = tableCalls.find(c => c.table === 'tenant_members');
    expect(member?.opts).toEqual({ onConflict: 'tenant_id,user_id', ignoreDuplicates: false });
    expect((member?.rows as Array<{ role: string }>)[0].role).toBe('farm_owner');
  });

  it('throws a ProvisioningError naming the failed step', async () => {
    failOn.add('tenant_members');
    await expect(upsertTenantRecords({ ...input, ignoreExisting: false })).rejects.toMatchObject({
      name: 'ProvisioningError',
      step: 'membership',
    });
  });
});

describe('provisionFarm', () => {
  it('uses the real Clerk org id as tenant id and makes the owner the creator', async () => {
    createOrganization.mockResolvedValue({ id: 'org_real', slug: 'malik' });
    const farm = await provisionFarm({ ownerId: 'user_1', farmName: 'Malik', plan: 'free' });

    expect(farm).toEqual({ tenantId: 'org_real', slug: 'malik' });
    expect(createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'user_1', slug: 'malik' })
    );
    const tenant = tableCalls.find(c => c.table === 'tenants');
    expect((tenant?.rows as Array<{ id: string }>)[0].id).toBe('org_real');
  });

  it('retries with a new slug when the slug is taken', async () => {
    createOrganization
      .mockRejectedValueOnce({ errors: [{ code: 'form_identifier_exists' }] })
      .mockResolvedValueOnce({ id: 'org_2', slug: 'malik-abcde' });
    const farm = await provisionFarm({ ownerId: 'user_1', farmName: 'Malik', plan: 'free' });
    expect(farm.tenantId).toBe('org_2');
    expect(createOrganization).toHaveBeenCalledTimes(2);
  });

  it('never invents a tenant id when Clerk is unavailable', async () => {
    createOrganization.mockRejectedValue(new Error('network down'));
    await expect(
      provisionFarm({ ownerId: 'user_1', farmName: 'Malik', plan: 'free' })
    ).rejects.toBeInstanceOf(ProvisioningError);
    expect(tableCalls.filter(c => c.op === 'upsert')).toHaveLength(0);
  });

  it('rolls back the Clerk org and tenant row when database writes fail', async () => {
    createOrganization.mockResolvedValue({ id: 'org_3', slug: 'malik' });
    failOn.add('subscriptions');
    await expect(
      provisionFarm({ ownerId: 'user_1', farmName: 'Malik', plan: 'free' })
    ).rejects.toMatchObject({ step: 'subscription' });
    expect(deleteOrganization).toHaveBeenCalledWith('org_3');
    expect(tableCalls).toContainEqual({ table: 'tenants', op: 'delete' });
  });
});
