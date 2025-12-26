// API Route: Sales - Migrated to Supabase
import { NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { successResponse, errorResponse, ValidationError } from '@/lib/api/response';
import { transformFromDb, transformToDb } from '@/lib/utils/transform';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
// Validation schema
const saleSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(['milk', 'animal', 'manure', 'other']),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  pricePerUnit: z.number().positive(),
  buyerName: z.string().max(100).optional(),
  buyerPhone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});
// GET: List sales
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const type = searchParams.get('type');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const supabase = getSupabaseClient();
      let query = supabase
        .from('sales')
        .select('*', { count: 'exact' })
        .eq('tenant_id', context.tenantId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      // Apply filters
      if (type) {
        query = query.eq('type', type);
      }
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      const { data, error, count } = await query;
      if (error) {
        return errorResponse(error);
      }
      // Transform data from snake_case to camelCase
      const sales = data ? transformFromDb(data) : [];
      return successResponse(sales, {
        meta: {
          total: count || 0,
          page,
          limit,
          hasMore: count ? from + limit < count : false,
        },
      });
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}
// POST: Create sale
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      
      // Validate request body
      const validatedData = saleSchema.parse(body);
      const supabase = getSupabaseClient();
      
      // Calculate total
      const total = validatedData.quantity * validatedData.pricePerUnit;
      
      // Transform to snake_case for database
      const saleData = transformToDb({
        ...validatedData,
        total,
        recordedBy: context.userId,
      });
      const { data, error } = await supabase
        .from('sales')
        .insert({
          ...saleData,
          tenant_id: context.tenantId,
          currency: 'PKR',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        return errorResponse(error);
      }
      // Transform response to camelCase
      const sale = transformFromDb(data);
      return successResponse(sale, {
        message: 'Sale created successfully',
        status: 201,
      });
    } catch (error) {
      
      if (error instanceof z.ZodError) {
        return errorResponse(ValidationError.fromZodError(error));
      }
      
      return errorResponse(error);
    }
  })(request);
}