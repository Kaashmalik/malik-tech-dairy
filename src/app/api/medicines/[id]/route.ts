import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";

// GET /api/medicines/[id] - Fetch a specific medicine
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

    // Fetch medicine
    const { data: medicine, error } = await supabase
      .from("medicines")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Medicine not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching medicine:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch medicine" },
        { status: 500 }
      );
    }

    // Fetch diseases this medicine treats
    const { data: diseases, error: diseasesError } = await supabase
      .from("disease_treatments")
      .select(`
        *,
        disease:diseases(*)
      `)
      .eq("medicine_id", id)
      .order("disease(name)");

    if (diseasesError) {
      console.error("Error fetching diseases:", diseasesError);
    }

    // Check tenant inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from("tenant_medicine_inventory")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("medicine_id", id)
      .order("expiry_date");

    if (inventoryError) {
      console.error("Error fetching inventory:", inventoryError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...medicine,
        treats_diseases: diseases || [],
        inventory: inventory || [],
      },
    });
  } catch (error) {
    console.error("Error in medicine GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/medicines/[id] - Update a medicine
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

    // Update medicine
    const { data: medicine, error } = await supabase
      .from("medicines")
      .update({
        name: body.name,
        generic_name: body.generic_name,
        brand_name: body.brand_name,
        manufacturer: body.manufacturer,
        category: body.category,
        form: body.form,
        route: body.route,
        active_ingredients: body.active_ingredients,
        strength: body.strength,
        dosage_per_kg: body.dosage_per_kg,
        dosage_instructions: body.dosage_instructions,
        frequency: body.frequency,
        duration_days: body.duration_days,
        species_dosage: body.species_dosage,
        withdrawal_period_milk: body.withdrawal_period_milk,
        withdrawal_period_meat: body.withdrawal_period_meat,
        contraindications: body.contraindications,
        side_effects: body.side_effects,
        drug_interactions: body.drug_interactions,
        pregnancy_safe: body.pregnancy_safe,
        lactation_safe: body.lactation_safe,
        storage_conditions: body.storage_conditions,
        shelf_life_months: body.shelf_life_months,
        available_in_pakistan: body.available_in_pakistan,
        prescription_required: body.prescription_required,
        price_range_pkr: body.price_range_pkr,
        pack_sizes: body.pack_sizes,
        effectiveness_rating: body.effectiveness_rating,
        popularity_score: body.popularity_score,
        is_active: body.is_active,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Medicine not found" },
          { status: 404 }
        );
      }
      console.error("Error updating medicine:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update medicine" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: medicine,
      message: "Medicine updated successfully",
    });
  } catch (error) {
    console.error("Error in medicine PUT:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/medicines/[id] - Delete a medicine
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

    // Check if medicine is referenced in treatments
    const { data: references } = await supabase
      .from("disease_treatments")
      .select("id")
      .eq("medicine_id", id)
      .limit(1);

    if (references && references.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete medicine with existing treatments" },
        { status: 400 }
      );
    }

    // Delete medicine
    const { error } = await supabase
      .from("medicines")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Medicine not found" },
          { status: 404 }
        );
      }
      console.error("Error deleting medicine:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete medicine" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.error("Error in medicine DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
