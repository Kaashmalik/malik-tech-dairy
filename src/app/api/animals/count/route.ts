// API Route: Get Animal Count
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { adminDb } from '@/lib/firebase/admin';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ count: 0 });
      }
      // Count animals in tenant's collection
      const animalsSnapshot = await adminDb
        .collection('tenants_data')
        .doc(`${context.tenantId}_animals`)
        .collection('animals')
        .count()
        .get();
      const count = animalsSnapshot.data().count || 0;
      return NextResponse.json({ count });
    } catch (error) {
      return NextResponse.json({ count: 0 });
    }
  })(request);
}