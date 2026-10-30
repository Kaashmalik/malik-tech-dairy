// Super Admin - Review Farm Application API
// POST: Approve or reject an application
// On approval: Creates Clerk Org, Tenant, assigns farm_owner role
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/server';
import { ensurePlatformUser } from '@/lib/auth/platform-user';
import { provisionFarm, ProvisioningError, type FarmPlan } from '@/lib/tenant/provision';
import { logger } from '@/lib/logger';
import { NotificationService } from '@/lib/services/notifications/notification.service';
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
      const plan = (application.requested_plan || 'free') as FarmPlan;

      // Claim the application atomically so a double click cannot create two farms
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: claimed, error: claimError } = await (supabase.from('farm_applications') as any)
        .update({ status: 'under_review', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', application.status)
        .select('id');
      if (claimError || !claimed?.length) {
        return NextResponse.json(
          { error: 'Application is already being processed. Refresh and try again.' },
          { status: 409 }
        );
      }

      // 1-3. Clerk org (applicant = org admin) + tenant + subscription + owner membership.
      // Throws ProvisioningError and rolls back on failure - no synthetic tenant IDs.
      let farm;
      try {
        await ensurePlatformUser(application.applicant_id);
        farm = await provisionFarm({
          ownerId: application.applicant_id,
          farmName: application.farm_name,
          plan,
          animalTypes: application.animal_types,
        });
      } catch (provisionError) {
        // Release the claim so the admin can retry
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('farm_applications') as any)
          .update({ status: application.status, updated_at: new Date().toISOString() })
          .eq('id', id);
        throw provisionError;
      }
      const clerkOrgId = farm.tenantId;
      const finalSlug = farm.slug;

      // 4. Update application status
      const updateData = {
        status: 'approved',
        assigned_farm_id: farmId,
        assigned_tenant_id: clerkOrgId,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_notes: validatedData.reviewNotes || null,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedAppData, error: updateError } = await (
        supabase.from('farm_applications') as any
      )
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      const updatedApp = updatedAppData as FarmApplication;
      if (updateError) {
        // Farm is live; surface the inconsistency so the admin can retry the status update
        logger.error('Farm provisioned but application status update failed', updateError, {
          applicationId: id,
          tenantId: clerkOrgId,
        });
        return NextResponse.json(
          {
            error: 'Farm was created but the application status could not be updated',
            details: updateError.message,
            data: { tenantId: clerkOrgId },
          },
          { status: 500 }
        );
      }
      // 5. Create notification for the user (fire and forget)
      try {
        await NotificationService.createNotification(clerkOrgId, {
          userId: application.applicant_id,
          type: 'system',
          title: 'Farm Application Approved! 🎉',
          message: `Your farm "${application.farm_name}" has been approved. Farm ID: ${farmId}`,
          link: '/dashboard',
          metadata: { applicationId: id, farmId },
        });
      } catch (e) {
        logger.warn('Notification insert failed', { applicationId: id, error: String(e) });
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
        logger.warn('Notification insert failed', { applicationId: id, error: String(e) });
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
            id: clerkOrgId,
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
      // No tenant exists for a rejected farm (notifications.tenant_id is NOT NULL);
      // the applicant sees the reason on /apply/status.
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
    if (error instanceof ProvisioningError) {
      return NextResponse.json(
        { error: error.message, details: `Provisioning failed at step: ${error.step}` },
        { status: 502 }
      );
    }
    logger.error('Application review failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to review application',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
