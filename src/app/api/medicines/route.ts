import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";

// GET /api/medicines - Fetch all medicines
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
    const category = searchParams.get("category");
    const manufacturer = searchParams.get("manufacturer");
    const form = searchParams.get("form");
    const search = searchParams.get("search");
    const availableOnly = searchParams.get("available_only") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("medicines")
      .select("*", { count: "exact" })
      .order("name");

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (manufacturer) {
      query = query.eq("manufacturer", manufacturer);
    }

    if (form) {
      query = query.eq("form", form);
    }

    if (availableOnly) {
      query = query.eq("available_in_pakistan", true).eq("is_active", true);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,generic_name.ilike.%${search}%,brand_name.ilike.%${search}%`
      );
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: medicines, error, count } = await query;

    if (error) {
      console.error("Error fetching medicines:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch medicines" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: medicines,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in medicines GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/medicines - Create a new medicine
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
    if (!body.name || !body.category || !body.form || !body.route) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create medicine
    const { data: medicine, error } = await supabase
      .from("medicines")
      .insert({
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
        contraindications: body.contraindications || [],
        side_effects: body.side_effects || [],
        drug_interactions: body.drug_interactions || [],
        pregnancy_safe: body.pregnancy_safe,
        lactation_safe: body.lactation_safe,
        storage_conditions: body.storage_conditions,
        shelf_life_months: body.shelf_life_months,
        available_in_pakistan: body.available_in_pakistan !== false,
        prescription_required: body.prescription_required !== false,
        price_range_pkr: body.price_range_pkr,
        pack_sizes: body.pack_sizes || [],
        effectiveness_rating: body.effectiveness_rating || 4.0,
        popularity_score: body.popularity_score || 50,
        is_active: body.is_active !== false,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating medicine:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create medicine" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: medicine,
      message: "Medicine created successfully",
    });
  } catch (error) {
    console.error("Error in medicines POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
