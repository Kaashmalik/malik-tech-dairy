import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getTenantContext, getTenantInfo } from '@/lib/tenant/context';

// GET /api/animal-vaccinations/due - Get upcoming and overdue vaccinations
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { tenantId } = await getTenantContext();
    const tenant = await getTenantInfo(tenantId);

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

    // Fetch upcoming vaccinations (next 30 days)
    // @ts-ignore - Table may not exist in types
    const { data: upcoming, error: upcomingError } = await supabase
      .from('animal_vaccinations')
      .select(
        `
        *,
        animal:animals(id, tag_id, name, species),
        vaccine:medicines(id, name, brand_name),
        disease:diseases(id, name)
      `
      )
      .eq('tenant_id', tenant.id)
      .eq('status', 'scheduled')
      .gte('vaccination_date', today)
      .lte('vaccination_date', thirtyDaysLaterStr)
      .order('vaccination_date');

    // Fetch overdue vaccinations
    // @ts-ignore - Table may not exist in types
    const { data: overdue, error: overdueError } = await supabase
      .from('animal_vaccinations')
      .select(
        `
        *,
        animal:animals(id, tag_id, name, species),
        vaccine:medicines(id, name, brand_name),
        disease:diseases(id, name)
      `
      )
      .eq('tenant_id', tenant.id)
      .eq('status', 'scheduled')
      .lt('vaccination_date', today)
      .order('vaccination_date', { ascending: false });

    if (upcomingError || overdueError) {
      // @ts-ignore
      console.error('Error fetching due vaccinations:', upcomingError || overdueError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch due vaccinations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        upcoming: upcoming || [],
        overdue: overdue || [],
        summary: {
          // @ts-ignore
          upcoming_count: upcoming?.length || 0,
          // @ts-ignore
          overdue_count: overdue?.length || 0,
          // @ts-ignore
          total_due: (upcoming?.length || 0) + (overdue?.length || 0),
        },
      },
    });
  } catch (error) {
    console.error('Error in due vaccinations GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
