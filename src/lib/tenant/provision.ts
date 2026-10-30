// Farm (tenant) provisioning - shared by instant free signup, super-admin approval
// and the Clerk organization.created webhook. Server-only.
//
// Invariants:
// - tenants.id is ALWAYS a real Clerk organization ID (never a synthetic fallback),
//   otherwise the owner's session orgId can never match the tenant.
// - Every write is an upsert keyed on a unique column, so retries and the
//   concurrent webhook are safe.
import { clerkClient } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type FarmPlan = 'free' | 'professional' | 'farm' | 'enterprise';

const DEFAULT_ANIMAL_TYPES = ['cow', 'buffalo'];
const PAID_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export class ProvisioningError extends Error {
  constructor(
    message: string,
    public readonly step: 'clerk_org' | 'tenant' | 'subscription' | 'membership' | 'config'
  ) {
    super(message);
    this.name = 'ProvisioningError';
  }
}

/** Clerk-compatible slug: lowercase a-z0-9 and single hyphens, 3-50 chars. */
export function slugifyFarmName(farmName: string): string {
  const slug = farmName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return slug.length >= 3 ? slug : `farm-${slug || 'new'}`.replace(/-+$/g, '');
}

export function slugCandidates(base: string): string[] {
  const suffix = () => Math.random().toString(36).slice(2, 7);
  return [base, `${base}-${suffix()}`, `${base}-${suffix()}`, `${base}-${Date.now().toString(36)}`];
}

/**
 * Subscription row for a plan. Free never expires (tenant context treats a past
 * renew_date as expired); paid plans renew monthly.
 */
export function buildSubscriptionRow(tenantId: string, plan: FarmPlan, now = new Date()) {
  const renewDate = new Date(now);
  if (plan === 'free') {
    renewDate.setFullYear(renewDate.getFullYear() + 100);
  } else {
    renewDate.setTime(now.getTime() + PAID_PERIOD_MS);
  }
  return {
    id: `${tenantId}_subscription`,
    tenant_id: tenantId,
    plan,
    status: 'active',
    gateway: 'bank_transfer',
    renew_date: renewDate.toISOString(),
    amount: 0,
    currency: 'PKR',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

function isSlugConflict(error: unknown): boolean {
  const err = error as { errors?: Array<{ code?: string; message?: string }>; message?: string };
  const codes = (err?.errors || []).map(e => `${e.code} ${e.message}`.toLowerCase());
  const text = [...codes, String(err?.message || '').toLowerCase()].join(' ');
  return text.includes('form_identifier_exists') || text.includes('slug');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (name: string) => getSupabaseClient().from(name as any) as any;

interface TenantRecordsInput {
  tenantId: string;
  slug: string;
  farmName: string;
  ownerId: string;
  plan: FarmPlan;
  animalTypes?: string[];
  /**
   * true: keep existing rows untouched (webhook path, must not downgrade a paid plan).
   * false: overwrite (provisioning path is authoritative).
   */
  ignoreExisting: boolean;
}

/** Create tenant, subscription, owner membership and custom-field config rows. */
export async function upsertTenantRecords(input: TenantRecordsInput): Promise<void> {
  const now = new Date().toISOString();
  const opts = (onConflict: string) => ({ onConflict, ignoreDuplicates: input.ignoreExisting });

  const { error: tenantError } = await table('tenants').upsert(
    [
      {
        id: input.tenantId,
        slug: input.slug,
        farm_name: input.farmName,
        animal_types: input.animalTypes?.length ? input.animalTypes : DEFAULT_ANIMAL_TYPES,
        language: 'en',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        created_at: now,
        updated_at: now,
      },
    ],
    opts('id')
  );
  if (tenantError) {
    throw new ProvisioningError(`Failed to create farm record: ${tenantError.message}`, 'tenant');
  }

  const { error: subError } = await table('subscriptions').upsert(
    [buildSubscriptionRow(input.tenantId, input.plan)],
    opts('tenant_id')
  );
  if (subError) {
    throw new ProvisioningError(
      `Failed to create subscription: ${subError.message}`,
      'subscription'
    );
  }

  const { error: memberError } = await table('tenant_members').upsert(
    [
      {
        id: `${input.tenantId}_${input.ownerId}`,
        tenant_id: input.tenantId,
        user_id: input.ownerId,
        role: 'farm_owner',
        status: 'active',
        join_date: now,
        created_at: now,
        updated_at: now,
      },
    ],
    opts('tenant_id,user_id')
  );
  if (memberError) {
    throw new ProvisioningError(`Failed to add farm owner: ${memberError.message}`, 'membership');
  }

  const { error: configError } = await table('custom_fields_config').upsert(
    [
      {
        id: `${input.tenantId}_custom_fields`,
        tenant_id: input.tenantId,
        fields: [],
        updated_at: now,
      },
    ],
    { onConflict: 'tenant_id', ignoreDuplicates: true }
  );
  if (configError) {
    // Non-critical: custom fields page creates its config lazily
    logger.warn('Failed to create custom fields config', {
      tenantId: input.tenantId,
      error: configError.message,
    });
  }
}

export interface ProvisionFarmInput {
  ownerId: string;
  farmName: string;
  plan: FarmPlan;
  animalTypes?: string[];
}

export interface ProvisionedFarm {
  tenantId: string;
  slug: string;
}

/**
 * Create a Clerk organization (owner becomes org admin) plus all Supabase rows.
 * On database failure the Clerk org is deleted so a retry starts clean.
 */
export async function provisionFarm(input: ProvisionFarmInput): Promise<ProvisionedFarm> {
  const clerk = await clerkClient();
  const base = slugifyFarmName(input.farmName);

  let org: { id: string; slug: string | null } | null = null;
  let lastError: unknown = null;
  for (const slug of slugCandidates(base)) {
    try {
      org = await clerk.organizations.createOrganization({
        name: input.farmName,
        slug,
        createdBy: input.ownerId,
        publicMetadata: { plan: input.plan },
      });
      break;
    } catch (error) {
      lastError = error;
      if (!isSlugConflict(error)) {
        break;
      }
    }
  }

  if (!org) {
    logger.error('Clerk organization creation failed', lastError, { ownerId: input.ownerId });
    throw new ProvisioningError(
      'Could not create the farm organization. Please try again in a moment.',
      'clerk_org'
    );
  }

  const tenantId = org.id;
  const slug = org.slug || base;

  try {
    await upsertTenantRecords({
      tenantId,
      slug,
      farmName: input.farmName,
      ownerId: input.ownerId,
      plan: input.plan,
      animalTypes: input.animalTypes,
      ignoreExisting: false,
    });
  } catch (error) {
    try {
      // Members, subscription and config rows cascade from tenants
      await table('tenants').delete().eq('id', tenantId);
      await clerk.organizations.deleteOrganization(tenantId);
    } catch (rollbackError) {
      logger.error('Rollback of Clerk organization failed', rollbackError, { tenantId });
    }
    throw error;
  }

  logger.info('Farm provisioned', { tenantId, slug, plan: input.plan, ownerId: input.ownerId });
  return { tenantId, slug };
}
