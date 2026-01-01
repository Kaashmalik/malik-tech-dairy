import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getTenantContext, getTenantInfo } from '@/lib/tenant/context';

// GET /api/animal-treatments - Fetch animal treatments
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
    const diseaseId = searchParams.get('disease_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('treatment_records')
      .select(
        `
        *,
        animal:animals(id, tag, name, species, breed),
        disease:diseases(id, name_en, category)
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenant.id)
      .order('start_date', { ascending: false });

    // Apply filters
    if (animalId) {
      query = query.eq('animal_id', animalId);
    }

    if (diseaseId) {
      query = query.eq('disease_id', diseaseId);
    }

    if (status) {
      query = query.eq('outcome', status);
    }

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: treatments, error, count } = await query;

    if (error) {
      console.error('Error fetching animal treatments:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch animal treatments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: treatments,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in animal treatments GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/animal-treatments - Create a new animal treatment
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
    if (!body.animal_id || !body.diagnosis || !body.start_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify animal belongs to tenant
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select('id')
      .eq('id', body.animal_id)
      .eq('tenant_id', tenant.id)
      .single();

    if (animalError || !animal) {
      return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
    }

    // Create treatment record
    // @ts-ignore - Ignore type check for now until database types are regenerated
    const { data: treatment, error } = await (supabase.from('treatment_records') as any)
      .insert({
        tenant_id: tenant.id,
        animal_id: body.animal_id,
        disease_id: body.disease_id, // Ensure disease_id is valid string or null if allowed
        symptoms_observed: body.symptoms_observed || [],
        diagnosis: body.diagnosis,
        treatment_given: body.treatment_given || [],
        medications: body.medications || [],
        veterinarian_name: body.veterinarian_name || 'Unknown',
        start_date: body.start_date,
        end_date: body.end_date,
        outcome: body.outcome || 'pending',
        notes: body.notes,
        cost: body.cost || 0,
        created_by: body.recorded_by || (await getTenantContext()).userId, // Fallback to current user
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating animal treatment:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create animal treatment' },
        { status: 500 }
      );
    }

    // Create health record
    // @ts-ignore
    const { error: healthRecordError } = await (supabase.from('health_records') as any).insert({
      tenant_id: tenant.id,
      animal_id: body.animal_id,
      type: 'treatment',
      date: body.start_date,
      description: body.diagnosis || 'Treatment Record',
      recorded_by: body.recorded_by || (await getTenantContext()).userId,
      // treatment_id: treatment.id, // Column doesn't exist in schema provided
    });

    if (healthRecordError) {
      console.error('Error creating health record:', healthRecordError);
    }

    return NextResponse.json({
      success: true,
      data: treatment,
      message: 'Animal treatment created successfully',
    });
  } catch (error) {
    console.error('Error in animal treatments POST:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
