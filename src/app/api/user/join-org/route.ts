// API to join user to their approved organization (Clerk + Supabase membership sync)
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { TenantRole } from '@/types/roles';

interface FarmApplication {
  id: string;
  farm_name: string;
  applicant_id: string;
  status: string;
  assigned_tenant_id: string | null;
  [key: string]: unknown;
}

interface Tenant {
  id: string;
  slug: string;
  farm_name: string;
  [key: string]: unknown;
}

async function ensureTenantMember(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  userId: string,
  role: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('tenant_members') as any)
    .select('id, status')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.id) {
    if (existing.status !== 'active') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('tenant_members') as any)
        .update({ status: 'active', role, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tenant_members') as any).insert({
    id: `${tenantId}_${userId}`,
    tenant_id: tenantId,
    user_id: userId,
    role,
    status: 'active',
    join_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

async function remapTenantToClerkOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenant: Tenant,
  clerkOrgId: string,
  slug: string
) {
  const oldId = tenant.id;
  if (oldId === clerkOrgId) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tenants') as any).insert({
    id: clerkOrgId,
    slug,
    farm_name: tenant.farm_name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('subscriptions') as any)
    .update({ tenant_id: clerkOrgId })
    .eq('tenant_id', oldId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tenant_members') as any)
    .update({ tenant_id: clerkOrgId })
    .eq('tenant_id', oldId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('farm_applications') as any)
    .update({ assigned_tenant_id: clerkOrgId })
    .eq('assigned_tenant_id', oldId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tenants') as any).delete().eq('id', oldId);
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    const { data: applications, error: appError } = await (supabase
      .from('farm_applications')
      .select('*')
      .eq('applicant_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1) as any);

    if (appError || !applications || applications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No approved application found' },
        { status: 404 }
      );
    }

    const application = applications[0] as FarmApplication;
    let tenant: Tenant | null = null;

    if (application.assigned_tenant_id) {
      const { data: byId } = await (supabase
        .from('tenants')
        .select('*')
        .eq('id', application.assigned_tenant_id)
        .limit(1) as any);
      tenant = (byId?.[0] as Tenant) || null;
    }

    if (!tenant) {
      const { data: byName } = await (supabase
        .from('tenants')
        .select('*')
        .eq('farm_name', application.farm_name)
        .limit(1) as any);
      tenant = (byName?.[0] as Tenant) || null;
    }

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found for this application' },
        { status: 404 }
      );
    }

    let clerkOrgId = tenant.id;
    const clerk = await clerkClient();

    if (!clerkOrgId.startsWith('org_')) {
      const baseSlug =
        tenant.slug ||
        tenant.farm_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      let foundOrg = false;

      try {
        const existingOrgs = await clerk.organizations.getOrganizationList({
          query: tenant.farm_name,
          limit: 10,
        });
        for (const org of existingOrgs.data) {
          if (
            org.name === tenant.farm_name ||
            org.slug === baseSlug ||
            org.slug?.startsWith(baseSlug)
          ) {
            clerkOrgId = org.id;
            foundOrg = true;
            await remapTenantToClerkOrg(supabase, tenant, clerkOrgId, org.slug || baseSlug);
            break;
          }
        }
      } catch {
        // Continue to create
      }

      if (!foundOrg) {
        const slugVariations = [
          baseSlug,
          `${baseSlug}-${Date.now().toString(36)}`,
          `farm-${Date.now().toString(36)}`,
        ];
        for (const slug of slugVariations) {
          try {
            const org = await clerk.organizations.createOrganization({
              name: tenant.farm_name,
              slug,
            });
            clerkOrgId = org.id;
            foundOrg = true;
            await remapTenantToClerkOrg(supabase, tenant, clerkOrgId, slug);
            break;
          } catch (clerkError: unknown) {
            const errorMessage =
              clerkError instanceof Error ? clerkError.message : String(clerkError);
            if (errorMessage.includes('Forbidden')) {
              console.error(
                'Clerk API returned Forbidden - check API key permissions for organizations'
              );
              break;
            }
          }
        }
      }

      if (!foundOrg) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unable to setup organization. This may be a Clerk configuration issue.',
            details:
              'Please ensure Clerk Organizations feature is enabled and API key has proper permissions.',
          },
          { status: 500 }
        );
      }
    }

    let clerkRole = 'org:admin';
    try {
      const memberships = await clerk.organizations.getOrganizationMembershipList({
        organizationId: clerkOrgId,
      });
      const existingMembership = memberships.data.find(m => m.publicUserData?.userId === userId);
      if (!existingMembership) {
        try {
          await clerk.organizations.createOrganizationMembership({
            organizationId: clerkOrgId,
            userId,
            role: 'org:admin',
          });
        } catch {
          await clerk.organizations.createOrganizationMembership({
            organizationId: clerkOrgId,
            userId,
            role: 'org:member',
          });
          clerkRole = 'org:member';
        }
      } else {
        clerkRole = existingMembership.role;
      }
    } catch (membershipError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to join organization',
          details:
            membershipError instanceof Error ? membershipError.message : String(membershipError),
        },
        { status: 500 }
      );
    }

    const dbRole = clerkRole === 'org:admin' ? TenantRole.FARM_OWNER : TenantRole.FARM_MANAGER;
    await ensureTenantMember(supabase, clerkOrgId, userId, dbRole);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined organization',
      data: {
        organizationId: clerkOrgId,
        farmName: tenant.farm_name,
        role: dbRole,
      },
    });
  } catch (error) {
    console.error('join-org error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
