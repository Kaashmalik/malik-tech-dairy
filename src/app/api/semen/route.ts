// API Route: Semen Inventory CRUD
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { createApiResponse, createApiError } from '@/lib/supabase/types';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// =============================================================================
// GET: List semen inventory
// =============================================================================
export async function GET(request: NextRequest) {
    return withTenantContext(async (req, context) => {
        try {
            const supabase = getSupabaseClient();
            const { searchParams } = new URL(req.url);
            const species = searchParams.get('species');
            const status = searchParams.get('status');
            const availableOnly = searchParams.get('availableOnly') === 'true';

            let query = supabase
                .from('semen_inventory')
                .select('*')
                .eq('tenant_id', context.tenantId)
                .order('created_at', { ascending: false })
                .limit(200);

            if (species) {
                query = query.eq('species', species);
            }
            if (status) {
                query = query.eq('status', status);
            }
            if (availableOnly) {
                query = query.eq('status', 'available').gt('quantity', 0);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: inventory, error } = await query as { data: any[] | null; error: any };

            if (error) {
                logger.error('Error fetching semen inventory', error, { tenantId: context.tenantId });
                return NextResponse.json(createApiError('Failed to fetch semen inventory', 'FETCH_ERROR'), { status: 500 });
            }

            // Check for expired straws
            const now = new Date();
            const transformedInventory = (inventory || []).map((item) => {
                const isExpired = item.expiry_date && new Date(item.expiry_date) < now;

                return {
                    id: item.id,
                    tenantId: item.tenant_id,
                    strawCode: item.straw_code,
                    bullName: item.bull_name,
                    bullBreed: item.bull_breed,
                    bullRegistrationNumber: item.bull_registration_number,
                    sourceCenter: item.source_center,
                    species: item.species,
                    quantity: item.quantity,
                    purchaseDate: item.purchase_date,
                    expiryDate: item.expiry_date,
                    storageLocation: item.storage_location,
                    costPerStraw: item.cost_per_straw,
                    status: isExpired && item.status === 'available' ? 'expired' : item.status,
                    notes: item.notes,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                    isExpired,
                    isLowStock: item.quantity <= 2 && item.quantity > 0,
                };
            });

            // Summary
            const summary = {
                totalStraws: transformedInventory.reduce((sum, i) => sum + (i.status === 'available' ? i.quantity : 0), 0),
                totalItems: transformedInventory.length,
                available: transformedInventory.filter(i => i.status === 'available' && i.quantity > 0).length,
                expired: transformedInventory.filter(i => i.isExpired).length,
                lowStock: transformedInventory.filter(i => i.isLowStock).length,
            };

            return NextResponse.json(createApiResponse({
                summary,
                inventory: transformedInventory,
            }));
        } catch (error) {
            logger.error('Error in semen inventory GET', error, { tenantId: context.tenantId });
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            );
        }
    })(request);
}

// =============================================================================
// POST: Add semen to inventory
// =============================================================================
export async function POST(request: NextRequest) {
    return withTenantContext(async (req, context) => {
        try {
            const supabase = getSupabaseClient();
            const body = await req.json();

            const {
                strawCode,
                bullName,
                bullBreed,
                bullRegistrationNumber,
                sourceCenter,
                species,
                quantity = 1,
                purchaseDate,
                expiryDate,
                storageLocation,
                costPerStraw,
                notes,
            } = body;

            // Validation
            if (!strawCode || !bullName || !species) {
                return NextResponse.json(
                    { success: false, error: 'Missing required fields: strawCode, bullName, species' },
                    { status: 400 }
                );
            }

            // Validate species
            const validSpecies = ['cow', 'buffalo', 'goat', 'sheep', 'horse'];
            if (!validSpecies.includes(species)) {
                return NextResponse.json(
                    { success: false, error: `Invalid species. Must be one of: ${validSpecies.join(', ')}` },
                    { status: 400 }
                );
            }

            // Check for duplicate straw code
            const { data: existing } = await supabase
                .from('semen_inventory')
                .select('id')
                .eq('tenant_id', context.tenantId)
                .eq('straw_code', strawCode)
                .single();

            if (existing) {
                return NextResponse.json(
                    { success: false, error: 'Straw code already exists in inventory' },
                    { status: 409 }
                );
            }

            const now = new Date().toISOString();
            const itemId = uuidv4();

            const itemData = {
                id: itemId,
                tenant_id: context.tenantId,
                straw_code: strawCode,
                bull_name: bullName,
                bull_breed: bullBreed || null,
                bull_registration_number: bullRegistrationNumber || null,
                source_center: sourceCenter || null,
                species: species,
                quantity: parseInt(quantity) || 1,
                purchase_date: purchaseDate ? new Date(purchaseDate).toISOString().split('T')[0] : null,
                expiry_date: expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : null,
                storage_location: storageLocation || null,
                cost_per_straw: costPerStraw ? parseFloat(costPerStraw) : null,
                status: 'available',
                notes: notes || null,
                created_at: now,
                updated_at: now,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newItem, error } = await (supabase.from('semen_inventory') as any)
                .insert(itemData)
                .select()
                .single();

            if (error) {
                logger.error('Database error creating semen inventory', error, { tenantId: context.tenantId });
                return NextResponse.json(
                    { success: false, error: 'Failed to add semen to inventory', details: error.message },
                    { status: 500 }
                );
            }

            // Transform response
            const response = {
                id: newItem?.id,
                tenantId: newItem?.tenant_id,
                strawCode: newItem?.straw_code,
                bullName: newItem?.bull_name,
                bullBreed: newItem?.bull_breed,
                species: newItem?.species,
                quantity: newItem?.quantity,
                status: newItem?.status,
                createdAt: newItem?.created_at,
            };

            return NextResponse.json({
                success: true,
                item: response,
                message: `Added ${quantity} straw(s) from ${bullName} to inventory`,
            });
        } catch (error) {
            logger.error('Error creating semen inventory', error, { tenantId: context.tenantId });
            return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
        }
    })(request);
}

// =============================================================================
// PUT: Update semen inventory item
// =============================================================================
export async function PUT(request: NextRequest) {
    return withTenantContext(async (req, context) => {
        try {
            const supabase = getSupabaseClient();
            const body = await req.json();
            const { id, ...updateData } = body;

            if (!id) {
                return NextResponse.json(
                    { success: false, error: 'Missing required field: id' },
                    { status: 400 }
                );
            }

            // Build update object with snake_case
            const updateObj: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };

            if (updateData.quantity !== undefined) updateObj.quantity = parseInt(updateData.quantity);
            if (updateData.status !== undefined) updateObj.status = updateData.status;
            if (updateData.storageLocation !== undefined) updateObj.storage_location = updateData.storageLocation;
            if (updateData.notes !== undefined) updateObj.notes = updateData.notes;
            if (updateData.expiryDate !== undefined) updateObj.expiry_date = updateData.expiryDate;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: updatedItem, error } = await (supabase.from('semen_inventory') as any)
                .update(updateObj)
                .eq('id', id)
                .eq('tenant_id', context.tenantId)
                .select()
                .single();

            if (error) {
                logger.error('Database error updating semen inventory', error, { tenantId: context.tenantId });
                return NextResponse.json(
                    { success: false, error: 'Failed to update semen inventory', details: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                item: updatedItem,
                message: 'Semen inventory updated successfully',
            });
        } catch (error) {
            logger.error('Error updating semen inventory', error, { tenantId: context.tenantId });
            return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
        }
    })(request);
}

// =============================================================================
// DELETE: Remove semen from inventory
// =============================================================================
export async function DELETE(request: NextRequest) {
    return withTenantContext(async (req, context) => {
        try {
            const supabase = getSupabaseClient();
            const { searchParams } = new URL(req.url);
            const id = searchParams.get('id');

            if (!id) {
                return NextResponse.json(
                    { success: false, error: 'Missing required parameter: id' },
                    { status: 400 }
                );
            }

            const { error } = await supabase
                .from('semen_inventory')
                .delete()
                .eq('id', id)
                .eq('tenant_id', context.tenantId);

            if (error) {
                logger.error('Database error deleting semen inventory', error, { tenantId: context.tenantId });
                return NextResponse.json(
                    { success: false, error: 'Failed to delete semen inventory item', details: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Semen inventory item deleted successfully',
            });
        } catch (error) {
            logger.error('Error deleting semen inventory', error, { tenantId: context.tenantId });
            return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
        }
    })(request);
}
