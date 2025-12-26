import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";

// GET /api/vaccination-schedules - Fetch all vaccination schedules
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
    const species = searchParams.get("species");
    const priority = searchParams.get("priority");
    const governmentProgram = searchParams.get("government_program");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("vaccination_schedules")
      .select(`
        *,
        disease:diseases(id, name, category),
        vaccine_medicine:medicines(id, name, brand_name, manufacturer)
      `, { count: "exact" })
      .order("species")
      .order("priority", { ascending: false })
      .order("animal_age_start_months");

    // Apply filters
    if (species) {
      query = query.eq("species", species);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (governmentProgram !== null) {
      query = query.eq("government_program", governmentProgram === "true");
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: schedules, error, count } = await query;

    if (error) {
      console.error("Error fetching vaccination schedules:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch vaccination schedules" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedules,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in vaccination schedules GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/vaccination-schedules - Create a new vaccination schedule
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
    if (!body.species || !body.animal_age_start_months || !body.dose_number) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create vaccination schedule
    const { data: schedule, error } = await supabase
      .from("vaccination_schedules")
      .insert({
        disease_id: body.disease_id,
        vaccine_medicine_id: body.vaccine_medicine_id,
        species: body.species,
        animal_age_start_months: body.animal_age_start_months,
        animal_age_start_label: body.animal_age_start_label,
        dose_number: body.dose_number,
        interval_from_previous_days: body.interval_from_previous_days,
        booster_interval_months: body.booster_interval_months,
        recommended_season: body.recommended_season,
        recommended_months: body.recommended_months || [],
        route: body.route,
        dosage: body.dosage,
        priority: body.priority || "recommended",
        government_program: body.government_program || false,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating vaccination schedule:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create vaccination schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule,
      message: "Vaccination schedule created successfully",
    });
  } catch (error) {
    console.error("Error in vaccination schedules POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
