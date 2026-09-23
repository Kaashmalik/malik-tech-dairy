// API Route: Get/Update/Delete Breeding Record (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function mapBreedingRecord(record: Record<string, unknown>) {
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
    // Back-compat aliases
    expectedCalvingDate: record.expected_due_date,
    actualCalvingDate: record.actual_birth_date,
  };
}

// GET: Get breeding record by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (_req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: record, error } = await (supabase.from('breeding_records') as any)
        .select('*')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();
      if (error || !record) {
        return NextResponse.json(
          { success: false, error: 'Breeding record not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        record: mapBreedingRecord(record),
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// PUT: Update breeding record
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();
      const body = await req.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from('breeding_records') as any)
        .select('id')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Breeding record not found' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (body.breedingDate !== undefined) {
        updateData.breeding_date = body.breedingDate;
      }
      if (body.breedingMethod !== undefined) {
        updateData.breeding_method = body.breedingMethod;
      }
      if (body.sireId !== undefined) {
        updateData.sire_id = body.sireId || null;
      }
      if (body.semenStrawId !== undefined) {
        updateData.semen_straw_id = body.semenStrawId || null;
      }
      if (body.semenSource !== undefined) {
        updateData.semen_source = body.semenSource || null;
      }
      if (body.inseminationTechnician !== undefined) {
        updateData.insemination_technician = body.inseminationTechnician || null;
      }
      // Accept both expectedDueDate (current) and expectedCalvingDate (legacy)
      if (body.expectedDueDate !== undefined || body.expectedCalvingDate !== undefined) {
        updateData.expected_due_date = body.expectedDueDate ?? body.expectedCalvingDate ?? null;
      }
      if (body.actualBirthDate !== undefined || body.actualCalvingDate !== undefined) {
        updateData.actual_birth_date = body.actualBirthDate ?? body.actualCalvingDate ?? null;
      }
      if (body.offspringCount !== undefined) {
        updateData.offspring_count = body.offspringCount;
      }
      if (body.status !== undefined) {
        updateData.status = body.status;
      }
      if (body.notes !== undefined) {
        updateData.notes = body.notes;
      }
      if (body.pregnancyConfirmed !== undefined) {
        updateData.pregnancy_confirmed = body.pregnancyConfirmed;
      }
      if (body.animalId !== undefined) {
        updateData.animal_id = body.animalId;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedRecord, error } = await (supabase.from('breeding_records') as any)
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update breeding record:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to update breeding record',
            details: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        record: mapBreedingRecord(updatedRecord),
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// DELETE: Delete breeding record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (_req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from('breeding_records') as any)
        .select('id')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Breeding record not found' },
          { status: 404 }
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('breeding_records') as any)
        .delete()
        .eq('id', id)
        .eq('tenant_id', context.tenantId);
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete breeding record' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
