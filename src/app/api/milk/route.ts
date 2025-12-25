// API Route: List & Create Milk Logs (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { createMilkLogSchema } from '@/lib/validations/milk';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import { transformMilkLogs, type MilkLogFromDb } from '@/lib/utils/transform';
export const dynamic = 'force-dynamic';
// GET: List milk logs (with optional filters)
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const { searchParams } = new URL(req.url);
      const date = searchParams.get('date');
      const animalId = searchParams.get('animalId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      let query = supabase
        .from('milk_logs')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('date', { ascending: false })
        .order('session', { ascending: false })
        .limit(100);
      if (date) {
        query = query.eq('date', date);
      } else if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }
      if (animalId) {
        query = query.eq('animal_id', animalId);
      }
      const { data: logs, error } = await query;
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch milk logs', logs: [] },
          { status: 500 }
        );
      }
      // Transform to camelCase for frontend
      const transformedLogs = transformMilkLogs(logs as MilkLogFromDb[] || []);
      return NextResponse.json({ success: true, logs: transformedLogs });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Internal server error', logs: [] },
        { status: 500 }
      );
    }
  })(request);
}
// POST: Create milk log
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const body = await req.json();
      // Validate with Zod
      let validated;
      try {
        validated = createMilkLogSchema.parse(body);
      } catch (error) {
        if (error instanceof ZodError) {
          return NextResponse.json(
            { success: false, error: 'Validation failed', details: error.errors },
            { status: 400 }
          );
        }
        throw error;
      }
      const { animalId, date, session, quantity, quality, notes } = validated;
      // Check if log already exists for this animal/date/session
      const { data: existing } = await supabase
        .from('milk_logs')
        .select('id')
        .eq('tenant_id', context.tenantId)
        .eq('animal_id', animalId)
        .eq('date', date)
        .eq('session', session)
        .limit(1)
        .single();
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Milk log already exists for this animal, date, and session' },
          { status: 409 }
        );
      }
      const now = new Date().toISOString();
      const logId = uuidv4();
      const milkLogData = {
        id: logId,
        tenant_id: context.tenantId,
        animal_id: animalId,
        date,
        session,
        quantity,
        quality: quality || null,
        notes: notes || null,
        recorded_by: context.userId,
        created_at: now,
      };
      const { data: newLog, error } = await supabase
        .from('milk_logs')
        .insert(milkLogData)
        .select()
        .single();
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to create milk log', details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        log: {
          id: newLog.id,
          tenantId: newLog.tenant_id,
          animalId: newLog.animal_id,
          date: newLog.date,
          session: newLog.session,
          quantity: newLog.quantity,
          quality: newLog.quality,
          notes: newLog.notes,
          recordedBy: newLog.recorded_by,
          createdAt: newLog.created_at,
        },
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}