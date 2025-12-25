// API Route: Heat Alerts (Animals in heat or approaching heat)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getTenantSubcollection } from '@/lib/firebase/tenant';
import { adminDb } from '@/lib/firebase/admin';
export const dynamic = 'force-dynamic';
// GET: Get animals in heat or approaching heat
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      // Get all female animals
      const animalsRef = adminDb
        .collection('tenants_data')
        .doc(`${context.tenantId}_animals`)
        .collection('animals');
      const animalsSnapshot = await animalsRef
        .where('gender', '==', 'female')
        .where('status', '==', 'active')
        .get();
      const alerts = [];
      for (const animalDoc of animalsSnapshot.docs) {
        const animal = animalDoc.data();
        const animalId = animalDoc.id;
        // Get last breeding record
        const breedingRef = getTenantSubcollection(context.tenantId, 'breeding', 'records');
        const lastBreedingSnapshot = await breedingRef
          .where('animalId', '==', animalId)
          .orderBy('breedingDate', 'desc')
          .limit(1)
          .get();
        let lastBreedingDate: Date | null = null;
        let isPregnant = false;
        if (!lastBreedingSnapshot.empty) {
          const lastBreeding = lastBreedingSnapshot.docs[0].data();
          lastBreedingDate = lastBreeding.breedingDate?.toDate() || null;
          isPregnant = lastBreeding.status === 'pregnant';
        }
        // Calculate heat cycle (21 days for cows/buffaloes)
        const heatCycleDays = 21;
        let nextHeatDate: Date | null = null;
        let daysUntilHeat = null;
        if (lastBreedingDate && !isPregnant) {
          nextHeatDate = new Date(lastBreedingDate.getTime() + heatCycleDays * 24 * 60 * 60 * 1000);
          const today = new Date();
          const diffTime = nextHeatDate.getTime() - today.getTime();
          daysUntilHeat = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        // Alert if in heat (0-2 days) or approaching (3-5 days)
        if (daysUntilHeat !== null && daysUntilHeat <= 5) {
          alerts.push({
            animalId,
            animalName: animal.name,
            animalTag: animal.tag,
            species: animal.species,
            lastBreedingDate: lastBreedingDate?.toISOString(),
            nextHeatDate: nextHeatDate?.toISOString(),
            daysUntilHeat,
            status: daysUntilHeat <= 2 ? 'in_heat' : 'approaching_heat',
          });
        }
      }
      return NextResponse.json({ alerts });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}