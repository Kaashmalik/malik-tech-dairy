// API Route: Health Records (Vaccination, Treatment, Checkup, Disease) - Supabase-based
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { createHealthRecordSchema } from '@/lib/validations/health';
import { encrypt, decrypt } from '@/lib/encryption';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import { transformHealthRecords, type HealthRecordFromDb } from '@/lib/utils/transform';
export const dynamic = 'force-dynamic';
// GET: List health records
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const { searchParams } = new URL(req.url);
      const animalId = searchParams.get('animalId');
      const type = searchParams.get('type');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      let query = supabase
        .from('health_records')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('date', { ascending: false })
        .limit(100);
      if (animalId) {
        query = query.eq('animal_id', animalId);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }
      const { data: records, error } = await query;
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch health records', records: [] },
          { status: 500 }
        );
      }
      // Transform and decrypt notes
      const transformedRecords = transformHealthRecords(records as HealthRecordFromDb[] || []).map(record => {
        let notes = record.notes;
        if (notes && typeof notes === 'string') {
          try {
            notes = decrypt(notes);
          } catch {
          }
        }
        return { ...record, notes };
      });
      return NextResponse.json({ success: true, records: transformedRecords });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Internal server error', records: [] },
        { status: 500 }
      );
    }
  })(request);
}
// POST: Create health record
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const body = await req.json();
      // Validate with Zod
      let validated;
      try {
        validated = createHealthRecordSchema.parse(body);
      } catch (error) {
        if (error instanceof ZodError) {
          return NextResponse.json(
            { success: false, error: 'Validation failed', details: error.errors },
            { status: 400 }
          );
        }
        throw error;
      }
      const { animalId, type, date, description, veterinarian, cost, nextDueDate, notes } =
        validated;
      // Encrypt sensitive notes
      const encryptedNotes = notes ? encrypt(notes) : null;
      const now = new Date().toISOString();
      const recordId = uuidv4();
      const recordData = {
        id: recordId,
        tenant_id: context.tenantId,
        animal_id: animalId,
        type,
        date: typeof date === 'string' ? date : date.toISOString(),
        description: description || null,
        veterinarian: veterinarian || null,
        cost: cost || null,
        next_due_date: nextDueDate
          ? typeof nextDueDate === 'string'
            ? nextDueDate
            : nextDueDate.toISOString()
          : null,
        notes: encryptedNotes,
        created_at: now,
      };
      const { data: newRecord, error } = await supabase
        .from('health_records')
        .insert(recordData)
        .select()
        .single();
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to create health record', details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        record: {
          id: newRecord.id,
          tenantId: newRecord.tenant_id,
          animalId: newRecord.animal_id,
          type: newRecord.type,
          date: newRecord.date,
          description: newRecord.description,
          veterinarian: newRecord.veterinarian,
          cost: newRecord.cost,
          nextDueDate: newRecord.next_due_date,
          createdAt: newRecord.created_at,
        },
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}