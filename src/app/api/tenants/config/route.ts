// API Route: Get/Update Tenant Config (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { checkUserRole } from '@/lib/api/middleware';
import { DEFAULT_TENANT_CONFIG } from '@/lib/constants';
export const dynamic = 'force-dynamic';
// GET: Fetch tenant config
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      const { data: tenant, error } = (await supabase
        .from('tenants')
        .select('*')
        .eq('id', context.tenantId)
        .single()) as { data: any; error: any };
      if (error || !tenant) {
        // Return default config for graceful degradation
        return NextResponse.json({
          success: true,
          config: {
            farmName: 'Your Farm',
            ...DEFAULT_TENANT_CONFIG,
          },
          message: 'Using default configuration',
        });
      }
      // Transform to camelCase
      const config = {
        id: tenant.id,
        slug: tenant.slug,
        farmName: tenant.farm_name,
        logoUrl: tenant.logo_url,
        primaryColor: tenant.primary_color,
        accentColor: tenant.accent_color,
        language: tenant.language,
        currency: tenant.currency,
        timezone: tenant.timezone,
        animalTypes: tenant.animal_types,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      };
      return NextResponse.json({ success: true, config });
    } catch (error) {
      return NextResponse.json({
        success: true,
        config: {
          farmName: 'Your Farm',
          ...DEFAULT_TENANT_CONFIG,
        },
        message: 'Error loading configuration, using defaults',
      });
    }
  })(request);
}
// PUT: Update tenant config (owner/manager only)
export async function PUT(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      // Check if user has permission
      const hasPermission = await checkUserRole(context.tenantId, context.userId, [
        'owner',
        'manager',
      ]);
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      const body = await req.json();
      const updates: any = {
        updated_at: new Date().toISOString(),
      };
      // Only include provided fields
      if (body.farmName !== undefined) updates.farm_name = body.farmName;
      if (body.logoUrl !== undefined) updates.logo_url = body.logoUrl;
      if (body.primaryColor !== undefined) updates.primary_color = body.primaryColor;
      if (body.accentColor !== undefined) updates.accent_color = body.accentColor;
      if (body.language !== undefined) updates.language = body.language;
      if (body.currency !== undefined) updates.currency = body.currency;
      if (body.timezone !== undefined) updates.timezone = body.timezone;
      if (body.animalTypes !== undefined) updates.animal_types = body.animalTypes;
      const { error } = (await supabase
        .from('tenants')
        .update(updates)
        .eq('id', context.tenantId)) as { error: any };
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to update configuration' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, message: 'Configuration updated' });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}