// API Route: List & Create Animals
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import { adminDb } from "@/lib/firebase/admin";
import type { Animal } from "@/types";
import { canAddAnimal } from "@/lib/utils/limits";
import { getTenantLimits } from "@/lib/firebase/tenant";
import { createAnimalSchema, listAnimalsSchema } from "@/lib/validations/animals";

export const dynamic = "force-dynamic";

// GET: List all animals for tenant
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const animalsRef = getTenantSubcollection(
        context.tenantId,
        "animals",
        "animals"
      );

      const snapshot = await animalsRef.get();
      const animals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateOfBirth: doc.data().dateOfBirth?.toDate(),
        purchaseDate: doc.data().purchaseDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));

      return NextResponse.json({ animals });
    } catch (error) {
      console.error("Error fetching animals:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create new animal
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      // Check limits
      const limits = await getTenantLimits(context.tenantId);
      const animalsRef = getTenantSubcollection(
        context.tenantId,
        "animals",
        "animals"
      );
      const currentCount = (await animalsRef.count().get()).data().count || 0;

      if (!canAddAnimal(limits, currentCount)) {
        return NextResponse.json(
          {
            error: "Animal limit reached",
            message: `You can add up to ${limits?.maxAnimals || 0} animals on your current plan. Please upgrade to add more.`,
          },
          { status: 403 }
        );
      }

      const body = await req.json();
      
      // Validate with Zod
      let validated;
      try {
        validated = createAnimalSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }

      const {
        tag,
        name,
        species,
        breed,
        dateOfBirth,
        gender,
        photoUrl,
        purchaseDate,
        purchasePrice,
        status,
      } = validated;

      // Check if tag already exists
      const existingTag = await animalsRef
        .where("tag", "==", tag)
        .limit(1)
        .get();

      if (!existingTag.empty) {
        return NextResponse.json(
          { error: "Animal with this tag already exists" },
          { status: 409 }
        );
      }

      const now = new Date();
      const animalData: Omit<Animal, "id"> = {
        tenantId: context.tenantId,
        tag,
        name: name || "",
        species,
        breed: breed || "",
        dateOfBirth: dateOfBirth ? (typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth) : new Date(),
        gender,
        photoUrl: photoUrl || undefined,
        status: status || "active",
        purchaseDate: purchaseDate ? (typeof purchaseDate === "string" ? new Date(purchaseDate) : purchaseDate) : undefined,
        purchasePrice: purchasePrice || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await animalsRef.add(animalData);

      return NextResponse.json({
        success: true,
        animal: { id: docRef.id, ...animalData },
      });
    } catch (error) {
      console.error("Error creating animal:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

