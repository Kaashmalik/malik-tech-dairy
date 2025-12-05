// Farm Application Service
// Handles farm ID applications, payment verification, and approval workflow

import { getDrizzle } from '@/lib/supabase';
import { 
  farmApplications, 
  platformUsers, 
  tenants, 
  subscriptions, 
  tenantMembers,
  farmIdSequence 
} from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { logActivity } from '@/lib/firebase/activity-feed';

export type FarmApplicationStatus = 'pending' | 'payment_uploaded' | 'under_review' | 'approved' | 'rejected';
export type SubscriptionPlan = 'free' | 'professional' | 'farm' | 'enterprise';

export interface CreateFarmApplicationInput {
  applicantId: string;
  farmName: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  province?: string;
  animalTypes?: string[];
  estimatedAnimals?: number;
  requestedPlan: SubscriptionPlan;
}

export interface UploadPaymentSlipInput {
  applicationId: string;
  paymentSlipUrl: string;
  paymentSlipProvider: 'cloudinary' | 'supabase';
  paymentAmount: number;
  paymentDate: Date;
  paymentReference?: string;
}

export interface ReviewApplicationInput {
  applicationId: string;
  reviewerId: string;
  action: 'approve' | 'reject';
  reviewNotes?: string;
  rejectionReason?: string;
}

/**
 * Generate a unique Farm ID in format: MTD-YYYY-XXXX
 */
async function generateFarmId(): Promise<string> {
  const db = getDrizzle();
  const currentYear = new Date().getFullYear();

  // Get or create sequence for current year
  const [sequence] = await db
    .select()
    .from(farmIdSequence)
    .where(eq(farmIdSequence.year, currentYear))
    .limit(1);

  let nextNumber: number;

  if (sequence) {
    // Update existing sequence
    nextNumber = sequence.lastNumber + 1;
    await db
      .update(farmIdSequence)
      .set({ lastNumber: nextNumber })
      .where(eq(farmIdSequence.year, currentYear));
  } else {
    // Create new sequence for this year
    nextNumber = 1;
    await db.insert(farmIdSequence).values({
      year: currentYear,
      lastNumber: nextNumber,
    });
  }

  // Format: MTD-2024-0001
  return `MTD-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Create a new farm application
 * For FREE plan: Auto-approve immediately
 * For PAID plans: Wait for payment and admin approval
 */
export async function createFarmApplication(input: CreateFarmApplicationInput) {
  const db = getDrizzle();
  const id = nanoid();

  const [application] = await db
    .insert(farmApplications)
    .values({
      id,
      applicantId: input.applicantId,
      farmName: input.farmName,
      ownerName: input.ownerName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      province: input.province,
      animalTypes: input.animalTypes || ['cow', 'buffalo'],
      estimatedAnimals: input.estimatedAnimals || 10,
      requestedPlan: input.requestedPlan,
      status: 'pending',
    })
    .returning();

  // Log activity for super admins
  await logActivity(
    'platform', // Use 'platform' as tenantId for platform-wide events
    input.applicantId,
    input.ownerName,
    'farm_application_submitted',
    { farmName: input.farmName, plan: input.requestedPlan }
  );

  // AUTO-APPROVE FREE TIER
  if (input.requestedPlan === 'free') {
    try {
      const result = await autoApproveFreeApplication(application.id, input.applicantId);
      return result.application;
    } catch (error) {
      console.error('Auto-approval failed for free tier:', error);
      // Return pending application if auto-approval fails
      return application;
    }
  }

  return application;
}

/**
 * Auto-approve free tier applications
 * Creates Clerk organization and sets up tenant
 */
async function autoApproveFreeApplication(applicationId: string, applicantId: string) {
  const db = getDrizzle();

  // Get the application
  const [application] = await db
    .select()
    .from(farmApplications)
    .where(eq(farmApplications.id, applicationId))
    .limit(1);

  if (!application) {
    throw new Error('Application not found');
  }

  // Generate unique Farm ID
  const farmId = await generateFarmId();

  // Create tenant (organization) in database
  const tenantId = nanoid();
  const slug = application.farmName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  await db.insert(tenants).values({
    id: tenantId,
    slug: `${slug}-${farmId.split('-').pop()}`,
    farmName: application.farmName,
    language: 'en',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    animalTypes: application.animalTypes as string[],
  });

  // Create free subscription
  const subscriptionId = nanoid();
  const renewDate = new Date();
  renewDate.setFullYear(renewDate.getFullYear() + 100); // Free tier never expires

  await db.insert(subscriptions).values({
    id: subscriptionId,
    tenantId,
    plan: 'free',
    status: 'active',
    gateway: 'free',
    renewDate,
    amount: 0,
    currency: 'PKR',
  });

  // Add applicant as farm owner
  const memberId = nanoid();
  await db.insert(tenantMembers).values({
    id: memberId,
    tenantId,
    userId: applicantId,
    role: 'farm_owner',
    status: 'active',
  });

  // Update application to approved
  const [updatedApplication] = await db
    .update(farmApplications)
    .set({
      status: 'approved',
      reviewedBy: 'system',
      reviewedAt: new Date(),
      reviewNotes: 'Auto-approved: Free tier',
      assignedTenantId: tenantId,
      assignedFarmId: farmId,
      updatedAt: new Date(),
    })
    .where(eq(farmApplications.id, applicationId))
    .returning();

  // Create Clerk organization for the user
  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    
    const org = await client.organizations.createOrganization({
      name: application.farmName,
      slug: `${slug}-${farmId.split('-').pop()}`,
      createdBy: applicantId,
      publicMetadata: {
        farmId,
        tenantId,
        plan: 'free',
      },
    });

    // Update tenant with Clerk org ID
    await db
      .update(tenants)
      .set({ id: org.id }) // Use Clerk org ID as tenant ID
      .where(eq(tenants.id, tenantId));

    // Update tenant member with new tenant ID
    await db
      .update(tenantMembers)
      .set({ tenantId: org.id })
      .where(eq(tenantMembers.tenantId, tenantId));

    // Update subscription with new tenant ID
    await db
      .update(subscriptions)
      .set({ tenantId: org.id })
      .where(eq(subscriptions.tenantId, tenantId));

    // Update application with Clerk org ID
    await db
      .update(farmApplications)
      .set({ assignedTenantId: org.id })
      .where(eq(farmApplications.id, applicationId));

    console.log(`Auto-approved free tier: ${farmId} -> Clerk Org: ${org.id}`);
  } catch (clerkError) {
    console.error('Failed to create Clerk organization:', clerkError);
    // Continue - tenant is created in DB, user can still use it
  }

  // Log activity
  await logActivity(
    'platform',
    'system',
    'System',
    'farm_application_auto_approved',
    { farmName: application.farmName, farmId, plan: 'free' }
  );

  return {
    application: updatedApplication,
    tenant: { id: tenantId, farmId },
  };
}

/**
 * Upload payment slip for an application
 */
export async function uploadPaymentSlip(input: UploadPaymentSlipInput) {
  const db = getDrizzle();

  const [application] = await db
    .update(farmApplications)
    .set({
      paymentSlipUrl: input.paymentSlipUrl,
      paymentSlipProvider: input.paymentSlipProvider,
      paymentAmount: input.paymentAmount,
      paymentDate: input.paymentDate,
      paymentReference: input.paymentReference,
      status: 'payment_uploaded',
      updatedAt: new Date(),
    })
    .where(eq(farmApplications.id, input.applicationId))
    .returning();

  return application;
}

/**
 * Review and approve/reject a farm application
 */
export async function reviewFarmApplication(input: ReviewApplicationInput) {
  const db = getDrizzle();

  // Get the application
  const [application] = await db
    .select()
    .from(farmApplications)
    .where(eq(farmApplications.id, input.applicationId))
    .limit(1);

  if (!application) {
    throw new Error('Application not found');
  }

  if (input.action === 'approve') {
    // Generate unique Farm ID
    const farmId = await generateFarmId();

    // Create tenant (organization) in database
    const tenantId = nanoid();
    const slug = application.farmName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    await db.insert(tenants).values({
      id: tenantId,
      slug: `${slug}-${farmId.split('-').pop()}`,
      farmName: application.farmName,
      language: 'en',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      animalTypes: application.animalTypes as string[],
    });

    // Create subscription
    const subscriptionId = nanoid();
    const renewDate = new Date();
    renewDate.setMonth(renewDate.getMonth() + 1);

    await db.insert(subscriptions).values({
      id: subscriptionId,
      tenantId,
      plan: application.requestedPlan,
      status: 'active',
      gateway: 'bank_transfer',
      renewDate,
      amount: getPlanPrice(application.requestedPlan),
      currency: 'PKR',
    });

    // Add applicant as farm owner
    const memberId = nanoid();
    await db.insert(tenantMembers).values({
      id: memberId,
      tenantId,
      userId: application.applicantId,
      role: 'farm_owner',
      status: 'active',
    });

    // Update application
    const [updatedApplication] = await db
      .update(farmApplications)
      .set({
        status: 'approved',
        reviewedBy: input.reviewerId,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes,
        assignedTenantId: tenantId,
        assignedFarmId: farmId,
        updatedAt: new Date(),
      })
      .where(eq(farmApplications.id, input.applicationId))
      .returning();

    // Log activity
    await logActivity(
      'platform',
      input.reviewerId,
      'Super Admin',
      'farm_application_approved',
      { farmName: application.farmName, farmId }
    );

    return {
      application: updatedApplication,
      tenant: { id: tenantId, farmId },
    };
  } else {
    // Reject application
    const [updatedApplication] = await db
      .update(farmApplications)
      .set({
        status: 'rejected',
        reviewedBy: input.reviewerId,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes,
        rejectionReason: input.rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(farmApplications.id, input.applicationId))
      .returning();

    // Log activity
    await logActivity(
      'platform',
      input.reviewerId,
      'Super Admin',
      'farm_application_rejected',
      { farmName: application.farmName, reason: input.rejectionReason }
    );

    return { application: updatedApplication };
  }
}

/**
 * Get all farm applications (for super admin)
 */
export async function getAllFarmApplications(status?: FarmApplicationStatus) {
  const db = getDrizzle();

  const query = db
    .select({
      application: farmApplications,
      applicant: platformUsers,
    })
    .from(farmApplications)
    .leftJoin(platformUsers, eq(farmApplications.applicantId, platformUsers.id))
    .orderBy(desc(farmApplications.createdAt));

  if (status) {
    return query.where(eq(farmApplications.status, status));
  }

  return query;
}

/**
 * Get applications by user
 */
export async function getUserFarmApplications(userId: string) {
  const db = getDrizzle();

  return db
    .select()
    .from(farmApplications)
    .where(eq(farmApplications.applicantId, userId))
    .orderBy(desc(farmApplications.createdAt));
}

/**
 * Get single application by ID
 */
export async function getFarmApplicationById(id: string) {
  const db = getDrizzle();

  const [result] = await db
    .select({
      application: farmApplications,
      applicant: platformUsers,
    })
    .from(farmApplications)
    .leftJoin(platformUsers, eq(farmApplications.applicantId, platformUsers.id))
    .where(eq(farmApplications.id, id))
    .limit(1);

  return result;
}

/**
 * Get plan price in PKR
 */
function getPlanPrice(plan: SubscriptionPlan): number {
  const prices: Record<SubscriptionPlan, number> = {
    free: 0,
    professional: 499900, // 4,999 PKR in paisa
    farm: 1299900, // 12,999 PKR in paisa
    enterprise: 0, // Custom pricing
  };
  return prices[plan] || 0;
}

/**
 * Get dashboard stats for super admin
 * Uses Supabase REST API instead of direct postgres
 */
export async function getAdminDashboardStats() {
  try {
    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    // Get application stats
    const { count: totalApplications } = await supabase
      .from('farm_applications')
      .select('*', { count: 'exact', head: true });

    const { count: pendingApplications } = await supabase
      .from('farm_applications')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'payment_uploaded']);

    const { count: approvedApplications } = await supabase
      .from('farm_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedApplications } = await supabase
      .from('farm_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    // Get tenant stats
    const { count: totalTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    const { count: activeTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // Get user stats
    const { count: totalUsers } = await supabase
      .from('platform_users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('platform_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return {
      applications: {
        totalApplications: totalApplications || 0,
        pendingApplications: pendingApplications || 0,
        approvedApplications: approvedApplications || 0,
        rejectedApplications: rejectedApplications || 0,
      },
      tenants: {
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
      },
      users: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
      },
    };
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    // Return default stats on error
    return {
      applications: {
        totalApplications: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
      },
      tenants: {
        totalTenants: 0,
        activeTenants: 0,
      },
      users: {
        totalUsers: 0,
        activeUsers: 0,
      },
    };
  }
}
