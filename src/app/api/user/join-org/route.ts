// API to join user to their approved organization
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase';

// Types for database records
interface FarmApplication {
  id: string;
  farm_name: string;
  applicant_id: string;
  status: string;
  [key: string]: unknown;
}

interface Tenant {
  id: string;
  slug: string;
  farm_name: string;
  [key: string]: unknown;
}

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();

    // Find user's approved application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Find the tenant created for this application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenants, error: tenantError } = await (supabase
      .from('tenants')
      .select('*')
      .eq('farm_name', application.farm_name)
      .limit(1) as any);

    if (tenantError || !tenants || tenants.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found for this application' },
        { status: 404 }
      );
    }

    const tenant = tenants[0] as Tenant;
    let clerkOrgId = tenant.id;
    const clerk = await clerkClient();

    // Check if this is a valid Clerk org ID (starts with org_)
    // If not, try to find existing org or create new one
    if (!clerkOrgId.startsWith('org_')) {
      console.log('Tenant was created without Clerk org, searching for existing org...');
      
      const baseSlug = tenant.slug || tenant.farm_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let foundOrg = false;

      // First, try to find existing organization by slug
      try {
        const existingOrgs = await clerk.organizations.getOrganizationList({
          query: tenant.farm_name,
          limit: 10,
        });
        
        // Check if any org matches our farm name or slug
        for (const org of existingOrgs.data) {
          if (org.name === tenant.farm_name || org.slug === baseSlug || org.slug?.startsWith(baseSlug)) {
            clerkOrgId = org.id;
            foundOrg = true;
            console.log('Found existing Clerk Organization:', clerkOrgId);
            
            // Update tenant with found Clerk org ID
            await (supabase.from('tenants').delete().eq('id', tenant.id) as any);
            await (supabase.from('tenants').insert([{
              id: clerkOrgId,
              slug: org.slug || baseSlug,
              farm_name: tenant.farm_name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }] as any) as any);

            // Update related records
            await (supabase
              .from('subscriptions')
              .update({ tenant_id: clerkOrgId } as any)
              .eq('tenant_id', tenant.id) as any);
            await (supabase
              .from('tenant_members')
              .update({ tenant_id: clerkOrgId } as any)
              .eq('tenant_id', tenant.id) as any);
            
            break;
          }
        }
      } catch (searchError) {
        console.error('Error searching for existing orgs:', searchError);
      }

      // If no existing org found, try to create one
      if (!foundOrg) {
        console.log('No existing org found, attempting to create new one...');
        
        const slugVariations = [
          baseSlug,
          `${baseSlug}-${Date.now().toString(36)}`,
          `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`,
          `farm-${Date.now().toString(36)}`,
        ];

        for (const slug of slugVariations) {
          try {
            const org = await clerk.organizations.createOrganization({
              name: tenant.farm_name,
              slug: slug,
            });
            
            clerkOrgId = org.id;
            foundOrg = true;
            console.log('Created new Clerk Organization:', clerkOrgId);

            // Update tenant with new Clerk org ID
            await (supabase.from('tenants').delete().eq('id', tenant.id) as any);
            await (supabase.from('tenants').insert([{
              id: clerkOrgId,
              slug: slug,
              farm_name: tenant.farm_name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }] as any) as any);

            // Update related records
            await (supabase
              .from('subscriptions')
              .update({ tenant_id: clerkOrgId } as any)
              .eq('tenant_id', tenant.id) as any);
            await (supabase
              .from('tenant_members')
              .update({ tenant_id: clerkOrgId } as any)
              .eq('tenant_id', tenant.id) as any);

            break;
          } catch (clerkError: unknown) {
            const errorMessage = clerkError instanceof Error ? clerkError.message : String(clerkError);
            console.error(`Clerk org creation failed for slug ${slug}:`, errorMessage);
            
            // If forbidden, it's likely a permissions issue - stop trying
            if (errorMessage.includes('Forbidden')) {
              console.error('Clerk API returned Forbidden - check API key permissions for organizations');
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
            details: 'Please ensure Clerk Organizations feature is enabled and API key has proper permissions.'
          },
          { status: 500 }
        );
      }
    }

    // First check if user is already a member
    try {
      const memberships = await clerk.organizations.getOrganizationMembershipList({
        organizationId: clerkOrgId,
      });

      const existingMembership = memberships.data.find(
        m => m.publicUserData?.userId === userId
      );

      if (existingMembership) {
        return NextResponse.json({
          success: true,
          message: 'You are already a member of this organization',
          data: {
            organizationId: clerkOrgId,
            role: existingMembership.role,
          }
        });
      }
    } catch (checkError) {
      console.error('Error checking membership:', checkError);
    }

    // Add user to organization
    try {
      await clerk.organizations.createOrganizationMembership({
        organizationId: clerkOrgId,
        userId: userId,
        role: 'org:admin',
      });

      console.log(`✅ Added user ${userId} to org ${clerkOrgId}`);

      return NextResponse.json({
        success: true,
        message: 'Successfully joined organization',
        data: {
          organizationId: clerkOrgId,
          farmName: tenant.farm_name,
        }
      });
    } catch (addError: unknown) {
      console.error('Failed to add as admin:', addError);
      
      // Try as member
      try {
        await clerk.organizations.createOrganizationMembership({
          organizationId: clerkOrgId,
          userId: userId,
          role: 'org:member',
        });

        return NextResponse.json({
          success: true,
          message: 'Successfully joined organization as member',
          data: {
            organizationId: clerkOrgId,
            farmName: tenant.farm_name,
          }
        });
      } catch (addError2) {
        console.error('Failed to add as member:', addError2);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to join organization',
            details: addError2 instanceof Error ? addError2.message : String(addError2)
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Join org error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
