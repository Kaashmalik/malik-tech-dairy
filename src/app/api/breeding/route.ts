// API Route: Breeding Records
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import type { BreedingRecord } from "@/types";

export const dynamic = "force-dynamic";

// GET: List breeding records
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const animalId = searchParams.get("animalId");
      const status = searchParams.get("status");

      const breedingRef = getTenantSubcollection(
        context.tenantId,
        "breeding",
        "records"
      );

      let query: any = breedingRef;

      if (animalId) {
        query = query.where("animalId", "==", animalId);
      }

      if (status) {
        query = query.where("status", "==", status);
      }

      query = query.orderBy("breedingDate", "desc");

      const snapshot = await query.limit(100).get();
      const records = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        breedingDate: doc.data().breedingDate?.toDate(),
        expectedCalvingDate: doc.data().expectedCalvingDate?.toDate(),
        actualCalvingDate: doc.data().actualCalvingDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      return NextResponse.json({ records });
    } catch (error) {
      console.error("Error fetching breeding records:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create breeding record
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const {
        animalId,
        breedingDate,
        sireId,
        expectedCalvingDate,
        notes,
      } = body;

      if (!animalId || !breedingDate) {
        return NextResponse.json(
          { error: "Missing required fields: animalId, breedingDate" },
          { status: 400 }
        );
      }

      // Calculate expected calving date (280 days for cows/buffaloes)
      const breeding = new Date(breedingDate);
      const expectedCalving = expectedCalvingDate
        ? new Date(expectedCalvingDate)
        : new Date(breeding.getTime() + 280 * 24 * 60 * 60 * 1000);

      const breedingRef = getTenantSubcollection(
        context.tenantId,
        "breeding",
        "records"
      );

      const recordData: Omit<BreedingRecord, "id" | "tenantId" | "createdAt"> = {
        animalId,
        breedingDate: breeding,
        expectedCalvingDate: expectedCalving,
        sireId,
        status: "pregnant",
        notes,
      };

      const docRef = await breedingRef.add({
        ...recordData,
        createdAt: new Date(),
      });

      return NextResponse.json({
        id: docRef.id,
        ...recordData,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating breeding record:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

