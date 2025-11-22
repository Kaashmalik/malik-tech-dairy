// API Route: List & Create Milk Logs
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import { adminDb } from "@/lib/firebase/admin";
import type { MilkLog } from "@/types";
import { createMilkLogSchema, listMilkLogsSchema } from "@/lib/validations/milk";

export const dynamic = "force-dynamic";

// GET: List milk logs (with optional filters)
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const { searchParams } = new URL(req.url);
      const date = searchParams.get("date");
      const animalId = searchParams.get("animalId");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      const milkLogsRef = getTenantSubcollection(
        context.tenantId,
        "milkLogs",
        "logs"
      );

      let query: any = milkLogsRef;

      if (date) {
        // Get logs for specific date
        query = query.where("date", "==", date);
      } else if (startDate && endDate) {
        // Get logs for date range
        query = query.where("date", ">=", startDate).where("date", "<=", endDate);
      }

      if (animalId) {
        query = query.where("animalId", "==", animalId);
      }

      query = query.orderBy("date", "desc").orderBy("session", "desc");

      const snapshot = await query.limit(100).get();
      const logs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      return NextResponse.json({ logs });
    } catch (error) {
      console.error("Error fetching milk logs:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create milk log
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
        validated = createMilkLogSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }

      const { animalId, date, session, quantity, quality, notes } = validated;

      // Check if log already exists for this animal/date/session
      const milkLogsRef = getTenantSubcollection(
        context.tenantId,
        "milkLogs",
        "logs"
      );

      const existing = await milkLogsRef
        .where("animalId", "==", animalId)
        .where("date", "==", date)
        .where("session", "==", session)
        .limit(1)
        .get();

      if (!existing.empty) {
        return NextResponse.json(
          { error: "Milk log already exists for this animal, date, and session" },
          { status: 409 }
        );
      }

      const milkLogData: Omit<MilkLog, "id"> = {
        tenantId: context.tenantId,
        animalId,
        date,
        session,
        quantity,
        quality: quality || undefined,
        notes: notes || undefined,
        recordedBy: context.userId,
        createdAt: new Date(),
      };

      const docRef = await milkLogsRef.add(milkLogData);

      return NextResponse.json({
        success: true,
        log: { id: docRef.id, ...milkLogData },
      });
    } catch (error) {
      console.error("Error creating milk log:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

