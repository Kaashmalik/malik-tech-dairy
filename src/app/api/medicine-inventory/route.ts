import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";

// GET /api/medicine-inventory - Fetch tenant medicine inventory
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
    const lowStock = searchParams.get("low_stock") === "true";
    const expiringSoon = searchParams.get("expiring_soon") === "true";
    const expired = searchParams.get("expired") === "true";
    const medicineId = searchParams.get("medicine_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("tenant_medicine_inventory")
      .select(`
        *,
        medicine:medicines(*)
      `, { count: "exact" })
      .eq("tenant_id", tenant.id)
      .order("expiry_date", { ascending: true })
      .order("medicine(name)");

    // Apply filters
    if (lowStock) {
      query = query.lt("quantity", "reorder_level");
    }

    if (expiringSoon) {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      query = query
        .gte("expiry_date", new Date().toISOString().split('T')[0])
        .lte("expiry_date", thirtyDaysLater.toISOString().split('T')[0]);
    }

    if (expired) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt("expiry_date", today);
    }

    if (medicineId) {
      query = query.eq("medicine_id", medicineId);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: inventory, error, count } = await query;

    if (error) {
      console.error("Error fetching medicine inventory:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch medicine inventory" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inventory,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in medicine inventory GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/medicine-inventory - Add or update medicine inventory
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
    if (!body.medicine_id || !body.quantity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if inventory item exists
    const { data: existing, error: fetchError } = await supabase
      .from("tenant_medicine_inventory")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("medicine_id", body.medicine_id)
      .eq("batch_number", body.batch_number || "")
      .single();

    let inventory;

    if (existing && !fetchError) {
      // Update existing inventory
      const { data: updated, error: updateError } = await supabase
        .from("tenant_medicine_inventory")
        .update({
          quantity: existing.quantity + body.quantity,
          purchase_date: body.purchase_date || existing.purchase_date,
          expiry_date: body.expiry_date || existing.expiry_date,
          purchase_price: body.purchase_price || existing.purchase_price,
          supplier: body.supplier || existing.supplier,
          storage_location: body.storage_location || existing.storage_location,
          reorder_level: body.reorder_level || existing.reorder_level,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select(`
          *,
          medicine:medicines(*)
        `)
        .single();

      if (updateError) {
        console.error("Error updating inventory:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to update inventory" },
          { status: 500 }
        );
      }
      inventory = updated;
    } else {
      // Create new inventory item
      const { data: created, error: createError } = await supabase
        .from("tenant_medicine_inventory")
        .insert({
          tenant_id: tenant.id,
          medicine_id: body.medicine_id,
          quantity: body.quantity,
          unit: body.unit,
          batch_number: body.batch_number || "",
          purchase_date: body.purchase_date,
          expiry_date: body.expiry_date,
          purchase_price: body.purchase_price,
          supplier: body.supplier,
          storage_location: body.storage_location,
          reorder_level: body.reorder_level || 5,
        })
        .select(`
          *,
          medicine:medicines(*)
        `)
        .single();

      if (createError) {
        console.error("Error creating inventory:", createError);
        return NextResponse.json(
          { success: false, error: "Failed to create inventory" },
          { status: 500 }
        );
      }
      inventory = created;
    }

    return NextResponse.json({
      success: true,
      data: inventory,
      message: existing ? "Inventory updated successfully" : "Inventory added successfully",
    });
  } catch (error) {
    console.error("Error in medicine inventory POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/medicine-inventory - Update inventory quantity (for usage)
export async function PUT(request: NextRequest) {
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
    if (!body.id || body.quantity === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current inventory
    const { data: current, error: fetchError } = await supabase
      .from("tenant_medicine_inventory")
      .select("quantity")
      .eq("id", body.id)
      .eq("tenant_id", tenant.id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    const newQuantity = current.quantity - body.quantity;

    if (newQuantity < 0) {
      return NextResponse.json(
        { success: false, error: "Insufficient inventory" },
        { status: 400 }
      );
    }

    // Update inventory
    const { data: inventory, error } = await supabase
      .from("tenant_medicine_inventory")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select(`
        *,
        medicine:medicines(*)
      `)
      .single();

    if (error) {
      console.error("Error updating inventory quantity:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update inventory" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inventory,
      message: "Inventory updated successfully",
    });
  } catch (error) {
    console.error("Error in medicine inventory PUT:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
