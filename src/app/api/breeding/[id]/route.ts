// API Route: Get/Update/Delete Breeding Record (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
// GET: Get breeding record by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
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
        record: {
          id: record?.id,
          tenantId: record?.tenant_id,
          animalId: record?.animal_id,
          breedingDate: record?.breeding_date,
          expectedCalvingDate: record?.expected_calving_date,
          actualCalvingDate: record?.actual_calving_date,
          sireId: record?.sire_id,
          status: record?.status,
          notes: record?.notes,
          createdAt: record?.created_at,
        },
      });
    } catch (error) {
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
      // Check if record exists
      const { data: existing } = await supabase
        .from('breeding_records')
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
      if (body.expectedCalvingDate !== undefined) {
        updateData.expected_calving_date = body.expectedCalvingDate || null;
      }
      if (body.actualCalvingDate !== undefined) {
        updateData.actual_calving_date = body.actualCalvingDate || null;
      }
      if (body.sireId !== undefined) updateData.sire_id = body.sireId;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.notes !== undefined) updateData.notes = body.notes;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedRecord, error } = await (supabase.from('breeding_records') as any)
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .select()
        .single();
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to update breeding record' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        record: {
          id: updatedRecord?.id,
          tenantId: updatedRecord?.tenant_id,
          animalId: updatedRecord?.animal_id,
          breedingDate: updatedRecord?.breeding_date,
          expectedCalvingDate: updatedRecord?.expected_calving_date,
          actualCalvingDate: updatedRecord?.actual_calving_date,
          sireId: updatedRecord?.sire_id,
          status: updatedRecord?.status,
          notes: updatedRecord?.notes,
          createdAt: updatedRecord?.created_at,
        },
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
// DELETE: Delete breeding record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();
      // Check if record exists
      const { data: existing } = await supabase
        .from('breeding_records')
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
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}