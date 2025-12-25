// API Route: List & Create Egg Logs (for Poultry) - Supabase-based
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
export const dynamic = 'force-dynamic';
// GET: List egg logs
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const { searchParams } = new URL(req.url);
      const date = searchParams.get('date');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      let query = supabase
        .from('egg_logs')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('date', { ascending: false })
        .limit(100);
      if (date) {
        query = query.eq('date', date);
      } else if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }
      const { data: logs, error } = (await query) as { data: any[] | null; error: any };
      if (error) {
        // Return empty logs for graceful degradation
        return NextResponse.json({
          success: true,
          logs: [],
          message: 'No egg data available',
        });
      }
      // Transform to camelCase
      const transformedLogs = (logs || []).map((log: any) => ({
        id: log.id,
        tenantId: log.tenant_id,
        date: log.date,
        quantity: log.quantity,
        quality: log.quality,
        notes: log.notes,
        recordedBy: log.recorded_by,
        createdAt: log.created_at,
      }));
      return NextResponse.json({ success: true, logs: transformedLogs });
    } catch (error) {
      return NextResponse.json({
        success: true,
        logs: [],
        message: 'Error loading egg data',
      });
    }
  })(request);
}
// Helper: Get today's egg count (internal use only - not exported from route)
async function getTodayEggCount(tenantId: string): Promise<number> {
  try {
    const supabase = getSupabaseClient();
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = (await supabase
      .from('egg_logs')
      .select('quantity')
      .eq('tenant_id', tenantId)
      .eq('date', today)) as { data: any[] | null; error: any };
    if (error || !data) return 0;
    return data.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
  } catch {
    return 0;
  }
}
// POST: Create egg log
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const body = await req.json();
      const { date, quantity, quality, notes } = body;
      // Validate required fields
      if (!date || quantity === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: date, quantity' },
          { status: 400 }
        );
      }
      // Validate quantity
      if (quantity < 0) {
        return NextResponse.json(
          { success: false, error: 'Quantity must be non-negative' },
          { status: 400 }
        );
      }
      // Check if log already exists for this date
      const { data: existing } = (await supabase
        .from('egg_logs')
        .select('id')
        .eq('tenant_id', context.tenantId)
        .eq('date', date)
        .single()) as { data: any };
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Egg log already exists for this date. Use update instead.' },
          { status: 409 }
        );
      }
      const now = new Date().toISOString();
      const logId = uuidv4();
      const eggLogData = {
        id: logId,
        tenant_id: context.tenantId,
        date,
        quantity,
        quality: quality || null,
        notes: notes || null,
        recorded_by: context.userId,
        created_at: now,
      };
      const { data: newLog, error } = (await supabase
        .from('egg_logs')
        .insert(eggLogData as any)
        .select()
        .single()) as { data: any; error: any };
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to create egg log', details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Egg log created successfully',
        log: {
          id: newLog.id,
          tenantId: newLog.tenant_id,
          date: newLog.date,
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