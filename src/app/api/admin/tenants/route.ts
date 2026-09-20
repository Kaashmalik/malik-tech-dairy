// Super Admin - List all tenants (Supabase REST)
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Super Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: farms, error } = await (supabase.from('tenants') as any)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin tenants error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tenants' },
        { status: 500 }
      );
    }

    const tenants = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (farms || []).map(async (farm: any) => {
        const [{ count: animalCount }, { count: userCount }, { data: sub }] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('animals') as any)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', farm.id)
            .neq('status', 'deleted'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('tenant_members') as any)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', farm.id),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('subscriptions') as any)
            .select('plan, status')
            .eq('tenant_id', farm.id)
            .maybeSingle(),
        ]);

        return {
          id: farm.id,
          farmName: farm.farm_name,
          subdomain: farm.slug,
          plan: sub?.plan || farm.subscription_plan || 'free',
          status: sub?.status || farm.subscription_status || 'active',
          subscriptionStatus: sub?.status || farm.subscription_status || 'active',
          animalCount: animalCount || 0,
          userCount: userCount || 0,
          createdAt: farm.created_at,
        };
      })
    );

    return NextResponse.json({ success: true, tenants, data: tenants });
  } catch (error) {
    console.error('Admin tenants unexpected:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tenants' }, { status: 500 });
  }
}
