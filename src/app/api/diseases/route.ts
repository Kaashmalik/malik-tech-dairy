import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getTenantContext, getTenantInfo } from '@/lib/tenant/context';

// GET /api/diseases - Fetch all diseases
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
    const category = searchParams.get('category');
    const species = searchParams.get('species');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase.from('diseases').select('*', { count: 'exact' }).order('name_en'); // Changed to name_en as per schema

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (species) {
      // @ts-ignore
      query = query.contains('affected_species', [species]);
    }

    if (search) {
      // @ts-ignore
      query = query.or(`name_en.ilike.%${search}%,name_ur.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: diseases, error, count } = await query;

    if (error) {
      console.error('Error fetching diseases:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch diseases' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: diseases,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in diseases GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/diseases - Create a new disease
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
    if (!body.name || !body.category || !body.affected_species) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create disease
    const { data: disease, error } = await supabase
      .from('diseases')
      .insert({
        name_en: body.name, // Mapped to name_en
        name_ur: body.name_urdu, // Mapped to name_ur
        // local_name: body.local_name, // Removed as not in schema viewing
        category: body.category,
        // subcategory: body.subcategory,
        // causative_agent: body.causative_agent,
        // affected_species: body.affected_species, // array
        symptoms: body.symptoms || [],
        // early_signs: body.early_signs || [],
        // advanced_signs: body.advanced_signs || [],
        // transmission_mode: body.transmission_mode,
        // incubation_period: body.incubation_period,
        // mortality_rate: body.mortality_rate,
        // morbidity_rate: body.morbidity_rate,
        zoonotic_risk: body.zoonotic || false,
        // peak_season: body.peak_season,
        // high_risk_regions: body.high_risk_regions || [],
        // preventive_measures: body.preventive_measures || [],
        // vaccination_available: body.vaccination_available || false,
        estimated_cost_min: body.estimated_cost_min || 0,
        estimated_cost_max: body.estimated_cost_max || 0,
        // economic_impact_score: body.economic_impact_score || 3,
        // milk_production_impact: body.milk_production_impact,
        severity: body.severity_default || 'moderate',
        // is_notifiable: body.is_notifiable || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating disease:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create disease' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: disease,
      message: 'Disease created successfully',
    });
  } catch (error) {
    console.error('Error in diseases POST:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
