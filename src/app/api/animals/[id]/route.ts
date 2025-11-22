// API Route: Get, Update, Delete Animal by ID
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubcollection } from "@/lib/firebase/tenant";
import { adminDb } from "@/lib/firebase/admin";
import type { Animal } from "@/types";

export const dynamic = "force-dynamic";

// GET: Get animal by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const animalsRef = getTenantSubcollection(
        context.tenantId,
        "animals",
        "animals"
      );

      const doc = await animalsRef.doc(id).get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Animal not found" },
          { status: 404 }
        );
      }

      const data = doc.data();
      const animal = {
        id: doc.id,
        ...data,
        dateOfBirth: data?.dateOfBirth?.toDate(),
        purchaseDate: data?.purchaseDate?.toDate(),
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      };

      return NextResponse.json({ animal });
    } catch (error) {
      console.error("Error fetching animal:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// PUT: Update animal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const body = await req.json();
      const animalsRef = getTenantSubcollection(
        context.tenantId,
        "animals",
        "animals"
      );

      const doc = await animalsRef.doc(id).get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Animal not found" },
          { status: 404 }
        );
      }

      // Check if tag is being updated and if it conflicts
      if (body.tag && body.tag !== doc.data()?.tag) {
        const existingTag = await animalsRef
          .where("tag", "==", body.tag)
          .limit(1)
          .get();

        if (!existingTag.empty && existingTag.docs[0].id !== id) {
          return NextResponse.json(
            { error: "Animal with this tag already exists" },
            { status: 409 }
          );
        }
      }

      const updates: Partial<Animal> = {
        ...body,
        updatedAt: new Date(),
      };

      // Convert date strings to Date objects
      if (body.dateOfBirth) {
        updates.dateOfBirth = new Date(body.dateOfBirth);
      }
      if (body.purchaseDate) {
        updates.purchaseDate = new Date(body.purchaseDate);
      }

      await animalsRef.doc(id).update(updates);

      const updatedDoc = await animalsRef.doc(id).get();
      const data = updatedDoc.data();
      const animal = {
        id: updatedDoc.id,
        ...data,
        dateOfBirth: data?.dateOfBirth?.toDate(),
        purchaseDate: data?.purchaseDate?.toDate(),
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      };

      return NextResponse.json({ success: true, animal });
    } catch (error) {
      console.error("Error updating animal:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE: Delete animal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
      }

      const animalsRef = getTenantSubcollection(
        context.tenantId,
        "animals",
        "animals"
      );

      const doc = await animalsRef.doc(id).get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Animal not found" },
          { status: 404 }
        );
      }

      // Soft delete: Update status instead of deleting
      await animalsRef.doc(id).update({
        status: "deceased",
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting animal:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

