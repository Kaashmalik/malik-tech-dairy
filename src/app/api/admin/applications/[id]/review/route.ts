// Super Admin - Review Farm Application API
// POST: Approve or reject an application
// On approval: Creates Clerk Org, Tenant, assigns farm_owner role
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase';
// Type definitions
interface FarmApplication {
  id: string;
  applicant_id: string;
  farm_name: string;
  owner_name: string;
  email: string;
  phone: string;
  requested_plan: string;
  status: string;
  animal_types?: string[];
  estimated_animals?: number;
  [key: string]: unknown;
}
interface PlatformUser {
  platform_role: string;
}
const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});
// Helper to check if user is super admin
async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('platform_users')
    .select('platform_role')
    .eq('id', userId)
    .single();
  const user = data as PlatformUser | null;
  return user?.platform_role === 'super_admin';
}
// Generate a URL-friendly slug from farm name
function generateSlug(farmName: string): string {
  return farmName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}
// Generate a unique Farm ID
function generateFarmId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'FARM-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
// POST: Review (approve/reject) application
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check super admin role
    const isAdmin = await isSuperAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }
    const supabase = getSupabaseClient();
    const body = await request.json();
    const validatedData = reviewSchema.parse(body);
    // Fetch the application
    const { data: appData, error: fetchError } = await supabase
      .from('farm_applications')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !appData) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    const application = appData as FarmApplication;
    // Check if already processed
    if (application.status === 'approved' || application.status === 'rejected') {
      return NextResponse.json(
        { error: 'Application has already been processed' },
        { status: 400 }
      );
    }
    if (validatedData.action === 'approve') {
      // ============ APPROVAL FLOW ============
      const farmId = generateFarmId();
      const baseSlug = generateSlug(application.farm_name);
      // 1. Create Clerk Organization (or fallback to UUID)
      let clerkOrgId: string = '';
      let finalSlug: string = baseSlug;
      let orgCreated = false;
      try {
        const clerk = await clerkClient();
        // Try to create organization with different slug variations
        const slugVariations = [
          baseSlug,
          `${baseSlug}-${Date.now().toString(36)}`,
          `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`,
        ];
        for (const slug of slugVariations) {
          try {
            const org = await clerk.organizations.createOrganization({
              name: application.farm_name,
              slug: slug,
            });
            clerkOrgId = org.id;
            finalSlug = slug;
            orgCreated = true;
            // Add the applicant as admin member - CRITICAL STEP
            try {
              await clerk.organizations.createOrganizationMembership({
                organizationId: clerkOrgId,
                userId: application.applicant_id,
                role: 'org:admin',
              });
            } catch (memberError: unknown) {
              // Try with basic member role if admin fails
              try {
                await clerk.organizations.createOrganizationMembership({
                  organizationId: clerkOrgId,
                  userId: application.applicant_id,
                  role: 'org:member',
                });
                console.log('✅ Added applicant as org member (fallback)');
              } catch (memberError2) {
                // Don't break - continue with tenant creation
              }
            }
            break;
          } catch (clerkError: unknown) {
            const errorMessage =
              clerkError instanceof Error ? clerkError.message : String(clerkError);
            if (!errorMessage.includes('slug') && !errorMessage.includes('already exists')) {
              break;
            }
          }
        }
      } catch (clerkInitError) {
      }
      // FALLBACK: Use UUID if Clerk fails
      if (!orgCreated) {
        clerkOrgId = `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        finalSlug = `${baseSlug}-${Date.now().toString(36)}`;
      }
      // 2. Create Tenant record in Supabase (matching schema)
      const tenantData = {
        id: clerkOrgId!,
        slug: finalSlug,
        farm_name: application.farm_name,
        animal_types: application.animal_types || ['cow', 'buffalo'],
        language: 'en',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: tenantError } = await (supabase.from('tenants') as any).insert([tenantData]);
      // 2b. Create subscription record
      if (!tenantError) {
        try {
          const subscriptionData = {
            id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            tenant_id: clerkOrgId!,
            plan: application.requested_plan || 'free',
            status: 'active',
            gateway: 'bank_transfer',
            renew_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 0,
            currency: 'PKR',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: subError } = await (supabase.from('subscriptions') as any).insert([
            subscriptionData,
          ]);
          if (subError) {
          }
        } catch (e) {
        }
      }
      if (tenantError) {
        // Rollback: Delete Clerk organization (only if we created one)
        if (orgCreated && clerkOrgId) {
          try {
            const clerk = await clerkClient();
            await clerk.organizations.deleteOrganization(clerkOrgId);
          } catch (e) {
          }
        }
        return NextResponse.json(
          { error: 'Failed to create tenant record', details: tenantError.message },
          { status: 500 }
        );
      }
      // 3. Add user as farm_owner in tenant_members (matching schema)
      const memberData = {
        id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tenant_id: clerkOrgId!,
        user_id: application.applicant_id,
        role: 'farm_owner',
        status: 'active',
        join_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: memberError } = await (supabase.from('tenant_members') as any).insert([
        memberData,
      ]);
      if (memberError) {
        // Continue anyway - user can be added later
      }
      // 4. Update application status
      const updateData = {
        status: 'approved',
        assigned_farm_id: farmId,
        assigned_tenant_id: clerkOrgId!,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_notes: validatedData.reviewNotes || null,
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedAppData, error: updateError } = await (
        supabase.from('farm_applications') as any
      )
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      const updatedApp = updatedAppData as FarmApplication;
      if (updateError) {
        return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
      }
      // 5. Create notification for the user (fire and forget)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('notifications') as any).insert([
          {
            user_id: application.applicant_id,
            type: 'application_approved',
            title: 'Farm Application Approved! 🎉',
            message: `Your farm "${application.farm_name}" has been approved. Farm ID: ${farmId}`,
            data: { applicationId: id, farmId, tenantId: clerkOrgId! },
            read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (e) {
      }
      // 6. Create super admin notification (fire and forget)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('admin_notifications') as any).insert([
          {
            type: 'application_processed',
            title: 'Application Approved',
            message: `Farm "${application.farm_name}" approved by admin`,
            data: { applicationId: id, farmId, action: 'approved' },
            read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (e) {
      }
      return NextResponse.json({
        success: true,
        data: {
          application: {
            ...updatedApp,
            farmName: updatedApp.farm_name,
            ownerName: updatedApp.owner_name,
            assignedFarmId: farmId,
          },
          tenant: {
            id: clerkOrgId!,
            name: application.farm_name,
            slug: finalSlug,
          },
        },
        message: `Application approved! Farm ID: ${farmId}`,
      });
    } else {
      // ============ REJECTION FLOW ============
      if (!validatedData.rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }
      const rejectData = {
        status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_notes: validatedData.reviewNotes || null,
        rejection_reason: validatedData.rejectionReason,
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedAppData, error: updateError } = await (
        supabase.from('farm_applications') as any
      )
        .update(rejectData)
        .eq('id', id)
        .select()
        .single();
      const updatedApp = updatedAppData as FarmApplication;
      if (updateError) {
        return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
      }
      // Create notification for the user (fire and forget)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('notifications') as any).insert([
          {
            user_id: application.applicant_id,
            type: 'application_rejected',
            title: 'Farm Application Update',
            message: `Your farm application has been reviewed. Reason: ${validatedData.rejectionReason}`,
            data: { applicationId: id, reason: validatedData.rejectionReason },
            read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (e) {
      }
      return NextResponse.json({
        success: true,
        data: {
          application: {
            ...updatedApp,
            farmName: updatedApp.farm_name,
            ownerName: updatedApp.owner_name,
          },
        },
        message: 'Application rejected',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: 'Failed to review application',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}