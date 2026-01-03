// Super Admin - Farm Applications Management API
// GET: List all applications
// Requires super_admin role
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js';

// Helper to check if user is super admin
async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient() as SupabaseClient<Database>;
  const { data: user } = await supabase
    .from('platform_users')
    .select('platform_role')
    .eq('id', userId)
    .single();

  // Safe check if user exists and has platform_role
  if (!user) return false;

  return (user as any).platform_role === 'super_admin';
}
// GET: List all farm applications (super admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
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
    const supabase = getSupabaseClient() as SupabaseClient<Database>;
    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeStats = searchParams.get('stats') === 'true';
    // Build query
    // Build query with conditional filter
    let query = supabase
      .from('farm_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      // @ts-ignore - Dynamic query building causes type inference issues
      query = query.eq('status', status);
    }

    // Explicitly type the result to avoid 'never' inference
    const { data: applications, error } = (await query) as {
      data: Database['public']['Tables']['farm_applications']['Row'][] | null;
      error: any;
    };
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
    // Transform to camelCase for frontend
    const transformedApplications = (applications || []).map(app => ({
      application: {
        id: app.id,
        farmName: app.farm_name,
        ownerName: app.owner_name,
        email: app.email,
        phone: app.phone,
        address: app.address,
        city: app.city,
        province: app.province,
        animalTypes: app.animal_types,
        estimatedAnimals: app.estimated_animals,
        requestedPlan: app.requested_plan,
        status: app.status,
        paymentSlipUrl: app.payment_slip_url,
        paymentAmount: app.payment_amount,
        assignedFarmId: app.assigned_farm_id,
        reviewedBy: app.reviewed_by,
        reviewedAt: app.reviewed_at,
        reviewNotes: app.review_notes,
        rejectionReason: app.rejection_reason,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
      },
    }));
    // Get stats if requested
    let stats = null;
    if (includeStats) {
      const [
        { count: totalApplications },
        { count: pendingApplications },
        { count: approvedApplications },
        { count: rejectedApplications },
      ] = await Promise.all([
        supabase.from('farm_applications').select('*', { count: 'exact', head: true }),
        supabase
          .from('farm_applications')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'payment_uploaded']),
        supabase
          .from('farm_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('farm_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected'),
      ]);
      stats = {
        applications: {
          totalApplications: totalApplications || 0,
          pendingApplications: pendingApplications || 0,
          approvedApplications: approvedApplications || 0,
          rejectedApplications: rejectedApplications || 0,
        },
      };
    }
    return NextResponse.json({
      success: true,
      data: {
        applications: transformedApplications,
        stats,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
