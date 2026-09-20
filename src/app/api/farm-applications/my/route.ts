// API Route: Get current user's farm applications (Supabase REST)
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function mapApplication(row: Record<string, unknown>) {
  return {
    id: row.id,
    applicantId: row.applicant_id,
    farmName: row.farm_name,
    ownerName: row.owner_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    province: row.province,
    animalTypes: row.animal_types,
    estimatedAnimals: row.estimated_animals,
    requestedPlan: row.requested_plan,
    status: row.status,
    paymentSlipUrl: row.payment_slip_url,
    paymentSlipProvider: row.payment_slip_provider,
    paymentAmount: row.payment_amount,
    paymentDate: row.payment_date,
    paymentReference: row.payment_reference,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    rejectionReason: row.rejection_reason,
    assignedTenantId: row.assigned_tenant_id,
    assignedFarmId: row.assigned_farm_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error } = await (supabase.from('farm_applications') as any)
      .select('*')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('farm-applications/my error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json({ success: true, data: null }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      data: mapApplication(application),
    });
  } catch (error) {
    console.error('farm-applications/my unexpected:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
