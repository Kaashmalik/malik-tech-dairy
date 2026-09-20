// API Route: Get Admin Statistics (Supabase REST)
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export const dynamic = 'force-dynamic';

const PLAN_MRR: Record<string, number> = {
  free: 0,
  starter: 2999,
  professional: 7999,
  farm: 7999,
  enterprise: 19999,
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super admin only' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const [
      { count: totalTenants },
      { count: totalAnimals },
      { count: totalUsers },
      { count: pendingApplications },
      { data: subscriptions },
    ] = await Promise.all([
      sb.from('tenants').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      sb.from('animals').select('*', { count: 'exact', head: true }).neq('status', 'deleted'),
      sb.from('platform_users').select('*', { count: 'exact', head: true }),
      sb
        .from('farm_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'payment_uploaded', 'under_review']),
      sb.from('subscriptions').select('plan, status'),
    ]);

    let activeTenants = 0;
    let trialTenants = 0;
    let monthlyRecurringRevenue = 0;

    for (const sub of subscriptions || []) {
      if (sub.status === 'active') {
        activeTenants++;
        monthlyRecurringRevenue += PLAN_MRR[sub.plan] || 0;
      } else if (sub.status === 'trial') {
        trialTenants++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalTenants: totalTenants || 0,
        activeTenants,
        trialTenants,
        monthlyRecurringRevenue,
        totalAnimals: totalAnimals || 0,
        totalUsers: totalUsers || 0,
        pendingApplications: pendingApplications || 0,
      },
      // Legacy flat shape for AdminDashboard.tsx
      totalTenants: totalTenants || 0,
      activeTenants,
      trialTenants,
      monthlyRecurringRevenue,
      totalAnimals: totalAnimals || 0,
      totalUsers: totalUsers || 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
