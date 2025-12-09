// Super Admin - List all tenants
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase/admin';
import { PlatformRole } from '@/types/roles';

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    // Check if super admin
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData?.platformRole !== PlatformRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    // Fetch all tenants
    const tenantsSnapshot = await adminDb.collection('tenants').get();
    const tenants = [];

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantData = tenantDoc.data();

      // Get config
      const configDoc = await adminDb
        .collection('tenants')
        .doc(tenantDoc.id)
        .collection('config')
        .doc('main')
        .get();

      const config = configDoc.data();

      // Get subscription
      const subDoc = await adminDb
        .collection('tenants')
        .doc(tenantDoc.id)
        .collection('subscription')
        .doc('main')
        .get();

      const subscription = subDoc.data();

      // Count animals
      const animalsRef = adminDb
        .collection('tenants_data')
        .doc(`${tenantDoc.id}_animals`)
        .collection('animals');

      const animalsSnapshot = await animalsRef.where('status', '!=', 'deceased').get();

      // Count users
      const usersSnapshot = await adminDb
        .collection('users')
        .where('tenantId', '==', tenantDoc.id)
        .get();

      tenants.push({
        id: tenantDoc.id,
        farmName: config?.farmName,
        subdomain: config?.subdomain,
        plan: subscription?.plan || 'free',
        status: subscription?.status || 'active',
        subscriptionStatus: subscription?.status || 'active',
        animalCount: animalsSnapshot.size,
        userCount: usersSnapshot.size,
        createdAt: config?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}
