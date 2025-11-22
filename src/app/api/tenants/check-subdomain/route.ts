// API Route: Check Subdomain Availability
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { validateSubdomain } from "@/lib/utils/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subdomain = searchParams.get("subdomain");

    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      );
    }

    if (!validateSubdomain(subdomain)) {
      return NextResponse.json({ available: false, reason: "Invalid format" });
    }

    // Check if subdomain exists in Firestore
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Query all tenants to check if subdomain is taken
    const tenantsSnapshot = await adminDb
      .collection("tenants")
      .get();

    let isTaken = false;
    for (const tenantDoc of tenantsSnapshot.docs) {
      const configDoc = await tenantDoc.ref
        .collection("config")
        .doc("main")
        .get();

      if (configDoc.exists) {
        const config = configDoc.data();
        if (config?.subdomain === subdomain) {
          isTaken = true;
          break;
        }
      }
    }

    return NextResponse.json({
      available: !isTaken,
      subdomain,
    });
  } catch (error) {
    console.error("Error checking subdomain:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

