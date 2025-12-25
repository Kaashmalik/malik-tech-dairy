// User Farms API - Get farms the user has access to
// GET: Returns all farms/tenants where the user is a member
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  status: string;
  join_date: string;
  tenants: {
    id: string;
    slug: string;
    farm_name: string;
    logo_url: string | null;
    primary_color: string;
    language: string;
    currency: string;
    animal_types: string[];
    created_at: string;
  };
}
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = getSupabaseClient();
    // Get all tenant memberships for this user
    const { data: memberships, error: memberError } = await supabase
      .from('tenant_members')
      .select(
        `
        id,
        tenant_id,
        user_id,
        role,
        status,
        join_date,
        tenants (
          id,
          slug,
          farm_name,
          logo_url,
          primary_color,
          language,
          currency,
          animal_types,
          created_at
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'active');
    if (memberError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch farms', details: memberError.message },
        { status: 500 }
      );
    }
    // Also get user's applications
    const { data: applications } = (await supabase
      .from('farm_applications')
      .select('*')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })) as { data: any[] | null };
    // Transform memberships to farm format
    const farms = ((memberships as TenantMember[]) || []).map(m => ({
      id: m.tenant_id,
      slug: m.tenants?.slug,
      name: m.tenants?.farm_name,
      logoUrl: m.tenants?.logo_url,
      primaryColor: m.tenants?.primary_color,
      role: m.role,
      joinedAt: m.join_date,
      animalTypes: m.tenants?.animal_types || [],
    }));
    // Transform applications
    const appsList = (applications || []).map((app: any) => ({
      id: app.id,
      farmName: app.farm_name,
      status: app.status,
      requestedPlan: app.requested_plan,
      assignedFarmId: app.assigned_farm_id,
      createdAt: app.created_at,
      reviewedAt: app.reviewed_at,
    }));
    return NextResponse.json({
      success: true,
      data: {
        farms,
        applications: appsList,
        hasFarms: farms.length > 0,
        pendingApplications: appsList.filter(
          a => a.status === 'pending' || a.status === 'payment_uploaded'
        ).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}