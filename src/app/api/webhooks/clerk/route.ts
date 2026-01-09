// Clerk Webhook Handler for Organization Events
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { initializeTenant } from '@/lib/supabase/tenant'; // Use Supabase instead of Firestore
import { adminDb } from '@/lib/firebase/admin'; // Keep for Firestore document data
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Webhook event tracking to prevent replay attacks
const processedWebhooks = new Map<string, number>();
const WEBHOOK_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up old webhook IDs
setInterval(() => {
  const now = Date.now();
  for (const [id, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > WEBHOOK_TTL) {
      processedWebhooks.delete(id);
    }
  }
}, 60 * 1000); // Clean every minute

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

  // Get body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Generate webhook ID for replay protection
  const webhookId = crypto
    .createHash('sha256')
    .update(`${svix_id}-${svix_timestamp}-${svix_signature}`)
    .digest('hex');

  // Check for replay attack
  if (processedWebhooks.has(webhookId)) {
    console.warn('Duplicate webhook detected, possible replay attack');
    return NextResponse.json({ error: 'Duplicate webhook' }, { status: 400 });
  }

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

  // Mark webhook as processed
  processedWebhooks.set(webhookId, Date.now());

  const eventType = evt.type;
  const data = evt.data;

  // Log webhook event for audit
  console.log(`Webhook received: ${eventType}`, {
    id: evt.id,
    timestamp: new Date().toISOString(),
  });

  // Handle organization.created event
  if (eventType === 'organization.created') {
    try {
      const orgId = data.id;
      const orgSlug =
        data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || `org-${orgId.slice(0, 8)}`;
      const ownerId = data.created_by;

      // Get owner email from Clerk (or from user data)
      // For now, we'll initialize without email and update later
      await initializeTenant(orgId, orgSlug, ownerId, 'owner@example.com');

      // Create user records for the organization owner
      const { getDrizzle } = await import('@/lib/supabase/server');
      const { platformUsers, tenantMembers } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDrizzle();

      // Create platform user record for the owner
      const existingPlatformUser = await db
        .select()
        .from(platformUsers)
        .where(eq(platformUsers.id, ownerId))
        .limit(1);

      if (existingPlatformUser.length === 0) {
        await db.insert(platformUsers).values({
          id: ownerId,
          email: 'owner@example.com', // Will be updated by user.created webhook
          name: 'Farm Owner',
          platformRole: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Create tenant member record for the owner
      const { and } = await import('drizzle-orm');
      const existingMember = await db
        .select()
        .from(tenantMembers)
        .where(and(eq(tenantMembers.userId, ownerId), eq(tenantMembers.tenantId, orgId)))
        .limit(1);

      if (existingMember.length === 0) {
        await db.insert(tenantMembers).values({
          id: `${orgId}_${ownerId}`,
          tenantId: orgId,
          userId: ownerId,
          role: 'farm_owner', // Give the owner full access
          status: 'active',
          joinDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`Tenant initialized: ${orgId} (${orgSlug})`);

      // Log audit event
      const { logAuditEvent } = await import('@/lib/audit');
      await logAuditEvent({
        tenantId: orgId,
        userId: ownerId,
        action: 'create',
        resource: 'organization',
        resourceId: orgId,
        details: { eventType, orgSlug },
        ipAddress: headerPayload.get('x-forwarded-for') || undefined,
        userAgent: headerPayload.get('user-agent') || undefined,
      });
    } catch (error) {
      console.error('Failed to initialize tenant:', error);
      return NextResponse.json({ error: 'Failed to initialize tenant' }, { status: 500 });
    }
  }

  // Handle organization.deleted event
  if (eventType === 'organization.deleted') {
    try {
      const orgId = data.id;

      // Archive tenant in Supabase (soft delete)
      const { getDrizzle } = await import('@/lib/supabase/server');
      const { tenants } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDrizzle();

      await db.update(tenants).set({ deletedAt: new Date() }).where(eq(tenants.id, orgId));

      // Log audit event
      const { logAuditEvent } = await import('@/lib/audit');
      await logAuditEvent({
        tenantId: orgId,
        userId: data.deleted_by || 'system',
        action: 'delete',
        resource: 'organization',
        resourceId: orgId,
        details: { eventType },
        ipAddress: headerPayload.get('x-forwarded-for') || undefined,
        userAgent: headerPayload.get('user-agent') || undefined,
      });

      console.log(`Tenant archived: ${orgId}`);
    } catch (error) {
      console.error('Failed to archive tenant:', error);
    }
  }

  // Handle user.created event to update email
  if (eventType === 'user.created') {
    try {
      const userId = data.id;
      const email = data.email_addresses?.[0]?.email_address;
      const firstName = data.first_name;
      const lastName = data.last_name;

      if (email) {
        const { getDrizzle } = await import('@/lib/supabase/server');
        const { platformUsers } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        const db = getDrizzle();

        await db
          .update(platformUsers)
          .set({
            email,
            name: `${firstName || ''} ${lastName || ''}`.trim() || null,
            emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
            updatedAt: new Date(),
          })
          .where(eq(platformUsers.id, userId));

        console.log(`User email updated: ${userId} -> ${email}`);
      }
    } catch (error) {
      console.error('Failed to update user email:', error);
    }
  }

  return NextResponse.json({ received: true, id: evt.id });
}
