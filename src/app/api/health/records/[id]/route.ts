// API Route: Get/Update/Delete Health Record (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { decrypt, encrypt } from '@/lib/encryption';
import { updateHealthRecordSchema } from '@/lib/validations/health';

export const dynamic = 'force-dynamic';

// GET: Get health record by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: record, error } = await (supabase.from('health_records') as any)
        .select('*')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();

      if (error || !record) {
        return NextResponse.json(
          { success: false, error: 'Health record not found' },
          { status: 404 }
        );
      }

      // Decrypt notes if encrypted
      let notes = record?.notes;
      if (notes && typeof notes === 'string') {
        try {
          notes = decrypt(notes);
        } catch {
          console.warn('Failed to decrypt notes, returning as-is');
        }
      }

      return NextResponse.json({
        success: true,
        record: {
          id: record?.id,
          tenantId: record?.tenant_id,
          animalId: record?.animal_id,
          type: record?.type,
          date: record?.date,
          description: record?.description,
          veterinarian: record?.veterinarian,
          cost: record?.cost,
          nextDueDate: record?.next_due_date,
          notes,
          createdAt: record?.created_at,
        },
      });
    } catch (error) {
      console.error('Error fetching health record:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// PUT: Update health record
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();
      const body = await req.json();

      // Check if record exists
      const { data: existing } = await supabase
        .from('health_records')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Health record not found' },
          { status: 404 }
        );
      }

      // Validate with Zod
      let validated;
      try {
        validated = updateHealthRecordSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (validated.type !== undefined) updateData.type = validated.type;
      if (validated.date !== undefined) {
        updateData.date =
          typeof validated.date === 'string' ? validated.date : validated.date.toISOString();
      }
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.veterinarian !== undefined) updateData.veterinarian = validated.veterinarian;
      if (validated.cost !== undefined) updateData.cost = validated.cost;
      if (validated.nextDueDate !== undefined) {
        updateData.next_due_date = validated.nextDueDate
          ? typeof validated.nextDueDate === 'string'
            ? validated.nextDueDate
            : validated.nextDueDate.toISOString()
          : null;
      }
      if (validated.notes !== undefined) {
        updateData.notes = validated.notes ? encrypt(validated.notes) : null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedRecord, error } = await (supabase.from('health_records') as any)
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating health record:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update health record' },
          { status: 500 }
        );
      }

      // Decrypt notes for response
      let notes = updatedRecord?.notes;
      if (notes && typeof notes === 'string') {
        try {
          notes = decrypt(notes);
        } catch {
          console.warn('Failed to decrypt notes, returning as-is');
        }
      }

      return NextResponse.json({
        success: true,
        record: {
          id: updatedRecord?.id,
          tenantId: updatedRecord?.tenant_id,
          animalId: updatedRecord?.animal_id,
          type: updatedRecord?.type,
          date: updatedRecord?.date,
          description: updatedRecord?.description,
          veterinarian: updatedRecord?.veterinarian,
          cost: updatedRecord?.cost,
          nextDueDate: updatedRecord?.next_due_date,
          notes,
          createdAt: updatedRecord?.created_at,
        },
      });
    } catch (error) {
      console.error('Error updating health record:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// DELETE: Delete health record
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
        .from('health_records')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Health record not found' },
          { status: 404 }
        );
      }

      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', id)
        .eq('tenant_id', context.tenantId);

      if (error) {
        console.error('Error deleting health record:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to delete health record' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting health record:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
