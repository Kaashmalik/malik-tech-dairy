// API Route: Individual Expense Operations - Migrated to Supabase
import { NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase/server';
import {
  successResponse,
  errorResponse,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api/response';
import { transformFromDb, transformToDb } from '@/lib/utils/transform';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for updates
const updateExpenseSchema = z.object({
  date: z.string().datetime().optional(),
  category: z
    .enum(['feed', 'medicine', 'equipment', 'labor', 'maintenance', 'transport', 'other'])
    .optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  vendorName: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
});

// GET: Get single expense
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;

      const supabase = getSupabaseClient();
      const { data, error } = await (supabase.from('expenses') as any)
        .select('*')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse(new NotFoundError('Expense'));
        }
        return errorResponse(error);
      }

      // Transform to camelCase
      const expense = transformFromDb(data);

      return successResponse(expense);
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}

// PUT: Update expense
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      if (!['farm_owner', 'farm_manager', 'accountant', 'super_admin'].includes(context.userRole)) {
        return errorResponse(
          new ForbiddenError('Forbidden: Insufficient permissions to update expenses')
        );
      }

      const { id } = await params;
      const body = await req.json();

      // Validate request body
      const validatedData = updateExpenseSchema.parse(body);

      const supabase = getSupabaseClient();

      // First check if expense exists and belongs to tenant
      const { data: existing, error: fetchError } = await (supabase.from('expenses') as any)
        .select('id')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return errorResponse(new NotFoundError('Expense'));
        }
        return errorResponse(fetchError);
      }

      // Transform to snake_case for database
      const updateData = transformToDb(validatedData);

      const { data, error } = await (supabase.from('expenses') as any)
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .select()
        .single();

      if (error) {
        return errorResponse(error);
      }

      // Transform to camelCase
      const expense = transformFromDb(data);

      return successResponse(expense, {
        message: 'Expense updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(ValidationError.fromZodError(error));
      }

      return errorResponse(error);
    }
  })(request);
}

// DELETE: Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      if (!['farm_owner', 'super_admin', 'accountant'].includes(context.userRole)) {
        return errorResponse(
          new ForbiddenError('Only farm owners and accountants can delete expense records')
        );
      }

      const { id } = await params;

      const supabase = getSupabaseClient();

      // First check if expense exists and belongs to tenant
      const { data: existing, error: fetchError } = await (supabase.from('expenses') as any)
        .select('id, description')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .is('deleted_at', null)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return errorResponse(new NotFoundError('Expense'));
        }
        return errorResponse(fetchError);
      }

      const { softDeleteExpense } = await import('@/lib/soft-delete');
      await softDeleteExpense(id, context.tenantId);

      return successResponse(
        { id, deleted: true },
        {
          message: `Expense "${existing.description}" deleted successfully`,
        }
      );
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}
