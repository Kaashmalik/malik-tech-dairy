// Clerk Webhook Handler for Organization Events
import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { initializeTenant } from "@/lib/supabase/tenant"; // Use Supabase instead of Firestore
import { adminDb } from "@/lib/firebase/admin"; // Keep for Firestore document data

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create Svix instance
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  const eventType = evt.type;
  const data = evt.data;

  // Handle organization.created event
  if (eventType === "organization.created") {
    try {
      const orgId = data.id;
      const orgSlug = data.slug || data.name?.toLowerCase().replace(/\s+/g, "-") || `org-${orgId.slice(0, 8)}`;
      const ownerId = data.created_by;

      // Get owner email from Clerk (or from user data)
      // For now, we'll initialize without email and update later
      await initializeTenant(orgId, orgSlug, ownerId, "owner@example.com");

      console.log(`Tenant initialized: ${orgId} (${orgSlug})`);
    } catch (error) {
      console.error("Error handling organization.created:", error);
      return NextResponse.json(
        { error: "Failed to initialize tenant" },
        { status: 500 }
      );
    }
  }

  // Handle organization.deleted event
  if (eventType === "organization.deleted") {
    try {
      const orgId = data.id;

      // Optionally: Archive tenant data instead of deleting
      // For now, we'll just log it
      console.log(`Organization deleted: ${orgId}`);
      
      // Archive tenant in Supabase
      const { getDrizzle } = await import("@/lib/supabase");
      const { tenants } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const db = getDrizzle();
      
      await db.update(tenants)
        .set({ deletedAt: new Date() })
        .where(eq(tenants.id, orgId));
    } catch (error) {
      console.error("Error handling organization.deleted:", error);
    }
  }

  return NextResponse.json({ received: true });
}

