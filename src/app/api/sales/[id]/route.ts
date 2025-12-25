// API Route: Individual Sale Operations - Migrated to Supabase
import { NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { createClient } from '@/lib/supabase';
import { successResponse, errorResponse, ValidationError, NotFoundError } from '@/lib/api/response';
import { transformFromDb, transformToDb } from '@/lib/utils/transform';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for updates
const updateSaleSchema = z.object({
  date: z.string().datetime().optional(),
  type: z.enum(['milk', 'animal', 'manure', 'other']).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(20).optional(),
  pricePerUnit: z.number().positive().optional(),
  buyerName: z.string().max(100).optional(),
  buyerPhone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

// GET: Get single sale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse(new NotFoundError('Sale'));
        }
        return errorResponse(error);
      }

      // Transform to camelCase
      const sale = transformFromDb(data);

      return successResponse(sale);
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}

// PUT: Update sale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const body = await req.json();

      // Validate request body
      const validatedData = updateSaleSchema.parse(body);

      const supabase = createClient();

      // First check if sale exists and belongs to tenant
      const { data: existing, error: fetchError } = await supabase
        .from('sales')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return errorResponse(new NotFoundError('Sale'));
        }
        return errorResponse(fetchError);
      }

      // Transform to snake_case for database
      const updateData = transformToDb(validatedData);

      // Recalculate total if quantity or price changed
      let total;
      if (updateData.quantity !== undefined || updateData.price_per_unit !== undefined) {
        // Get existing data to calculate new total
        const { data: current } = await supabase
          .from('sales')
          .select('quantity, price_per_unit')
          .eq('id', id)
          .single();
        
        const quantity = updateData.quantity ?? current?.quantity;
        const pricePerUnit = updateData.price_per_unit ?? current?.price_per_unit;
        total = quantity && pricePerUnit ? quantity * pricePerUnit : undefined;
      }

      const { data, error } = await supabase
        .from('sales')
        .update({
          ...updateData,
          ...(total && { total }),
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
      const sale = transformFromDb(data);

      return successResponse(sale, {
        message: 'Sale updated successfully',
      });
    } catch (error) {
      
      if (error instanceof z.ZodError) {
        return errorResponse(ValidationError.fromZodError(error));
      }
      
      return errorResponse(error);
    }
  })(request);
}

// DELETE: Delete sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;

      const supabase = createClient();

      // First check if sale exists and belongs to tenant
      const { data: existing, error: fetchError } = await supabase
        .from('sales')
        .select('id, type, quantity, unit')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return errorResponse(new NotFoundError('Sale'));
        }
        return errorResponse(fetchError);
      }

      // Delete the sale
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('tenant_id', context.tenantId);

      if (error) {
        return errorResponse(error);
      }

      return successResponse(
        { id, deleted: true },
        {
          message: `Sale of ${existing.quantity} ${existing.unit} of ${existing.type} deleted successfully`,
        }
      );
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}