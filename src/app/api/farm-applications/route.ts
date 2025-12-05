// Farm Applications API Routes
// POST: Create new application
// GET: List user's applications

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase';

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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createApplicationSchema.parse(body);

    const supabase = getSupabaseClient();

    // Ensure user exists in platform_users
    const { data: existingUser } = await supabase
      .from('platform_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      // Create platform user
      await supabase.from('platform_users').insert([{
        id: userId,
        email: validatedData.email,
        name: validatedData.ownerName,
        phone: validatedData.phone,
        platform_role: 'user',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
    }

    // Generate application ID
    const applicationId = `APP-${Date.now().toString(36).toUpperCase()}`;

    // Determine initial status based on plan
    const isPaidPlan = validatedData.requestedPlan !== 'free';
    const status = isPaidPlan && validatedData.paymentSlipUrl 
      ? 'payment_uploaded' 
      : isPaidPlan 
        ? 'pending_payment'
        : 'pending';

    // Create application
    const { data: application, error } = await supabase
      .from('farm_applications')
      .insert([{
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
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
      message: isPaidPlan && !validatedData.paymentSlipUrl 
        ? 'Application submitted. Please upload payment slip to complete.'
        : 'Application submitted successfully!',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating farm application:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}

// GET: List user's farm applications
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: applications, error } = await supabase
      .from('farm_applications')
      .select('*')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: applications || [],
    });
  } catch (error) {
    console.error('Error fetching farm applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
