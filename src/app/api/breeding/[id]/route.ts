// API Route: Get/Update/Delete Breeding Record
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import type { BreedingRecord } from "@/types";

export const dynamic = "force-dynamic";

// GET: Get breeding record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const breedingRef = getTenantSubcollection(
        context.tenantId,
        "breeding",
        "records"
      );

      const doc = await breedingRef.doc(id).get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Breeding record not found" },
          { status: 404 }
        );
      }

      const data = doc.data();
      return NextResponse.json({
        id: doc.id,
        ...data,
        breedingDate: data?.breedingDate?.toDate(),
        expectedCalvingDate: data?.expectedCalvingDate?.toDate(),
        actualCalvingDate: data?.actualCalvingDate?.toDate(),
        createdAt: data?.createdAt?.toDate(),
      });
    } catch (error) {
      console.error("Error fetching breeding record:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// PUT: Update breeding record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const body = await req.json();

      const breedingRef = getTenantSubcollection(
        context.tenantId,
        "breeding",
        "records"
      );

      const docRef = breedingRef.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Breeding record not found" },
          { status: 404 }
        );
      }

      const updates: Partial<BreedingRecord> = {};
      if (body.breedingDate) updates.breedingDate = new Date(body.breedingDate);
      if (body.expectedCalvingDate !== undefined) {
        updates.expectedCalvingDate = body.expectedCalvingDate
          ? new Date(body.expectedCalvingDate)
          : undefined;
      }
      if (body.actualCalvingDate !== undefined) {
        updates.actualCalvingDate = body.actualCalvingDate
          ? new Date(body.actualCalvingDate)
          : undefined;
      }
      if (body.sireId !== undefined) updates.sireId = body.sireId;
      if (body.status) updates.status = body.status;
      if (body.notes !== undefined) updates.notes = body.notes;

      await docRef.update(updates);

      const updated = await docRef.get();
      const data = updated.data();

      return NextResponse.json({
        id: updated.id,
        ...data,
        breedingDate: data?.breedingDate?.toDate(),
        expectedCalvingDate: data?.expectedCalvingDate?.toDate(),
        actualCalvingDate: data?.actualCalvingDate?.toDate(),
        createdAt: data?.createdAt?.toDate(),
      });
    } catch (error) {
      console.error("Error updating breeding record:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE: Delete breeding record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const breedingRef = getTenantSubcollection(
        context.tenantId,
        "breeding",
        "records"
      );

      const docRef = breedingRef.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Breeding record not found" },
          { status: 404 }
        );
      }

      await docRef.delete();

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting breeding record:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

