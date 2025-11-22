// API Route: Health Records (Vaccination, Treatment, Checkup, Disease)
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { adminDb } from "@/lib/firebase/admin";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import type { HealthRecord } from "@/types";
import { createHealthRecordSchema, listHealthRecordsSchema } from "@/lib/validations/health";
import { encrypt } from "@/lib/encryption";

export const dynamic = "force-dynamic";

// GET: List health records
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const { searchParams } = new URL(req.url);
      const animalId = searchParams.get("animalId");
      const type = searchParams.get("type");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      const healthRef = getTenantSubcollection(
        context.tenantId,
        "health",
        "records"
      );

      let query: any = healthRef;

      if (animalId) {
        query = query.where("animalId", "==", animalId);
      }

      if (type) {
        query = query.where("type", "==", type);
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        query = query.where("date", ">=", start).where("date", "<=", end);
      }

      query = query.orderBy("date", "desc");

      const snapshot = await query.limit(100).get();
      const { decrypt } = await import("@/lib/encryption");
      
      const records = snapshot.docs.map((doc: any) => {
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
        
        return {
          id: doc.id,
          ...data,
          notes, // Decrypted notes
          date: data.date?.toDate(),
          nextDueDate: data.nextDueDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
        };
      });

      return NextResponse.json({ records });
    } catch (error) {
      console.error("Error fetching health records:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create health record
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const body = await req.json();
      
      // Validate with Zod
      let validated;
      try {
        validated = createHealthRecordSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }

      const {
        animalId,
        type,
        date,
        description,
        veterinarian,
        cost,
        nextDueDate,
        notes,
      } = validated;

      const healthRef = getTenantSubcollection(
        context.tenantId,
        "health",
        "records"
      );

      // Encrypt sensitive notes
      const encryptedNotes = notes ? encrypt(notes) : undefined;

      const recordData: Omit<HealthRecord, "id" | "tenantId" | "createdAt"> = {
        animalId,
        type: type as HealthRecord["type"],
        date: typeof date === "string" ? new Date(date) : date,
        description,
        veterinarian,
        cost,
        nextDueDate: nextDueDate ? (typeof nextDueDate === "string" ? new Date(nextDueDate) : nextDueDate) : undefined,
      };

      const docRef = await healthRef.add({
        ...recordData,
        notes: encryptedNotes, // Store encrypted notes
        createdAt: new Date(),
      });

      return NextResponse.json({
        id: docRef.id,
        ...recordData,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating health record:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

