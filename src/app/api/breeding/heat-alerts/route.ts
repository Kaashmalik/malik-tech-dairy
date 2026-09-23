// API Route: Heat Alerts (Animals in heat or approaching heat) — Supabase
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const HEAT_CYCLE_DAYS = 21;

// GET: Get animals in heat or approaching heat
export async function GET(request: NextRequest) {
  return withTenantContext(async (_req, context) => {
    try {
      const supabase = getSupabaseClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: animals, error: animalsError } = await (supabase.from('animals') as any)
        .select('id, name, tag, species, gender, status')
        .eq('tenant_id', context.tenantId)
        .eq('gender', 'female')
        .eq('status', 'active');

      if (animalsError) {
        console.error('Heat alerts animals fetch error:', animalsError);
        return NextResponse.json({ success: true, alerts: [] });
      }

      if (!animals?.length) {
        return NextResponse.json({ success: true, alerts: [] });
      }

      const animalIds = animals.map((a: { id: string }) => a.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: breedingRecords } = await (supabase.from('breeding_records') as any)
        .select('animal_id, breeding_date, status')
        .eq('tenant_id', context.tenantId)
        .in('animal_id', animalIds)
        .order('breeding_date', { ascending: false });

      const lastBreedingByAnimal = new Map<string, { breedingDate: string; status: string }>();
      for (const record of breedingRecords || []) {
        if (!lastBreedingByAnimal.has(record.animal_id)) {
          lastBreedingByAnimal.set(record.animal_id, {
            breedingDate: record.breeding_date,
            status: record.status,
          });
        }
      }

      const today = new Date();
      const alerts = [];

      for (const animal of animals) {
        const last = lastBreedingByAnimal.get(animal.id);
        if (!last) continue;

        const isPregnant = ['pregnant', 'confirmed'].includes(last.status);
        if (isPregnant) continue;

        const lastBreedingDate = new Date(last.breedingDate);
        const nextHeatDate = new Date(
          lastBreedingDate.getTime() + HEAT_CYCLE_DAYS * 24 * 60 * 60 * 1000
        );
        const daysUntilHeat = Math.ceil(
          (nextHeatDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilHeat <= 5) {
          alerts.push({
            animalId: animal.id,
            animalName: animal.name,
            animalTag: animal.tag,
            species: animal.species,
            lastBreedingDate: lastBreedingDate.toISOString(),
            nextHeatDate: nextHeatDate.toISOString(),
            daysUntilHeat,
            status: daysUntilHeat <= 2 ? 'in_heat' : 'approaching_heat',
          });
        }
      }

      return NextResponse.json({ success: true, alerts });
    } catch (error) {
      console.error('Heat alerts error:', error);
      // Soft-fail: never 500 for this advisory endpoint
      return NextResponse.json({ success: true, alerts: [] });
    }
  })(request);
}
