// Farm Applications API Routes
// POST: Create new application
// GET: List user's applications
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/server';
const createApplicationSchema = z.object({
  farmName: z.string().min(2).max(255),
  ownerName: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  animalTypes: z.array(z.string()).optional(),
  estimatedAnimals: z.number().int().positive().optional(),
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

    const supabase = getSupabaseClient();

    // Ensure user exists in platform_users
    const { data: existingUser, error: userFetchError } = await supabase
      .from('platform_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userFetchError && userFetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error fetching user:', userFetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify user account',
        },
        { status: 500 }
      );
    }

    if (!existingUser) {
      // Create platform user
      const { error: userCreateError } = await supabase.from('platform_users').insert([
        {
          id: userId,
          email: validatedData.email,
          name: validatedData.ownerName,
          phone: validatedData.phone,
          platform_role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (userCreateError) {
        console.error('Error creating platform user:', userCreateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create user account',
          },
          { status: 500 }
        );
      }
    }

    // Generate application ID
    const applicationId = `APP-${Date.now().toString(36).toUpperCase()}`;

    // Determine initial status based on plan and payment
    // Valid statuses: 'pending', 'payment_uploaded', 'under_review', 'approved', 'rejected'
    const isPaidPlan = validatedData.requestedPlan !== 'free';
    const status =
      isPaidPlan && validatedData.paymentSlipUrl
        ? 'payment_uploaded' // Paid plan with payment slip uploaded
        : 'pending'; // Free plan or paid plan awaiting payment

    // Create application
    const { data: application, error: createError } = await supabase
      .from('farm_applications')
      .insert([
        {
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
          status: status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating farm application:', createError);
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
    const successMessage =
      isPaidPlan && !validatedData.paymentSlipUrl
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

    // Handle unexpected errors
    console.error('Unexpected error in farm application creation:', error);
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
