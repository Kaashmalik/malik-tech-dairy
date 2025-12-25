// API Route: List & Create Health Records (Supabase-based)
// Migrated from Firebase to Supabase with enterprise middleware
import { NextRequest } from 'next/server';
import { withApiMiddleware, createSuccessResponse } from '@/lib/api/middleware-v2';
import { getSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { logApiEvent } from '@/lib/api/middleware-v2';
export const dynamic = 'force-dynamic';
// Validation schemas
const createHealthRecordSchema = z.object({
  animalId: z.string().min(1, 'Animal ID is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['checkup', 'illness', 'vaccination', 'injury', 'treatment']),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  veterinarian: z.string().optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});
const listHealthRecordsSchema = z.object({
  animalId: z.string().optional(),
  type: z.enum(['checkup', 'illness', 'vaccination', 'injury', 'treatment']).optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(30),
});
// GET: List health records with filters and pagination
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
      const validatedParams = listHealthRecordsSchema.parse(params);
      const supabase = getSupabaseClient();
      const { tenantId } = context;
      // Build query
      let query = supabase
        .from('health_records')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);
      // Apply filters
      if (validatedParams.animalId) {
        query = query.eq('animal_id', validatedParams.animalId);
      }
      if (validatedParams.type) {
        query = query.eq('type', validatedParams.type);
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
        data: records,
        error,
        count,
      } = (await query) as { data: any[] | null; error: any; count: number | null };
      if (error) {
        throw new Error('Failed to fetch health records');
      }
      // Transform to camelCase for frontend
      const transformedRecords = (records || []).map((record: any) => ({
        id: record.id,
        tenantId: record.tenant_id,
        animalId: record.animal_id,
        date: record.date,
        type: record.type,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        veterinarian: record.veterinarian,
        cost: record.cost,
        notes: record.notes,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      }));
      // Calculate pagination metadata
      const totalPages = count ? Math.ceil(count / validatedParams.limit) : 0;
      // Log the API event
      await logApiEvent({
        userId: context.userId,
        tenantId: context.tenantId,
        action: 'list',
        resource: 'health_records',
        details: { filters: validatedParams, count: records?.length },
        requestId: context.requestId,
      });
      return createSuccessResponse(
        {
          records: transformedRecords,
          pagination: {
            page: validatedParams.page,
            limit: validatedParams.limit,
            total: count || 0,
            totalPages,
          },
        },
        `Found ${records?.length || 0} health records`
      );
    } catch (error) {
      throw error;
    }
  });
}
// POST: Create new health record
export async function POST(request: NextRequest) {
  return withApiMiddleware({
    requireAuth: true,
    requireTenant: true,
    rateLimitEndpoint: 'analytics',
    validateSchema: createHealthRecordSchema,
    subscriptionAction: 'create_health_record',
    version: 'v2',
  })(request, async (req, context) => {
    try {
      const body = await req.json();
      const validatedData = createHealthRecordSchema.parse(body);
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
      // Create health record
      const { data: healthRecord, error } = (await supabase
        .from('health_records')
        .insert({
          tenant_id: tenantId,
          animal_id: validatedData.animalId,
          date: validatedData.date,
          type: validatedData.type,
          diagnosis: validatedData.diagnosis || null,
          treatment: validatedData.treatment || null,
          veterinarian: validatedData.veterinarian || null,
          cost: validatedData.cost || null,
          notes: validatedData.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()) as { data: any; error: any };
      if (error) {
        throw new Error('Failed to create health record');
      }
      // Update animal's last health check date
      await supabase
        .from('animals')
        .update({
          last_health_check: validatedData.date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validatedData.animalId)
        .eq('tenant_id', tenantId);
      // Transform to camelCase
      const transformedRecord = {
        id: healthRecord.id,
        tenantId: healthRecord.tenant_id,
        animalId: healthRecord.animal_id,
        date: healthRecord.date,
        type: healthRecord.type,
        diagnosis: healthRecord.diagnosis,
        treatment: healthRecord.treatment,
        veterinarian: healthRecord.veterinarian,
        cost: healthRecord.cost,
        notes: healthRecord.notes,
        createdAt: healthRecord.created_at,
        updatedAt: healthRecord.updated_at,
      };
      // Log the API event
      await logApiEvent({
        userId: context.userId,
        tenantId: context.tenantId,
        action: 'create',
        resource: 'health_records',
        details: {
          recordId: healthRecord.id,
          animalId: validatedData.animalId,
          type: validatedData.type,
        },
        requestId: context.requestId,
      });
      return createSuccessResponse(
        transformedRecord,
        `Health record created for ${animal.name || animal.tag}`
      );
    } catch (error) {
      throw error;
    }
  });
}