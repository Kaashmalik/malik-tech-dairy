// API Route: Sales
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import type { Sale } from "@/types";

export const dynamic = "force-dynamic";

// GET: List sales
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const type = searchParams.get("type");

      const salesRef = getTenantSubcollection(
        context.tenantId,
        "sales",
        "records"
      );

      let query: any = salesRef;

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
      const sales = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      return NextResponse.json({ sales });
    } catch (error) {
      console.error("Error fetching sales:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create sale
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const { date, type, quantity, unit, price, buyer, notes } = body;

      if (!date || !type || !quantity || !unit || !price) {
        return NextResponse.json(
          { error: "Missing required fields: date, type, quantity, unit, price" },
          { status: 400 }
        );
      }

      const total = parseFloat(quantity) * parseFloat(price);

      const salesRef = getTenantSubcollection(
        context.tenantId,
        "sales",
        "records"
      );

      const saleData: Omit<Sale, "id" | "tenantId" | "createdAt" | "recordedBy" | "currency"> = {
        date: new Date(date),
        type: type as Sale["type"],
        quantity: parseFloat(quantity),
        unit,
        price: parseFloat(price),
        total,
        buyer,
        notes,
      };

      const docRef = await salesRef.add({
        ...saleData,
        currency: "PKR",
        recordedBy: context.userId,
        createdAt: new Date(),
      });

      return NextResponse.json({
        id: docRef.id,
        ...saleData,
        currency: "PKR",
        recordedBy: context.userId,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating sale:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

