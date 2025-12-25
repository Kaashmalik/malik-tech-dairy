// API Route: Get User Count for Tenant
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
      // Count users belonging to this tenant
      const usersSnapshot = await adminDb
        .collection('users')
        .where('tenantId', '==', context.tenantId)
        .count()
        .get();
      const count = usersSnapshot.data().count || 0;
      return NextResponse.json({ count });
    } catch (error) {
      return NextResponse.json({ count: 0 });
    }
  })(request);
}