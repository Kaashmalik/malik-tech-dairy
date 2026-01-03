import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant/context';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

// Query schema for listing assets
const assetQuerySchema = z.object({
    type: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
});

// Create asset schema
const createAssetSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.string().min(1, 'Type is required'),
    category: z.string().optional().nullable(),
    value: z.number().optional().nullable(),
    purchaseDate: z.string().optional().nullable(),
    warrantyExpiry: z.string().optional().nullable(),
    status: z.enum(['operational', 'maintenance', 'retired']).default('operational'),
    location: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
});

// GET /api/assets - List all assets for the tenant
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const tenantContext = await getTenantContext();
        if (!tenantContext) {
            return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const query = assetQuerySchema.parse(Object.fromEntries(searchParams));
        const { type, status, search } = query;

        const supabase = getSupabaseClient();
        let supabaseQuery = supabase
            .from('assets')
            .select('*')
            .eq('tenant_id', tenantContext.tenantId);

        // Apply filters
        if (type && type !== 'all') {
            supabaseQuery = supabaseQuery.eq('type', type);
        }
        if (status && status !== 'all') {
            supabaseQuery = supabaseQuery.eq('status', status);
        }
        if (search) {
            supabaseQuery = supabaseQuery.or(`name.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`);
        }

        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

        const { data: assets, error } = await supabaseQuery;

        if (error) {
            console.error('Database error fetching assets:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch assets' },
                { status: 500 }
            );
        }

        // Transform snake_case to camelCase for frontend
        const transformedAssets = (assets || []).map(asset => ({
            id: asset.id,
            tenantId: asset.tenant_id,
            name: asset.name,
            type: asset.type,
            category: asset.category,
            value: asset.value,
            purchaseDate: asset.purchase_date,
            warrantyExpiry: asset.warranty_expiry,
            status: asset.status,
            location: asset.location,
            description: asset.description,
            createdAt: asset.created_at,
            updatedAt: asset.updated_at,
        }));

        return NextResponse.json({
            success: true,
            data: { assets: transformedAssets },
        });
    } catch (error) {
        console.error('Error fetching assets:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/assets - Create a new asset
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const tenantContext = await getTenantContext();
        if (!tenantContext) {
            return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = createAssetSchema.parse(body);

        const supabase = getSupabaseClient();

        // Insert new asset
        const { data: newAsset, error } = await supabase
            .from('assets')
            .insert({
                id: `asst_${nanoid(10)}`,
                tenant_id: tenantContext.tenantId,
                name: validatedData.name,
                type: validatedData.type,
                category: validatedData.category || null,
                value: validatedData.value || null,
                purchase_date: validatedData.purchaseDate || null,
                warranty_expiry: validatedData.warrantyExpiry || null,
                status: validatedData.status,
                location: validatedData.location || null,
                description: validatedData.description || null,
                created_by: userId,
            })
            .select()
            .single();

        if (error) {
            console.error('Database error creating asset:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create asset' },
                { status: 500 }
            );
        }

        // Transform response
        const transformedAsset = {
            id: newAsset.id,
            tenantId: newAsset.tenant_id,
            name: newAsset.name,
            type: newAsset.type,
            category: newAsset.category,
            value: newAsset.value,
            purchaseDate: newAsset.purchase_date,
            warrantyExpiry: newAsset.warranty_expiry,
            status: newAsset.status,
            location: newAsset.location,
            description: newAsset.description,
            createdAt: newAsset.created_at,
            updatedAt: newAsset.updated_at,
        };

        return NextResponse.json(
            {
                success: true,
                data: { asset: transformedAsset },
                message: 'Asset created successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating asset:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
