// API Route: Breeding Records (Enhanced with AI/Natural & Species-Specific Gestation)
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { createApiResponse, createApiError } from '@/lib/supabase/types';
import { v4 as uuidv4 } from 'uuid';
import { GESTATION_PERIODS, calculateExpectedDueDate } from '@/lib/breeding-constants';
import type { AnimalSpecies } from '@/types/database';

export const dynamic = 'force-dynamic';

// =============================================================================
// GET: List breeding records with enhanced data
// =============================================================================
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const { searchParams } = new URL(req.url);
      const animalId = searchParams.get('animalId');
      const status = searchParams.get('status');
      const pregnantOnly = searchParams.get('pregnantOnly') === 'true';

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
      if (pregnantOnly) {
        query = query.in('status', ['pregnant', 'confirmed', 'check_pending', 'inseminated']);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: records, error } = await query as { data: any[] | null; error: any };

      if (error) {
        return NextResponse.json(createApiError('Failed to fetch breeding records', 'FETCH_ERROR'), { status: 500 });
      }

      // Transform to camelCase for frontend with days remaining calculation
      const now = new Date();
      const transformedRecords = (records || []).map((record) => {
        const expectedDueDate = record.expected_due_date ? new Date(record.expected_due_date) : null;
        const daysRemaining = expectedDueDate
          ? Math.ceil((expectedDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const breedingDate = new Date(record.breeding_date);
        const gestationDays = record.gestation_days || 283;
        const daysPassed = Math.floor((now.getTime() - breedingDate.getTime()) / (1000 * 60 * 60 * 24));
        const progressPercent = Math.min(100, Math.max(0, (daysPassed / gestationDays) * 100));

        return {
          id: record.id,
          tenantId: record.tenant_id,
          animalId: record.animal_id,
          sireId: record.sire_id,
          breedingDate: record.breeding_date,
          breedingMethod: record.breeding_method || 'natural',
          semenStrawId: record.semen_straw_id,
          semenSource: record.semen_source,
          inseminationTechnician: record.insemination_technician,
          species: record.species,
          gestationDays: record.gestation_days,
          expectedDueDate: record.expected_due_date,
          actualBirthDate: record.actual_birth_date,
          offspringCount: record.offspring_count,
          pregnancyConfirmed: record.pregnancy_confirmed,
          pregnancyConfirmedDate: record.pregnancy_confirmed_date,
          pregnancyCheckMethod: record.pregnancy_check_method,
          status: record.status,
          notes: record.notes,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
          // Computed fields
          daysRemaining,
          progressPercent: Math.round(progressPercent),
          isOverdue: daysRemaining !== null && daysRemaining < 0,
        };
      });

      return NextResponse.json(createApiResponse(transformedRecords));
    } catch (error) {
      logger.error('Error fetching breeding records', error, { tenantId: context.tenantId });
      return NextResponse.json(
        { success: false, error: 'Internal server error', records: [] },
        { status: 500 }
      );
    }
  })(request);
}

// =============================================================================
// POST: Create breeding record with AI/Natural support & species gestation
// =============================================================================
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const body = await req.json();

      const {
        animalId,
        breedingDate,
        breedingMethod = 'natural',
        sireId,
        semenStrawId,
        semenSource,
        inseminationTechnician,
        expectedDueDate,
        notes
      } = body;

      // Validation
      if (!animalId || !breedingDate) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: animalId, breedingDate' },
          { status: 400 }
        );
      }

      // Validate breeding method specific fields
      if (breedingMethod === 'artificial_insemination' && !semenSource && !semenStrawId) {
        return NextResponse.json(
          { success: false, error: 'AI breeding requires semenSource or semenStrawId' },
          { status: 400 }
        );
      }

      if (breedingMethod === 'natural' && !sireId) {
        // Sire is optional for natural breeding but recommended
        logger.warn('Natural breeding without sire ID specified', { animalId });
      }

      // Get animal species for gestation calculation
      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('species')
        .eq('id', animalId)
        .single();

      if (animalError || !animal) {
        return NextResponse.json(
          { success: false, error: 'Animal not found' },
          { status: 404 }
        );
      }

      const species = animal.species as AnimalSpecies;
      const gestation = GESTATION_PERIODS[species] || GESTATION_PERIODS['cow'];
      const gestationDays = gestation.average;

      // Calculate expected due date based on species
      const breedingDateObj = new Date(breedingDate);
      const calculatedDueDate = expectedDueDate
        ? new Date(expectedDueDate)
        : calculateExpectedDueDate(breedingDateObj, species);

      const now = new Date().toISOString();
      const recordId = uuidv4();

      const recordData = {
        id: recordId,
        tenant_id: context.tenantId,
        animal_id: animalId,
        sire_id: breedingMethod === 'natural' ? (sireId || null) : null,
        breeding_date: breedingDateObj.toISOString(),
        breeding_method: breedingMethod,
        semen_straw_id: breedingMethod === 'artificial_insemination' ? (semenStrawId || null) : null,
        semen_source: breedingMethod === 'artificial_insemination' ? (semenSource || null) : null,
        insemination_technician: breedingMethod === 'artificial_insemination' ? (inseminationTechnician || null) : null,
        species: species,
        gestation_days: gestationDays,
        expected_due_date: calculatedDueDate.toISOString(),
        actual_birth_date: null,
        offspring_count: null,
        pregnancy_confirmed: false,
        pregnancy_confirmed_date: null,
        pregnancy_check_method: null,
        status: 'inseminated',
        notes: notes || null,
        created_at: now,
        updated_at: now,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newRecord, error } = await (supabase.from('breeding_records') as any)
        .insert(recordData)
        .select()
        .single();

      if (error) {
        logger.error('Database error creating breeding record', error, { tenantId: context.tenantId });
        return NextResponse.json(
          { success: false, error: 'Failed to create breeding record', details: error.message },
          { status: 500 }
        );
      }

      // Transform response
      const response = {
        id: newRecord?.id,
        tenantId: newRecord?.tenant_id,
        animalId: newRecord?.animal_id,
        sireId: newRecord?.sire_id,
        breedingDate: newRecord?.breeding_date,
        breedingMethod: newRecord?.breeding_method,
        semenStrawId: newRecord?.semen_straw_id,
        semenSource: newRecord?.semen_source,
        inseminationTechnician: newRecord?.insemination_technician,
        species: newRecord?.species,
        gestationDays: newRecord?.gestation_days,
        expectedDueDate: newRecord?.expected_due_date,
        pregnancyConfirmed: newRecord?.pregnancy_confirmed,
        status: newRecord?.status,
        notes: newRecord?.notes,
        createdAt: newRecord?.created_at,
      };

      return NextResponse.json({
        success: true,
        record: response,
        message: `Breeding record created. Expected ${gestation.label.toLowerCase()} date: ${calculatedDueDate.toLocaleDateString()}`,
      });
    } catch (error) {
      logger.error('Error creating breeding record', error, { tenantId: context.tenantId });
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}