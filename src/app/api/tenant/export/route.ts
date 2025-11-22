// GDPR/Pakistan DPA: Export All Tenant Data
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { TenantRole, PlatformRole } from "@/types/roles";
import { adminDb } from "@/lib/firebase/admin";
import { withMFAEnforcement } from "@/lib/middleware/mfaMiddleware";
import JSZip from "jszip";
import { decrypt } from "@/lib/encryption";

export const dynamic = "force-dynamic";

/**
 * Export all tenant data as a ZIP file (GDPR/DPA compliance)
 * Only accessible by tenant owner
 */
export async function GET(request: NextRequest) {
  return withMFAEnforcement(async (req, { tenantId, userId }) => {
    try {
      if (!adminDb) {
        return NextResponse.json(
          { error: "Database not available" },
          { status: 500 }
        );
      }

      // Verify user is owner
      const memberDoc = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("members")
        .doc(userId)
        .get();

      if (!memberDoc.exists || memberDoc.data()?.role !== TenantRole.FARM_OWNER) {
        return NextResponse.json(
          { error: "Only tenant owner can export data" },
          { status: 403 }
        );
      }

      const zip = new JSZip();

      // 1. Tenant Information
      const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
      if (tenantDoc.exists) {
        zip.file("tenant.json", JSON.stringify(tenantDoc.data(), null, 2));
      }

      // 2. Tenant Configuration
      const configDoc = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("config")
        .doc("config")
        .get();
      if (configDoc.exists) {
        zip.file("config.json", JSON.stringify(configDoc.data(), null, 2));
      }

      // 3. Subscription Data
      const subscriptionDoc = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("subscription")
        .doc("subscription")
        .get();
      if (subscriptionDoc.exists) {
        zip.file("subscription.json", JSON.stringify(subscriptionDoc.data(), null, 2));
      }

      // 4. Members/Staff
      const membersSnapshot = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("members")
        .get();
      const members = membersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      zip.file("members.json", JSON.stringify(members, null, 2));

      // 5. Animals (from subcollection)
      const animalsRef = adminDb
        .collection("tenants_data")
        .doc(`${tenantId}_animals`)
        .collection("animals");
      const animalsSnapshot = await animalsRef.get();
      const animals = animalsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      zip.file("animals.json", JSON.stringify(animals, null, 2));

      // 6. Milk Logs (from subcollection)
      const milkLogsRef = adminDb
        .collection("tenants_data")
        .doc(`${tenantId}_milkLogs`)
        .collection("logs");
      const milkLogsSnapshot = await milkLogsRef.get();
      const milkLogs = milkLogsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      zip.file("milk_logs.json", JSON.stringify(milkLogs, null, 2));

      // 7. Health Records (from subcollection) - decrypt notes
      const healthRef = adminDb
        .collection("tenants_data")
        .doc(`${tenantId}_health`)
        .collection("records");
      const healthSnapshot = await healthRef.get();
      const healthRecords = healthSnapshot.docs.map((doc) => {
        const data = doc.data();
        // Decrypt notes if encrypted
        let notes = data?.notes;
        if (notes && typeof notes === "string") {
          try {
            notes = decrypt(notes);
          } catch (error) {
            // If decryption fails, keep encrypted (for audit)
            console.warn("Failed to decrypt notes in export");
          }
        }
        return {
          id: doc.id,
          ...data,
          notes, // Decrypted notes in export
        };
      });
      zip.file("health_records.json", JSON.stringify(healthRecords, null, 2));

      // 8. Breeding Records (from subcollection)
      const breedingRef = adminDb
        .collection("tenants_data")
        .doc(`${tenantId}_breeding`)
        .collection("records");
      const breedingSnapshot = await breedingRef.get();
      const breedingRecords = breedingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      zip.file("breeding_records.json", JSON.stringify(breedingRecords, null, 2));

      // 9. Expenses (from subcollection)
      const expensesRef = adminDb
        .collection("tenants_data")
        .doc(`${tenantId}_expenses`)
        .collection("records");
      const expensesSnapshot = await expensesRef.get();
      const expenses = expensesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      zip.file("expenses.json", JSON.stringify(expenses, null, 2));

      // 10. Payments
      const paymentsSnapshot = await adminDb
        .collection("payments")
        .where("tenantId", "==", tenantId)
        .get();
      const payments = paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      zip.file("payments.json", JSON.stringify(payments, null, 2));

      // Generate ZIP file
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Return ZIP file
      return new NextResponse(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="tenant-${tenantId}-export-${Date.now()}.zip"`,
        },
      });
    } catch (error) {
      console.error("Error exporting tenant data:", error);
      return NextResponse.json(
        { error: "Failed to export data" },
        { status: 500 }
      );
    }
  })(request);
}

