import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant/context';
import { z } from 'zod';

// Update asset schema
const updateAssetSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    category: z.string().optional().nullable(),
    value: z.number().optional().nullable(),
    purchaseDate: z.string().optional().nullable(),
    warrantyExpiry: z.string().optional().nullable(),
    status: z.enum(['operational', 'maintenance', 'retired']).optional(),
    location: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
});

// GET /api/assets/[id] - Get a single asset
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const tenantContext = await getTenantContext();
        if (!tenantContext) {
            return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
        }

        const { id } = await params;
        const supabase = getSupabaseClient();
        const { data: asset, error } = await supabase
            .from('assets')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantContext.tenantId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });
            }
            console.error('Database error fetching asset:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch asset' }, { status: 500 });
        }

        // Transform response
        const transformedAsset = {
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
        };

        return NextResponse.json({ success: true, data: { asset: transformedAsset } });
    } catch (error) {
        console.error('Error fetching asset:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/assets/[id] - Update an asset
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const validatedData = updateAssetSchema.parse(body);

        const { id } = await params;
        const supabase = getSupabaseClient();

        // Prepare update data (convert camelCase to snake_case if necessary, but here we manually map)
        const updateData: any = {};
        if (validatedData.name !== undefined) updateData.name = validatedData.name;
        if (validatedData.type !== undefined) updateData.type = validatedData.type;
        if (validatedData.category !== undefined) updateData.category = validatedData.category;
        if (validatedData.value !== undefined) updateData.value = validatedData.value;
        if (validatedData.purchaseDate !== undefined) updateData.purchase_date = validatedData.purchaseDate;
        if (validatedData.warrantyExpiry !== undefined) updateData.warranty_expiry = validatedData.warrantyExpiry;
        if (validatedData.status !== undefined) updateData.status = validatedData.status;
        if (validatedData.location !== undefined) updateData.location = validatedData.location;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;

        const { data: updatedAsset, error } = await supabase
            .from('assets')
            .update(updateData)
            .eq('id', id)
            .eq('tenant_id', tenantContext.tenantId)
            .select()
            .single();

        if (error) {
            console.error('Database error updating asset:', error);
            return NextResponse.json({ success: false, error: 'Failed to update asset' }, { status: 500 });
        }

        // Transform response
        const transformedAsset = {
            id: updatedAsset.id,
            tenantId: updatedAsset.tenant_id,
            name: updatedAsset.name,
            type: updatedAsset.type,
            category: updatedAsset.category,
            value: updatedAsset.value,
            purchaseDate: updatedAsset.purchase_date,
            warrantyExpiry: updatedAsset.warranty_expiry,
            status: updatedAsset.status,
            location: updatedAsset.location,
            description: updatedAsset.description,
            createdAt: updatedAsset.created_at,
            updatedAt: updatedAsset.updated_at,
        };

        return NextResponse.json({
            success: true,
            data: { asset: transformedAsset },
            message: 'Asset updated successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error updating asset:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/assets/[id] - Delete an asset
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const tenantContext = await getTenantContext();
        if (!tenantContext) {
            return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
        }

        const { id } = await params;
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantContext.tenantId);

        if (error) {
            console.error('Database error deleting asset:', error);
            return NextResponse.json({ success: false, error: 'Failed to delete asset' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
