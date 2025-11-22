// API Route: Get/Update/Delete Health Record
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import type { HealthRecord } from "@/types";
import { decrypt } from "@/lib/encryption";

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
      
      // Decrypt notes if encrypted
      let notes = data?.notes;
      if (notes && typeof notes === "string") {
        try {
          notes = decrypt(notes);
        } catch (error) {
          // If decryption fails, return as-is (might be unencrypted legacy data)
          console.warn("Failed to decrypt notes, returning as-is");
        }
      }
      
      return NextResponse.json({
        id: doc.id,
        ...data,
        notes, // Decrypted notes
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

      const { updateHealthRecordSchema } = await import("@/lib/validations/health");
      const { encrypt } = await import("@/lib/encryption");
      
      // Validate with Zod
      let validated;
      try {
        validated = updateHealthRecordSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }

      const updates: any = {};
      if (validated.type !== undefined) updates.type = validated.type;
      if (validated.date !== undefined) {
        updates.date = typeof validated.date === "string" ? new Date(validated.date) : validated.date;
      }
      if (validated.description !== undefined) updates.description = validated.description;
      if (validated.veterinarian !== undefined) updates.veterinarian = validated.veterinarian;
      if (validated.cost !== undefined) updates.cost = validated.cost;
      if (validated.nextDueDate !== undefined) {
        updates.nextDueDate = validated.nextDueDate 
          ? (typeof validated.nextDueDate === "string" ? new Date(validated.nextDueDate) : validated.nextDueDate)
          : undefined;
      }
      if (validated.notes !== undefined) {
        // Encrypt notes if provided
        updates.notes = validated.notes ? encrypt(validated.notes) : undefined;
      }

      await docRef.update(updates);

      const updated = await docRef.get();
      const data = updated.data();

      // Decrypt notes if encrypted
      let notes = data?.notes;
      if (notes && typeof notes === "string") {
        try {
          notes = decrypt(notes);
        } catch (error) {
          console.warn("Failed to decrypt notes, returning as-is");
        }
      }

      return NextResponse.json({
        id: updated.id,
        ...data,
        notes, // Decrypted notes
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

