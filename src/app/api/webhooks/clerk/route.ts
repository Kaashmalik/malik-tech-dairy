// Clerk Webhook Handler for Organization Events
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { cacheClaimOnce, cacheDelete, CacheTTL } from '@/lib/cache/redis-cache';
import { getSupabaseClient } from '@/lib/supabase/server';
import { ensurePlatformUser } from '@/lib/auth/platform-user';
import { upsertTenantRecords, type FarmPlan } from '@/lib/tenant/provision';
import { tenantDb, unwrap } from '@/lib/supabase/tenant-db';
import { mapClerkOrgRole } from '@/lib/tenant/resolve-access';
import { TenantRole } from '@/types/roles';

const isTenantRole = (role: string): role is TenantRole =>
  (Object.values(TenantRole) as string[]).includes(role);
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/** Process-local fallback when Redis is unavailable (dev / misconfigured). */
const processedWebhooks = new Map<string, number>();
const WEBHOOK_TTL_MS = CacheTTL.MEDIUM * 1000;

async function claimWebhookOnce(webhookId: string): Promise<boolean> {
  const redisClaim = await cacheClaimOnce(`webhook:clerk:${webhookId}`, CacheTTL.MEDIUM);
  if (redisClaim !== null) {
    return redisClaim;
  }

  // Fallback: in-memory (not durable across serverless instances)
  const now = Date.now();
  for (const [id, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > WEBHOOK_TTL_MS) {
      processedWebhooks.delete(id);
    }
  }
  if (processedWebhooks.has(webhookId)) {
    return false;
  }
  processedWebhooks.set(webhookId, now);
  return true;
}

/** Undo a claim when processing failed, so the Svix retry is not dropped as a duplicate. */
async function releaseWebhookClaim(webhookId: string): Promise<void> {
  processedWebhooks.delete(webhookId);
  await cacheDelete(`webhook:clerk:${webhookId}`);
}

export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  // Validate webhook secret
  if (!WEBHOOK_SECRET) {
    console.error('Webhook secret not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Check for placeholder value
  if (WEBHOOK_SECRET === 'whsec_your_webhook_secret_here') {
    console.error('Webhook secret is still a placeholder value');
    return NextResponse.json({ error: 'Webhook secret not properly configured' }, { status: 500 });
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers');
    return NextResponse.json({ error: 'Missing required svix headers' }, { status: 400 });
  }

  // Svix signs the raw body - verify exactly what was sent
  const body = await request.text();

  // Generate webhook ID for replay protection
  const webhookId = crypto
    .createHash('sha256')
    .update(`${svix_id}-${svix_timestamp}-${svix_signature}`)
    .digest('hex');

  // Verify timestamp (prevent replay attacks with old timestamps)
  const webhookTimestamp = parseInt(svix_timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 5 * 60; // 5 minutes

  if (Math.abs(now - webhookTimestamp) > maxAge) {
    console.error('Webhook timestamp too old');
    return NextResponse.json({ error: 'Webhook timestamp too old' }, { status: 400 });
  }

  // Create Svix instance and verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  // Claim after verify so invalid payloads cannot poison the replay cache
  const claimed = await claimWebhookOnce(webhookId);
  if (!claimed) {
    // Already processed: acknowledge so Svix stops retrying
    logger.warn('Duplicate Clerk webhook ignored', { svixId: svix_id });
    return NextResponse.json({ received: true, duplicate: true });
  }

  const eventType = evt.type;
  const data = evt.data;

  logger.info('Clerk webhook received', { eventType, eventId: evt.id });

  const auditMeta = {
    ipAddress: headerPayload.get('x-forwarded-for') || undefined,
    userAgent: headerPayload.get('user-agent') || undefined,
  };

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated': {
        // Idempotent mirror into platform_users (also handles super-admin allow-list)
        await ensurePlatformUser(data.id);
        if (eventType === 'user.updated') {
          const primary = data.email_addresses?.find(
            (e: { id: string }) => e.id === data.primary_email_address_id
          );
          if (primary?.email_address) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (getSupabaseClient().from('platform_users') as any)
              .update({
                email: primary.email_address.toLowerCase(),
                name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
                email_verified: primary.verification?.status === 'verified',
                updated_at: new Date().toISOString(),
              })
              .eq('id', data.id);
          }
        }
        break;
      }

      case 'organization.created': {
        // Usually provisionFarm() already wrote these rows; this is the safety net for
        // orgs created elsewhere (Clerk dashboard, OrganizationSwitcher). Never overwrite.
        const orgId: string = data.id;
        const ownerId: string | undefined = data.created_by;
        if (!ownerId) {
          logger.warn('organization.created without created_by; skipping tenant init', { orgId });
          break;
        }
        await ensurePlatformUser(ownerId);
        const plan = (data.public_metadata?.plan as FarmPlan | undefined) || 'free';
        await upsertTenantRecords({
          tenantId: orgId,
          slug: data.slug || orgId.toLowerCase(),
          farmName: data.name || 'My Farm',
          ownerId,
          plan,
          ignoreExisting: true,
        });
        await logAuditEvent({
          tenantId: orgId,
          userId: ownerId,
          action: 'create',
          resource: 'organization',
          resourceId: orgId,
          details: { eventType, orgSlug: data.slug },
          ...auditMeta,
        });
        break;
      }

      case 'organizationMembership.created':
      case 'organizationMembership.updated': {
        // Invite accepted (or role changed in Clerk): mirror into tenant_members.
        const orgId: string = data.organization?.id;
        const memberUserId: string = data.public_user_data?.user_id;
        if (!orgId || !memberUserId) break;
        await ensurePlatformUser(memberUserId);

        const t = tenantDb(orgId);
        const existing = unwrap(
          await t.select('tenant_members', 'id, role').eq('user_id', memberUserId).maybeSingle(),
          'Load membership'
        ) as { id: string; role: string } | null;
        // The owner row is written by provisioning; never downgrade it from here
        if (existing?.role === TenantRole.FARM_OWNER) break;

        const invitedRole = data.public_metadata?.tenantRole as string | undefined;
        const role =
          invitedRole && invitedRole !== TenantRole.FARM_OWNER && isTenantRole(invitedRole)
            ? invitedRole
            : existing?.role || mapClerkOrgRole(data.role);
        const now = new Date().toISOString();
        unwrap(
          await t.upsert(
            'tenant_members',
            {
              id: existing?.id || `${orgId}_${memberUserId}`,
              user_id: memberUserId,
              role,
              status: 'active',
              join_date: now,
              updated_at: now,
            },
            { onConflict: 'tenant_id,user_id' }
          ),
          'Upsert membership'
        );
        break;
      }

      case 'organizationMembership.deleted': {
        const orgId: string = data.organization?.id;
        const memberUserId: string = data.public_user_data?.user_id;
        if (!orgId || !memberUserId) break;
        unwrap(
          await tenantDb(orgId)
            .update('tenant_members', { status: 'inactive', updated_at: new Date().toISOString() })
            .eq('user_id', memberUserId),
          'Deactivate membership'
        );
        break;
      }

      case 'organization.deleted': {
        const orgId: string = data.id;
        // Soft delete - data is retained for export/recovery
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (getSupabaseClient().from('tenants') as any)
          .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', orgId);
        await logAuditEvent({
          tenantId: orgId,
          userId: data.deleted_by || 'system',
          action: 'delete',
          resource: 'organization',
          resourceId: orgId,
          details: { eventType },
          ...auditMeta,
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    logger.error('Clerk webhook handler failed', error, { eventType, eventId: evt.id });
    await releaseWebhookClaim(webhookId);
    // 500 lets Svix retry with backoff; handlers above are idempotent
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true, id: evt.id });
}
