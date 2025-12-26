import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";

// GET /api/treatment-protocols - Fetch all treatment protocols
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
    const diseaseId = searchParams.get("disease_id");
    const protocolType = searchParams.get("protocol_type");
    const severity = searchParams.get("severity");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("treatment_protocols")
      .select(`
        *,
        disease:diseases(id, name, category)
      `, { count: "exact" })
      .eq("is_active", true)
      .order("disease(name)")
      .order("severity_level");

    // Apply filters
    if (diseaseId) {
      query = query.eq("disease_id", diseaseId);
    }

    if (protocolType) {
      query = query.eq("protocol_type", protocolType);
    }

    if (severity) {
      query = query.eq("severity_level", severity);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: protocols, error, count } = await query;

    if (error) {
      console.error("Error fetching treatment protocols:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch treatment protocols" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: protocols,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in treatment protocols GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/treatment-protocols - Create a new treatment protocol
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
    if (!body.disease_id || !body.name || !body.protocol_type || !body.steps) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create treatment protocol
    const { data: protocol, error } = await supabase
      .from("treatment_protocols")
      .insert({
        disease_id: body.disease_id,
        name: body.name,
        protocol_type: body.protocol_type,
        severity_level: body.severity_level,
        steps: body.steps,
        medicines_required: body.medicines_required || [],
        supportive_care: body.supportive_care || [],
        dietary_recommendations: body.dietary_recommendations || [],
        isolation_required: body.isolation_required || false,
        expected_recovery_days: body.expected_recovery_days,
        success_rate: body.success_rate,
        escalation_signs: body.escalation_signs || [],
        refer_to_vet_when: body.refer_to_vet_when || [],
        source: body.source,
        is_active: body.is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating treatment protocol:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create treatment protocol" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: protocol,
      message: "Treatment protocol created successfully",
    });
  } catch (error) {
    console.error("Error in treatment protocols POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
