// API Route: Health Records (Vaccination, Treatment, Checkup, Disease)
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { adminDb } from "@/lib/firebase/admin";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import type { HealthRecord } from "@/types";

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
      const records = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        nextDueDate: doc.data().nextDueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

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
      const {
        animalId,
        type,
        date,
        description,
        veterinarian,
        cost,
        nextDueDate,
      } = body;

      if (!animalId || !type || !date || !description) {
        return NextResponse.json(
          { error: "Missing required fields: animalId, type, date, description" },
          { status: 400 }
        );
      }

      const healthRef = getTenantSubcollection(
        context.tenantId,
        "health",
        "records"
      );

      const recordData: Omit<HealthRecord, "id" | "tenantId" | "createdAt"> = {
        animalId,
        type: type as HealthRecord["type"],
        date: new Date(date),
        description,
        veterinarian,
        cost,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
      };

      const docRef = await healthRef.add({
        ...recordData,
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

