// API Route: Get/Update/Delete Health Record
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import type { HealthRecord } from "@/types";

export const dynamic = "force-dynamic";

// GET: Get health record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const healthRef = getTenantSubcollection(
        context.tenantId,
        "health",
        "records"
      );

      const doc = await healthRef.doc(id).get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Health record not found" },
          { status: 404 }
        );
      }

      const data = doc.data();
      return NextResponse.json({
        id: doc.id,
        ...data,
        date: data?.date?.toDate(),
        nextDueDate: data?.nextDueDate?.toDate(),
        createdAt: data?.createdAt?.toDate(),
      });
    } catch (error) {
      console.error("Error fetching health record:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// PUT: Update health record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const body = await req.json();

      const healthRef = getTenantSubcollection(
        context.tenantId,
        "health",
        "records"
      );

      const docRef = healthRef.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Health record not found" },
          { status: 404 }
        );
      }

      const updates: Partial<HealthRecord> = {};
      if (body.type) updates.type = body.type;
      if (body.date) updates.date = new Date(body.date);
      if (body.description !== undefined) updates.description = body.description;
      if (body.veterinarian !== undefined) updates.veterinarian = body.veterinarian;
      if (body.cost !== undefined) updates.cost = body.cost;
      if (body.nextDueDate !== undefined) {
        updates.nextDueDate = body.nextDueDate ? new Date(body.nextDueDate) : undefined;
      }

      await docRef.update(updates);

      const updated = await docRef.get();
      const data = updated.data();

      return NextResponse.json({
        id: updated.id,
        ...data,
        date: data?.date?.toDate(),
        nextDueDate: data?.nextDueDate?.toDate(),
        createdAt: data?.createdAt?.toDate(),
      });
    } catch (error) {
      console.error("Error updating health record:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE: Delete health record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const healthRef = getTenantSubcollection(
        context.tenantId,
        "health",
        "records"
      );

      const docRef = healthRef.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Health record not found" },
          { status: 404 }
        );
      }

      await docRef.delete();

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting health record:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

