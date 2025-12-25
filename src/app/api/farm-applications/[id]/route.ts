// Single Farm Application API Routes
// GET: Get application details
// PATCH: Update application (upload payment slip)
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase';
const uploadPaymentSchema = z.object({
  paymentSlipUrl: z.string().url(),
  paymentSlipProvider: z.enum(['cloudinary', 'supabase']).optional(),
  paymentAmount: z.number().int().positive().optional(),
  paymentDate: z.string().optional(),
  paymentReference: z.string().optional(),
});
// GET: Get application details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = getSupabaseClient();
    const { data: application, error } = await supabase
      .from('farm_applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    // Only allow owner or admin to view
    if (application.applicant_id !== userId) {
      // Check if user is super admin
      const { data: user } = await supabase
        .from('platform_users')
        .select('platform_role')
        .eq('id', userId)
        .single();
      if (!user || user.platform_role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    return NextResponse.json({
      success: true,
      data: { application },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}
// PATCH: Upload payment slip
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = getSupabaseClient();
    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('farm_applications')
      .select('applicant_id, status')
      .eq('id', id)
      .single();
    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (existing.applicant_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const body = await request.json();
    const validatedData = uploadPaymentSchema.parse(body);
    // Update application with payment slip
    const { data: application, error: updateError } = await supabase
      .from('farm_applications')
      .update({
        payment_slip_url: validatedData.paymentSlipUrl,
        payment_slip_provider: validatedData.paymentSlipProvider || 'cloudinary',
        payment_amount: validatedData.paymentAmount || null,
        payment_date: validatedData.paymentDate || new Date().toISOString(),
        payment_reference: validatedData.paymentReference || null,
        status: 'payment_uploaded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}