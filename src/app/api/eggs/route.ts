// API Route: List & Create Egg Logs (for Poultry)
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import { adminDb } from "@/lib/firebase/admin";
import type { EggLog } from "@/types";

export const dynamic = "force-dynamic";

// GET: List egg logs
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const { searchParams } = new URL(req.url);
      const date = searchParams.get("date");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      const eggLogsRef = getTenantSubcollection(
        context.tenantId,
        "eggLogs",
        "logs"
      );

      let query: any = eggLogsRef;

      if (date) {
        query = query.where("date", "==", date);
      } else if (startDate && endDate) {
        query = query.where("date", ">=", startDate).where("date", "<=", endDate);
      }

      query = query.orderBy("date", "desc");

      const snapshot = await query.limit(100).get();
      const logs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      return NextResponse.json({ logs });
    } catch (error) {
      console.error("Error fetching egg logs:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create egg log
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const body = await req.json();
      const { date, quantity, quality, notes } = body;

      // Validate required fields
      if (!date || quantity === undefined) {
        return NextResponse.json(
          { error: "Missing required fields: date, quantity" },
          { status: 400 }
        );
      }

      // Validate quantity
      if (quantity < 0) {
        return NextResponse.json(
          { error: "Quantity must be non-negative" },
          { status: 400 }
        );
      }

      // Check if log already exists for this date
      const eggLogsRef = getTenantSubcollection(
        context.tenantId,
        "eggLogs",
        "logs"
      );

      const existing = await eggLogsRef
        .where("date", "==", date)
        .limit(1)
        .get();

      if (!existing.empty) {
        return NextResponse.json(
          { error: "Egg log already exists for this date" },
          { status: 409 }
        );
      }

      const eggLogData: Omit<EggLog, "id"> = {
        tenantId: context.tenantId,
        date,
        quantity,
        quality: quality || undefined,
        notes: notes || undefined,
        recordedBy: context.userId,
        createdAt: new Date(),
      };

      const docRef = await eggLogsRef.add(eggLogData);

      return NextResponse.json({
        success: true,
        log: { id: docRef.id, ...eggLogData },
      });
    } catch (error) {
      console.error("Error creating egg log:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

