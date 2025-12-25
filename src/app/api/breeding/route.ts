// API Route: Breeding Records (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { BreedingRecord, createApiResponse, createApiError } from '@/lib/supabase/types';
import { v4 as uuidv4 } from 'uuid';
export const dynamic = 'force-dynamic';
// GET: List breeding records
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const { searchParams } = new URL(req.url);
      const animalId = searchParams.get('animalId');
      const status = searchParams.get('status');
      let query = supabase
        .from('breeding_records')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('breeding_date', { ascending: false })
        .limit(100);
      if (animalId) {
        query = query.eq('animal_id', animalId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      const { data: records, error } = await query as { data: BreedingRecord[] | null; error: any };
      if (error) {
        return NextResponse.json(createApiError('Failed to fetch breeding records', 'FETCH_ERROR'), { status: 500 });
      }
      // Transform to camelCase for frontend
      const transformedRecords = (records || []).map((record) => ({
        id: record.id,
        tenantId: record.tenant_id,
        animalId: record.animal_id,
        type: record.type,
        partnerAnimalId: record.partner_animal_id,
        date: record.date,
        successDate: record.success_date,
        status: record.status,
        notes: record.notes,
        createdAt: record.created_at,
      }));
      return NextResponse.json(createApiResponse(transformedRecords));
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Internal server error', records: [] },
        { status: 500 }
      );
    }
  })(request);
}
// POST: Create breeding record
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const body = await req.json();
      const { animalId, breedingDate, sireId, expectedCalvingDate, notes } = body;
      if (!animalId || !breedingDate) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: animalId, breedingDate' },
          { status: 400 }
        );
      }
      // Calculate expected calving date (280 days for cows/buffaloes)
      const breeding = new Date(breedingDate);
      const expectedCalving = expectedCalvingDate
        ? new Date(expectedCalvingDate)
        : new Date(breeding.getTime() + 280 * 24 * 60 * 60 * 1000);
      const now = new Date().toISOString();
      const recordId = uuidv4();
      const recordData = {
        id: recordId,
        tenant_id: context.tenantId,
        animal_id: animalId,
        breeding_date: breeding.toISOString(),
        expected_calving_date: expectedCalving.toISOString(),
        actual_calving_date: null,
        sire_id: sireId || null,
        status: 'pregnant',
        notes: notes || null,
        created_at: now,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newRecord, error } = await (supabase.from('breeding_records') as any)
        .insert(recordData)
        .select()
        .single();
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to create breeding record', details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        record: {
          id: newRecord?.id,
          tenantId: newRecord?.tenant_id,
          animalId: newRecord?.animal_id,
          breedingDate: newRecord?.breeding_date,
          expectedCalvingDate: newRecord?.expected_calving_date,
          sireId: newRecord?.sire_id,
          status: newRecord?.status,
          notes: newRecord?.notes,
          createdAt: newRecord?.created_at,
        },
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}