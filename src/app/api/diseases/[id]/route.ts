import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";

// GET /api/diseases/[id] - Fetch a specific disease
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const tenant = await getCurrentTenant();

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 401 }
      );
    }

    // Fetch disease
    const { data: disease, error } = await supabase
      .from("diseases")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Disease not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching disease:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch disease" },
        { status: 500 }
      );
    }

    // Fetch related treatments
    const { data: treatments, error: treatmentsError } = await supabase
      .from("disease_treatments")
      .select(`
        *,
        medicine:medicines(*)
      `)
      .eq("disease_id", id)
      .order("treatment_line");

    if (treatmentsError) {
      console.error("Error fetching treatments:", treatmentsError);
    }

    // Fetch treatment protocols
    const { data: protocols, error: protocolsError } = await supabase
      .from("treatment_protocols")
      .select("*")
      .eq("disease_id", id)
      .eq("is_active", true);

    if (protocolsError) {
      console.error("Error fetching protocols:", protocolsError);
    }

    // Fetch vaccination schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("vaccination_schedules")
      .select(`
        *,
        vaccine_medicine:medicines(*)
      `)
      .eq("disease_id", id)
      .order("species");

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...disease,
        treatments: treatments || [],
        protocols: protocols || [],
        vaccination_schedules: schedules || [],
      },
    });
  } catch (error) {
    console.error("Error in disease GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/diseases/[id] - Update a disease
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const tenant = await getCurrentTenant();

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update disease
    const { data: disease, error } = await supabase
      .from("diseases")
      .update({
        name: body.name,
        name_urdu: body.name_urdu,
        local_name: body.local_name,
        category: body.category,
        subcategory: body.subcategory,
        causative_agent: body.causative_agent,
        affected_species: body.affected_species,
        symptoms: body.symptoms,
        early_signs: body.early_signs,
        advanced_signs: body.advanced_signs,
        transmission_mode: body.transmission_mode,
        incubation_period: body.incubation_period,
        mortality_rate: body.mortality_rate,
        morbidity_rate: body.morbidity_rate,
        zoonotic: body.zoonotic,
        peak_season: body.peak_season,
        high_risk_regions: body.high_risk_regions,
        preventive_measures: body.preventive_measures,
        vaccination_available: body.vaccination_available,
        economic_impact_score: body.economic_impact_score,
        milk_production_impact: body.milk_production_impact,
        severity_default: body.severity_default,
        is_notifiable: body.is_notifiable,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Disease not found" },
          { status: 404 }
        );
      }
      console.error("Error updating disease:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update disease" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: disease,
      message: "Disease updated successfully",
    });
  } catch (error) {
    console.error("Error in disease PUT:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/diseases/[id] - Delete a disease
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const tenant = await getCurrentTenant();

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 401 }
      );
    }

    // Check if disease is referenced in treatments
    const { data: references } = await supabase
      .from("disease_treatments")
      .select("id")
      .eq("disease_id", id)
      .limit(1);

    if (references && references.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete disease with existing treatments" },
        { status: 400 }
      );
    }

    // Delete disease
    const { error } = await supabase
      .from("diseases")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Disease not found" },
          { status: 404 }
        );
      }
      console.error("Error deleting disease:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete disease" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Disease deleted successfully",
    });
  } catch (error) {
    console.error("Error in disease DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
