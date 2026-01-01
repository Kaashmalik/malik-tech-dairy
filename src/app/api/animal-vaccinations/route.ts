import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getTenantContext, getTenantInfo } from '@/lib/tenant/context';

// GET /api/animal-vaccinations - Fetch animal vaccinations
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { tenantId } = await getTenantContext();
    const tenant = await getTenantInfo(tenantId);

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const animalId = searchParams.get('animal_id');
    const vaccineId = searchParams.get('vaccine_id');
    const diseaseId = searchParams.get('disease_id');
    const status = searchParams.get('status');
    const upcomingOnly = searchParams.get('upcoming_only') === 'true';
    const overdueOnly = searchParams.get('overdue_only') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // @ts-ignore - Table may not exist in types
    let query = supabase
      .from('animal_vaccinations')
      .select(
        `
        *,
        animal:animals(id, tag_id, name, species, breed, date_of_birth),
        vaccine:medicines(id, name, brand_name, manufacturer),
        disease:diseases(id, name, category),
        schedule:vaccination_schedules(id, dose_number, booster_interval_months)
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenant.id)
      .order('vaccination_date', { ascending: false });

    // Apply filters
    if (animalId) {
      query = query.eq('animal_id', animalId);
    }

    if (vaccineId) {
      query = query.eq('vaccine_id', vaccineId);
    }

    if (diseaseId) {
      query = query.eq('disease_id', diseaseId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (upcomingOnly) {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('status', 'scheduled').gte('vaccination_date', today);
    }

    if (overdueOnly) {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('status', 'scheduled').lt('vaccination_date', today);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: vaccinations, error, count } = await query;

    if (error) {
      console.error('Error fetching animal vaccinations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch animal vaccinations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vaccinations,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in animal vaccinations GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/animal-vaccinations - Create a new animal vaccination
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { tenantId } = await getTenantContext();
    const tenant = await getTenantInfo(tenantId);

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.animal_id || !body.vaccination_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify animal belongs to tenant
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select('id, species, date_of_birth')
      .eq('id', body.animal_id)
      .eq('tenant_id', tenant.id)
      .single();

    if (animalError || !animal) {
      return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
    }

    // Calculate next due date if schedule is provided
    let nextDueDate = body.next_due_date;
    if (body.schedule_id && !nextDueDate) {
      const { data: schedule } = await supabase
        .from('vaccination_schedules')
        .select('booster_interval_months')
        .eq('id', body.schedule_id)
        .single();

      // @ts-ignore
      if (schedule?.booster_interval_months) {
        const nextDate = new Date(body.vaccination_date);
        // @ts-ignore
        nextDate.setMonth(nextDate.getMonth() + schedule.booster_interval_months);
        nextDueDate = nextDate.toISOString().split('T')[0];
      }
    }

    // Create vaccination record
    // @ts-ignore
    const { data: vaccination, error } = await supabase
      .from('animal_vaccinations')
      .insert({
        tenant_id: tenant.id,
        animal_id: body.animal_id,
        vaccine_id: body.vaccine_id,
        disease_id: body.disease_id,
        vaccine_name: body.vaccine_name,
        vaccination_date: body.vaccination_date,
        administered_by: body.administered_by,
        batch_number: body.batch_number,
        dose_number: body.dose_number || 1,
        dosage: body.dosage,
        route: body.route,
        injection_site: body.injection_site,
        schedule_id: body.schedule_id,
        next_due_date: nextDueDate,
        adverse_reaction: body.adverse_reaction || false,
        reaction_details: body.reaction_details,
        reaction_severity: body.reaction_severity,
        cost: body.cost,
        status: body.status || 'administered',
        notes: body.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating animal vaccination:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create animal vaccination' },
        { status: 500 }
      );
    }

    // Create health record
    // @ts-ignore
    const { error: healthRecordError } = await supabase.from('health_records').insert({
      tenant_id: tenant.id,
      animal_id: body.animal_id,
      type: 'vaccination', // Changed from record_type to type to match schema
      date: body.vaccination_date,
      description: `Vaccination administered - ${body.dose_number ? `Dose ${body.dose_number}` : ''}`,
      recorded_by: body.administered_by,
      // vaccination_id: vaccination.id,
    });

    if (healthRecordError) {
      console.error('Error creating health record:', healthRecordError);
    }

    return NextResponse.json({
      success: true,
      data: vaccination,
      message: 'Animal vaccination created successfully',
    });
  } catch (error) {
    console.error('Error in animal vaccinations POST:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
