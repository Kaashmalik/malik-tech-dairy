// Admin API - List and Create farms
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Use Supabase REST API
    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    const { data: farms, error } = await supabase
      .from('tenants')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching farms:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch farms' }, { status: 500 });
    }

    // Get user counts per farm
    const farmsWithStats = await Promise.all(
      (farms || []).map(async (farm: Record<string, unknown>) => {
        const { count: userCount } = await supabase
          .from('tenant_members')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', farm.id);

        return {
          id: farm.id,
          farmName: farm.farm_name,
          slug: farm.slug,
          plan: 'professional',
          status: 'active',
          animalCount: 0,
          userCount: userCount || 0,
          createdAt: farm.created_at,
        };
      })
    );

    return NextResponse.json({ success: true, data: farmsWithStats });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST - Create a new farm
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { farmName, ownerName, email, phone, city, province, plan } = body;

    if (!farmName || !ownerName || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Generate slug from farm name
    const slug = farmName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const farmId = `MTD-${Date.now().toString(36).toUpperCase()}`;

    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    // Create tenant in Supabase
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
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
      console.error('Error creating tenant:', tenantError);
      return NextResponse.json({ success: false, error: 'Failed to create farm' }, { status: 500 });
    }

    // Try to create Clerk organization (optional, may fail if user doesn't exist)
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
    } catch (clerkError) {
      console.warn('Could not create Clerk organization:', clerkError);
      // Continue anyway - farm is created in Supabase
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: farmId,
        farmName: farmName,
        slug: slug,
      },
      message: 'Farm created successfully'
    });
  } catch (error) {
    console.error('Error creating farm:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
