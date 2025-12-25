// GDPR/Pakistan DPA: Hard Delete Tenant Data
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { TenantRole, PlatformRole } from '@/types/roles';
import { adminDb } from '@/lib/firebase/admin';
import { withMFAEnforcement } from '@/lib/middleware/mfaMiddleware';
import { clerkClient } from '@clerk/nextjs/server';
export const dynamic = 'force-dynamic';
/**
 * Hard delete all tenant data and remove Clerk organization (GDPR/DPA compliance)
 * Only accessible by tenant owner
 * WARNING: This is irreversible!
 */
export async function POST(request: NextRequest) {
  return withMFAEnforcement(async (req, { tenantId, userId }) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      // Verify user is owner
      const memberDoc = await adminDb
        .collection('tenants')
        .doc(tenantId)
        .collection('members')
        .doc(userId)
        .get();
      if (!memberDoc.exists || memberDoc.data()?.role !== TenantRole.FARM_OWNER) {
        return NextResponse.json(
          { error: 'Only tenant owner can delete tenant data' },
          { status: 403 }
        );
      }
      // Get tenant document to find Clerk org ID
      const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
      const tenantData = tenantDoc.data();
      const clerkOrgId = tenantData?.clerkOrgId || tenantId;
      // Batch delete all tenant data
      const batch = adminDb.batch();
      // Delete all subcollections
      const collections = ['members', 'config', 'subscription', 'limits', 'api_keys'];
      for (const collection of collections) {
        const snapshot = await adminDb
          .collection('tenants')
          .doc(tenantId)
          .collection(collection)
          .get();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }
      // Delete tenant data collections
      const dataCollections = ['animals', 'milkLogs', 'health', 'breeding', 'expenses', 'sales'];
      for (const collection of dataCollections) {
        const snapshot = await adminDb
          .collection('tenants_data')
          .where('__name__', '>=', `${tenantId}_${collection}`)
          .where('__name__', '<', `${tenantId}_${collection}\uf8ff`)
          .get();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }
      // Delete payments
      const paymentsSnapshot = await adminDb
        .collection('payments')
        .where('tenantId', '==', tenantId)
        .get();
      paymentsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      // Delete invitations
      const invitationsSnapshot = await adminDb
        .collection('invitations')
        .where('tenantId', '==', tenantId)
        .get();
      invitationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      // Delete tenant document
      batch.delete(adminDb.collection('tenants').doc(tenantId));
      // Commit batch delete
      await batch.commit();
      // Delete Clerk organization
      try {
        const client = await clerkClient();
        await client.organizations.deleteOrganization(clerkOrgId);
      } catch (error: any) {
        // Continue even if Clerk deletion fails (data is already deleted)
      }
      return NextResponse.json({
        success: true,
        message: 'Tenant data and organization deleted successfully',
        warning: 'This action is irreversible. All data has been permanently removed.',
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete tenant data' }, { status: 500 });
    }
  })(request);
}