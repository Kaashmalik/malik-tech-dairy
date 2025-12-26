import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";

// GET /api/animal-treatments - Fetch animal treatments
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const tenant = await getCurrentTenant();

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const animalId = searchParams.get("animal_id");
    const diseaseId = searchParams.get("disease_id");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("animal_treatments")
      .select(`
        *,
        animal:animals(id, tag_id, name, species, breed),
        disease:diseases(id, name, category),
        treatment_protocol:treatment_protocols(id, name)
      `, { count: "exact" })
      .eq("tenant_id", tenant.id)
      .order("treatment_start_date", { ascending: false });

    // Apply filters
    if (animalId) {
      query = query.eq("animal_id", animalId);
    }

    if (diseaseId) {
      query = query.eq("disease_id", diseaseId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("treatment_start_date", startDate);
    }

    if (endDate) {
      query = query.lte("treatment_start_date", endDate);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: treatments, error, count } = await query;

    if (error) {
      console.error("Error fetching animal treatments:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch animal treatments" },
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
    console.error("Error in animal treatments GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/animal-treatments - Create a new animal treatment
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const tenant = await getCurrentTenant();

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.animal_id || !body.diagnosis_date || !body.treatment_start_date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify animal belongs to tenant
    const { data: animal, error: animalError } = await supabase
      .from("animals")
      .select("id")
      .eq("id", body.animal_id)
      .eq("tenant_id", tenant.id)
      .single();

    if (animalError || !animal) {
      return NextResponse.json(
        { success: false, error: "Animal not found" },
        { status: 404 }
      );
    }

    // Create treatment record
    const { data: treatment, error } = await supabase
      .from("animal_treatments")
      .insert({
        tenant_id: tenant.id,
        animal_id: body.animal_id,
        health_record_id: body.health_record_id,
        disease_id: body.disease_id,
        condition_name: body.condition_name,
        symptoms_observed: body.symptoms_observed || [],
        diagnosis_date: body.diagnosis_date,
        diagnosed_by: body.diagnosed_by,
        diagnosis_method: body.diagnosis_method,
        severity: body.severity || "moderate",
        treatment_protocol_id: body.treatment_protocol_id,
        treatment_start_date: body.treatment_start_date,
        treatment_end_date: body.treatment_end_date,
        medicines_given: body.medicines_given || [],
        status: body.status || "in_treatment",
        outcome_date: body.outcome_date,
        outcome_notes: body.outcome_notes,
        follow_up_required: body.follow_up_required || false,
        next_follow_up_date: body.next_follow_up_date,
        total_cost: body.total_cost || 0,
        recorded_by: body.recorded_by,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating animal treatment:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create animal treatment" },
        { status: 500 }
      );
    }

    // Create health record if not provided
    if (!body.health_record_id) {
      const { error: healthRecordError } = await supabase
        .from("health_records")
        .insert({
          tenant_id: tenant.id,
          animal_id: body.animal_id,
          record_type: "treatment",
          date: body.treatment_start_date,
          title: body.disease_id ? `Treatment for ${body.disease_id}` : "Treatment",
          description: body.condition_name || "General treatment",
          recorded_by: body.recorded_by,
          treatment_id: treatment.id,
        });

      if (healthRecordError) {
        console.error("Error creating health record:", healthRecordError);
      }
    }

    return NextResponse.json({
      success: true,
      data: treatment,
      message: "Animal treatment created successfully",
    });
  } catch (error) {
    console.error("Error in animal treatments POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
