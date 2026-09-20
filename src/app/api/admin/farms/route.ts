// Admin API - List and Create farms
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
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
      return NextResponse.json({ success: false, error: 'Failed to fetch farms' }, { status: 500 });
    }

    const farmsWithStats = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (farms || []).map(async (farm: any) => {
        const [{ count: userCount }, { count: animalCount }, { data: sub }] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('tenant_members') as any)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', farm.id),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('animals') as any)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', farm.id)
            .neq('status', 'deleted'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('subscriptions') as any)
            .select('plan, status')
            .eq('tenant_id', farm.id)
            .maybeSingle(),
        ]);
        return {
          id: farm.id,
          farmName: farm.farm_name,
          slug: farm.slug,
          plan: sub?.plan || farm.subscription_plan || 'free',
          status: sub?.status || farm.subscription_status || 'active',
          animalCount: animalCount || 0,
          userCount: userCount || 0,
          createdAt: farm.created_at,
        };
      })
    );
    return NextResponse.json({ success: true, data: farmsWithStats });
  } catch (error) {
    console.error('Admin farms GET error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST - Create a new farm
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { farmName, ownerName, email, phone, city, province, plan } = body;
    if (!farmName || !ownerName || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const slug = farmName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const farmId = `MTD-${Date.now().toString(36).toUpperCase()}`;
    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: tenantError } = await (supabase.from('tenants') as any)
      .insert({
        id: farmId,
        farm_name: farmName,
        slug: slug,
        subscription_plan: plan || 'free',
        subscription_status: 'active',
        settings: {
          owner_name: ownerName,
          email: email,
          phone: phone,
          city: city,
          province: province,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (tenantError) {
      console.error('Create farm error:', tenantError);
      return NextResponse.json({ success: false, error: 'Failed to create farm' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('subscriptions') as any).upsert({
      id: `${farmId}_subscription`,
      tenant_id: farmId,
      plan: plan || 'free',
      status: 'active',
      gateway: 'bank_transfer',
      amount: 0,
      currency: 'PKR',
      renew_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    try {
      const client = await clerkClient();
      await client.organizations.createOrganization({
        name: farmName,
        slug: slug,
        createdBy: userId,
        publicMetadata: {
          farmId: farmId,
          plan: plan,
        },
      });
    } catch {
      // Continue — farm is created in Supabase
    }
    return NextResponse.json({
      success: true,
      data: {
        id: farmId,
        farmName: farmName,
        slug: slug,
      },
      message: 'Farm created successfully',
    });
  } catch (error) {
    console.error('Admin farms POST error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
