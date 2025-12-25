// API Route: Expenses - Migrated to Supabase
import { NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { createClient } from '@/lib/supabase';
import { successResponse, errorResponse, ValidationError } from '@/lib/api/response';
import { transformFromDb, transformToDb } from '@/lib/utils/transform';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
// Validation schema
const expenseSchema = z.object({
  date: z.string().datetime(),
  category: z.enum(['feed', 'medicine', 'equipment', 'labor', 'maintenance', 'transport', 'other']),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  vendorName: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
});
// GET: List expenses
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const category = searchParams.get('category');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const supabase = createClient();
      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('tenant_id', context.tenantId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      // Apply filters
      if (category) {
        query = query.eq('category', category);
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
      const expenses = data ? transformFromDb(data) : [];
      return successResponse(expenses, {
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
// POST: Create expense
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      
      // Validate request body
      const validatedData = expenseSchema.parse(body);
      const supabase = createClient();
      
      // Transform to snake_case for database
      const expenseData = transformToDb({
        ...validatedData,
        recordedBy: context.userId,
      });
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
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
      const expense = transformFromDb(data);
      return successResponse(expense, {
        message: 'Expense created successfully',
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