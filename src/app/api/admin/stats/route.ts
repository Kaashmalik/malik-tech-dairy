// API Route: Get Admin Statistics
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase/admin';
import { PlatformRole } from '@/types/roles';

export const dynamic = 'force-dynamic';

async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!adminDb) return false;

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData?.platformRole === PlatformRole.SUPER_ADMIN;
    }
    return false;
  } catch (error) {
    console.error('Error checking super admin:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get all tenants
    const tenantsSnapshot = await adminDb.collection('tenants').get();
    const tenants = tenantsSnapshot.docs;

    let totalTenants = 0;
    let activeTenants = 0;
    let trialTenants = 0;
    let monthlyRecurringRevenue = 0;
    let totalAnimals = 0;
    let totalUsers = 0;

    const subscriptionPlans: Record<string, number> = {
      free: 0,
      starter: 2999,
      professional: 7999,
      enterprise: 19999,
    };

    for (const tenantDoc of tenants) {
      totalTenants++;

      // Get subscription
      const subDoc = await tenantDoc.ref.collection('subscription').doc('main').get();

      if (subDoc.exists) {
        const subData = subDoc.data();
        const status = subData?.status || 'inactive';
        const plan = subData?.plan || 'free';

        if (status === 'active') {
          activeTenants++;
          monthlyRecurringRevenue += subscriptionPlans[plan] || 0;
        } else if (status === 'trial') {
          trialTenants++;
        }
      }

      // Count animals
      const animalsRef = adminDb
        .collection('tenants_data')
        .doc(`${tenantDoc.id}_animals`)
        .collection('animals');

      const animalsSnapshot = await animalsRef.where('status', '!=', 'deceased').get();
      totalAnimals += animalsSnapshot.size;

      // Count users
      const usersSnapshot = await adminDb
        .collection('users')
        .where('tenantId', '==', tenantDoc.id)
        .get();
      totalUsers += usersSnapshot.size;
    }

    return NextResponse.json({
      totalTenants,
      activeTenants,
      trialTenants,
      monthlyRecurringRevenue,
      totalAnimals,
      totalUsers,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
