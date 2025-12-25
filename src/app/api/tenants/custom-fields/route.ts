// API Route: Custom Fields Configuration
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
const customFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'dropdown']),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(), // For dropdown type
  defaultValue: z.union([z.string(), z.number()]).optional(),
});
const customFieldsSchema = z.array(customFieldSchema);
// GET: Get custom fields configuration
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      // Get custom fields from custom_fields_config table
      const { data, error } = await supabase
        .from('custom_fields_config')
        .select('*')
        .eq('tenant_id', context.tenantId);
      if (error) {
        if (process.env.NODE_ENV === 'development') {
        }
        // Return empty array if table doesn't exist or other error
        return NextResponse.json({ success: true, fields: [] });
      }
      // Transform to expected format
      const fields = (data || []).map(field => ({
        id: field.id,
        name: field.field_name,
        type: field.field_type,
        required: field.is_required || false,
        options: field.options || [],
        defaultValue: field.default_value,
        entityType: field.entity_type,
      }));
      return NextResponse.json({ success: true, fields });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
      }
      return NextResponse.json({ success: true, fields: [] });
    }
  })(request);
}
// POST: Update custom fields configuration
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const body = await req.json();
      // Validate
      let validated;
      try {
        validated = customFieldsSchema.parse(body.fields || []);
      } catch (error: unknown) {
        const zodError = error as { errors?: unknown[] };
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: zodError.errors },
          { status: 400 }
        );
      }
      // Delete existing fields for this tenant
      await (supabase.from('custom_fields_config') as any)
        .delete()
        .eq('tenant_id', context.tenantId);
      // Insert new fields
      const fieldsToInsert = validated.map((field, index) => ({
        id: field.id || `field_${Date.now()}_${index}`,
        tenant_id: context.tenantId,
        entity_type: 'animal', // Default entity type
        field_name: field.name,
        field_type: field.type,
        is_required: field.required || false,
        options: field.options || null,
        default_value: field.defaultValue?.toString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      if (fieldsToInsert.length > 0) {
        const { error: insertError } = await (supabase.from('custom_fields_config') as any)
          .insert(fieldsToInsert);
        if (insertError) {
          if (process.env.NODE_ENV === 'development') {
          }
          return NextResponse.json(
            { success: false, error: 'Failed to save custom fields' },
            { status: 500 }
          );
        }
      }
      return NextResponse.json({
        success: true,
        fields: validated.map((field, index) => ({
          ...field,
          id: field.id || `field_${Date.now()}_${index}`,
        })),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
      }
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}