// Farm Applications API Routes
// POST: Create new application
// GET: List user's applications
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/server';
import { ensurePlatformUser } from '@/lib/auth/platform-user';
import { provisionFarm, ProvisioningError } from '@/lib/tenant/provision';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const OPEN_STATUSES = ['pending', 'payment_uploaded', 'under_review'];

const createApplicationSchema = z.object({
  farmName: z.string().min(2).max(255),
  ownerName: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  animalTypes: z.array(z.string()).optional(),
  estimatedAnimals: z.number().int().min(0).optional(),
  requestedPlan: z.enum(['free', 'professional', 'farm', 'enterprise']),
  paymentSlipUrl: z.string().optional(),
});
// POST: Create new farm application
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please sign in to submit an application',
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createApplicationSchema.parse(body);

    // Mirror the Clerk user into platform_users (idempotent, webhook-independent)
    await ensurePlatformUser(userId, { phone: validatedData.phone });

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applications = () => supabase.from('farm_applications') as any;

    // One open application per user; and the free plan is limited to one farm
    const { data: priorApps, error: priorError } = await applications()
      .select('id, status, requested_plan')
      .eq('applicant_id', userId);
    if (priorError) {
      throw new Error(`Failed to check existing applications: ${priorError.message}`);
    }
    const prior = (priorApps || []) as Array<{
      id: string;
      status: string;
      requested_plan: string;
    }>;
    const open = prior.find(a => OPEN_STATUSES.includes(a.status));
    if (open) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an application under review.',
          data: { id: open.id, status: open.status },
        },
        { status: 409 }
      );
    }
    if (
      validatedData.requestedPlan === 'free' &&
      prior.some(a => a.status === 'approved' && a.requested_plan === 'free')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'The free plan includes one farm. Upgrade to add more farms.',
        },
        { status: 409 }
      );
    }

    // Generate application ID
    const applicationId = `APP-${Date.now().toString(36).toUpperCase()}`;

    const isPaidPlan = validatedData.requestedPlan !== 'free';
    const now = new Date().toISOString();
    const baseRow = {
      id: applicationId,
      applicant_id: userId,
      farm_name: validatedData.farmName,
      owner_name: validatedData.ownerName,
      email: validatedData.email,
      phone: validatedData.phone,
      address: validatedData.address || null,
      city: validatedData.city || null,
      province: validatedData.province || null,
      animal_types: validatedData.animalTypes || [],
      estimated_animals: validatedData.estimatedAnimals || 0,
      requested_plan: validatedData.requestedPlan,
      payment_slip_url: validatedData.paymentSlipUrl || null,
      created_at: now,
      updated_at: now,
    };

    // Free plan: no review needed - create the farm right away
    if (!isPaidPlan) {
      const farm = await provisionFarm({
        ownerId: userId,
        farmName: validatedData.farmName,
        plan: 'free',
        animalTypes: validatedData.animalTypes,
      });

      const { data: application, error: createError } = await applications()
        .insert([
          {
            ...baseRow,
            status: 'approved',
            assigned_tenant_id: farm.tenantId,
            reviewed_at: now,
            review_notes: 'Auto-approved (free plan)',
          },
        ])
        .select()
        .single();
      if (createError) {
        // The farm exists and is usable; the application row is only an audit trail
        logger.error('Free farm provisioned but application record failed', createError, {
          tenantId: farm.tenantId,
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            ...(application || { id: applicationId }),
            autoApproved: true,
            tenantId: farm.tenantId,
            slug: farm.slug,
          },
          message: 'Your farm is ready!',
        },
        { status: 201 }
      );
    }

    // Paid plans go through payment verification by a super admin
    const status = validatedData.paymentSlipUrl ? 'payment_uploaded' : 'pending';
    const { data: application, error: createError } = await applications()
      .insert([{ ...baseRow, status }])
      .select()
      .single();

    if (createError) {
      logger.error('Error creating farm application', createError, { userId });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create application. Please try again.',
          details: process.env.NODE_ENV === 'development' ? createError.message : undefined,
        },
        { status: 500 }
      );
    }

    // Success response with appropriate message
    const successMessage = !validatedData.paymentSlipUrl
      ? 'Application submitted. Please upload payment slip to complete.'
      : 'Application submitted successfully!';

    return NextResponse.json(
      {
        success: true,
        data: application,
        message: successMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error - Please check your input',
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    if (error instanceof ProvisioningError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 502 });
    }

    // Handle unexpected errors
    logger.error('Unexpected error in farm application creation', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
// GET: List user's farm applications
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = getSupabaseClient();
    const { data: applications, error } = await supabase
      .from('farm_applications')
      .select('*')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      data: applications || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
