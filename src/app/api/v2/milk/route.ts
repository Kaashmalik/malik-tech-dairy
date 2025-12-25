// API Route: List & Create Milk Logs (Supabase-based)
// Migrated from Firebase to Supabase with enterprise middleware
import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware, createSuccessResponse, ErrorCode } from '@/lib/api/middleware-v2';
import { getSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { logApiEvent } from '@/lib/api/middleware-v2';
export const dynamic = 'force-dynamic';
// Validation schemas
const createMilkLogSchema = z.object({
  animalId: z.string().min(1, 'Animal ID is required'),
  date: z.string().min(1, 'Date is required'),
  session: z.enum(['morning', 'evening']),
  yield: z.number().min(0, 'Yield must be positive').max(100, 'Yield seems too high'),
  quality: z.string().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});
const listMilkLogsSchema = z.object({
  animalId: z.string().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(30),
});
// GET: List milk logs with filters and pagination
export async function GET(request: NextRequest) {
  return withApiMiddleware({
    requireAuth: true,
    requireTenant: true,
    rateLimitEndpoint: 'analytics',
    version: 'v2',
  })(request, async (req, context) => {
    try {
      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const params = Object.fromEntries(searchParams.entries());
      const validatedParams = listMilkLogsSchema.parse(params);
      const supabase = getSupabaseClient();
      const { tenantId } = context;
      // Build query
      let query = supabase
        .from('milk_logs')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);
      // Apply filters
      if (validatedParams.animalId) {
        query = query.eq('animal_id', validatedParams.animalId);
      }
      if (validatedParams.date) {
        query = query.eq('date', validatedParams.date);
      } else if (validatedParams.startDate && validatedParams.endDate) {
        query = query.gte('date', validatedParams.startDate).lte('date', validatedParams.endDate);
      }
      // Apply pagination
      const offset = (validatedParams.page - 1) * validatedParams.limit;
      query = query
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + validatedParams.limit - 1);
      const {
        data: logs,
        error,
        count,
      } = (await query) as { data: any[] | null; error: any; count: number | null };
      if (error) {
        throw new Error('Failed to fetch milk logs');
      }
      // Transform to camelCase for frontend
      const transformedLogs = (logs || []).map((log: any) => ({
        id: log.id,
        tenantId: log.tenant_id,
        animalId: log.animal_id,
        date: log.date,
        session: log.session,
        yield: log.yield,
        quality: log.quality,
        notes: log.notes,
        createdAt: log.created_at,
        updatedAt: log.updated_at,
      }));
      // Calculate pagination metadata
      const totalPages = count ? Math.ceil(count / validatedParams.limit) : 0;
      // Log the API event
      await logApiEvent({
        userId: context.userId,
        tenantId: context.tenantId,
        action: 'list',
        resource: 'milk_logs',
        details: { filters: validatedParams, count: logs?.length },
        requestId: context.requestId,
      });
      return createSuccessResponse(
        {
          logs: transformedLogs,
          pagination: {
            page: validatedParams.page,
            limit: validatedParams.limit,
            total: count || 0,
            totalPages,
          },
        },
        `Found ${logs?.length || 0} milk logs`
      );
    } catch (error) {
      throw error;
    }
  });
}
// POST: Create new milk log
export async function POST(request: NextRequest) {
  return withApiMiddleware({
    requireAuth: true,
    requireTenant: true,
    rateLimitEndpoint: 'analytics',
    validateSchema: createMilkLogSchema,
    subscriptionAction: 'create_milk_log',
    version: 'v2',
  })(request, async (req, context) => {
    try {
      const body = await req.json();
      const validatedData = createMilkLogSchema.parse(body);
      const supabase = getSupabaseClient();
      const { tenantId } = context;
      // Verify the animal belongs to this tenant
      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('id, tag, name')
        .eq('id', validatedData.animalId)
        .eq('tenant_id', tenantId)
        .single();
      if (animalError || !animal) {
        throw new Error("Animal not found or doesn't belong to your farm");
      }
      // Check for duplicate entry (same animal, date, session)
      const { data: existing } = await supabase
        .from('milk_logs')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('animal_id', validatedData.animalId)
        .eq('date', validatedData.date)
        .eq('session', validatedData.session)
        .single();
      if (existing) {
        throw new Error(
          `Milk log already exists for ${animal.tag} on ${validatedData.date} (${validatedData.session})`
        );
      }
      // Create milk log
      const { data: milkLog, error } = (await supabase
        .from('milk_logs')
        .insert({
          tenant_id: tenantId,
          animal_id: validatedData.animalId,
          date: validatedData.date,
          session: validatedData.session,
          yield: validatedData.yield,
          quality: validatedData.quality || null,
          notes: validatedData.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()) as { data: any; error: any };
      if (error) {
        throw new Error('Failed to create milk log');
      }
      // Transform to camelCase
      const transformedLog = {
        id: milkLog.id,
        tenantId: milkLog.tenant_id,
        animalId: milkLog.animal_id,
        date: milkLog.date,
        session: milkLog.session,
        yield: milkLog.yield,
        quality: milkLog.quality,
        notes: milkLog.notes,
        createdAt: milkLog.created_at,
        updatedAt: milkLog.updated_at,
      };
      // Log the API event
      await logApiEvent({
        userId: context.userId,
        tenantId: context.tenantId,
        action: 'create',
        resource: 'milk_logs',
        details: {
          milkLogId: milkLog.id,
          animalId: validatedData.animalId,
          yield: validatedData.yield,
        },
        requestId: context.requestId,
      });
      return createSuccessResponse(
        transformedLog,
        `Milk log created for ${animal.name || animal.tag}`
      );
    } catch (error) {
      throw error;
    }
  });
}