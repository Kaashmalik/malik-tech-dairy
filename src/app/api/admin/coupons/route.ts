// API Route: Super Admin - Manage Coupons
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Coupon } from "@/lib/coupons/types";

export const dynamic = "force-dynamic";

// Check if user is super admin
async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!adminDb) return false;

  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();
    return userData?.role === "super_admin" || userData?.isSuperAdmin === true;
  } catch {
    return false;
  }
}

// GET: List all coupons
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query: any = adminDb.collection("coupons").orderBy("createdAt", "desc");

    if (activeOnly) {
      query = query.where("isActive", "==", true);
    }

    const snapshot = await query.get();
    const coupons = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      validFrom: doc.data().validFrom?.toDate(),
      validUntil: doc.data().validUntil?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new coupon
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      targetPlans,
      minAmount,
      maxDiscount,
      validFrom,
      validUntil,
      maxUses,
      maxUsesPerUser,
      description,
    } = body;

    // Validate required fields
    if (!code || !type || value === undefined || !targetPlans || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await adminDb
      .collection("coupons")
      .where("code", "==", code.toUpperCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }

    const coupon: Omit<Coupon, "id"> = {
      code: code.toUpperCase(),
      type,
      value,
      targetPlans,
      minAmount: minAmount || undefined,
      maxDiscount: maxDiscount || undefined,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      maxUses: maxUses || undefined,
      maxUsesPerUser: maxUsesPerUser || undefined,
      isActive: true,
      description: description || undefined,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("coupons").add(coupon);

    return NextResponse.json({
      success: true,
      coupon: { id: docRef.id, ...coupon },
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

