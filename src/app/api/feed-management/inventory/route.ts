import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
import { fetchAllRows, tenantDb, toCamel, toSnake, unwrap } from '@/lib/supabase/tenant-db';
import { sanitizeSearchTerm } from '@/lib/services/animals/animal.service';
import { logger } from '@/lib/logger';

// z.coerce.boolean() turns the string "false" into true; parse query flags explicitly
const queryBool = z
  .enum(['true', 'false'])
  .transform(v => v === 'true')
  .optional();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeedRow = Record<string, any>;
const DAY_MS = 24 * 60 * 60 * 1000;
const isLow = (i: FeedRow) =>
  i.minimum_stock != null && Number(i.quantity) <= Number(i.minimum_stock);
const isExpiringSoon = (i: FeedRow) =>
  Boolean(i.expiry_date) && new Date(i.expiry_date) <= new Date(Date.now() + 30 * DAY_MS);
// Validation schemas
const feedInventoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  feedType: z.enum(['concentrate', 'silage', 'hay', 'minerals', 'supplements', 'water']).optional(),
  supplier: z.string().optional(),
  lowStock: queryBool,
  expiringSoon: queryBool,
  search: z.string().optional(),
  isActive: queryBool.transform(v => v ?? true),
});
const createFeedInventorySchema = z.object({
  feedType: z.enum(['concentrate', 'silage', 'hay', 'minerals', 'supplements', 'water']),
  feedName: z.string().min(2).max(255),
  quantity: z.number().min(0),
  unit: z.enum(['kg', 'liters', 'grams', 'tons']).default('kg'),
  unitPrice: z.number().min(0),
  purchaseDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  supplier: z.string().max(255).optional(),
  batchNumber: z.string().max(100).optional(),
  storageLocation: z.string().max(255).optional(),
  minimumStock: z.number().min(0).default(100),
  nutritionalInfo: z
    .object({
      protein: z.number(),
      fat: z.number(),
      fiber: z.number(),
      moisture: z.number(),
      energy: z.number(),
    })
    .optional(),
});
// GET /api/feed-management/inventory - List feed inventory with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = feedInventoryQuerySchema.parse(Object.fromEntries(searchParams));
    const t = tenantDb(tenantContext.tenantId);
    const from = (query.page - 1) * query.limit;
    const buildQuery = (options?: { count: 'exact' }) => {
      let q = t
        .select('feed_inventory', '*', options)
        .eq('is_active', query.isActive)
        .order('purchase_date', { ascending: false })
        .order('id');
      if (query.feedType) q = q.eq('feed_type', query.feedType);
      const supplier = query.supplier && sanitizeSearchTerm(query.supplier);
      if (supplier) q = q.ilike('supplier', `%${supplier}%`);
      const search = query.search && sanitizeSearchTerm(query.search);
      if (search) q = q.ilike('feed_name', `%${search}%`);
      if (query.expiringSoon) {
        q = q
          .not('expiry_date', 'is', null)
          .lte('expiry_date', new Date(Date.now() + 30 * DAY_MS).toISOString());
      }
      return q;
    };

    let inventoryList: FeedRow[];
    let total: number;
    if (query.lowStock) {
      // quantity <= minimum_stock compares two columns, which PostgREST cannot filter
      const all = (await fetchAllRows<FeedRow>(() => buildQuery(), 'List feed inventory')).filter(
        isLow
      );
      total = all.length;
      inventoryList = all.slice(from, from + query.limit);
    } else {
      const { data, error, count } = await buildQuery({ count: 'exact' }).range(
        from,
        from + query.limit - 1
      );
      if (error) throw new Error(`List feed inventory: ${error.message}`);
      inventoryList = (data || []) as unknown as FeedRow[];
      total = count || 0;
    }

    // Calculate stock status for each item
    const inventoryWithStatus = inventoryList.map(item => ({
      ...toCamel<FeedRow>(item),
      stockStatus: isLow(item) ? 'low' : 'adequate',
      daysToExpiry: item.expiry_date
        ? Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / DAY_MS)
        : null,
      isExpiringSoon: isExpiringSoon(item),
    }));
    return NextResponse.json({
      success: true,
      data: {
        inventory: inventoryWithStatus,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        summary: {
          totalItems: inventoryList.length,
          lowStockItems: inventoryList.filter(isLow).length,
          expiringSoonItems: inventoryList.filter(isExpiringSoon).length,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Feed inventory list failed', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/feed-management/inventory - Add new feed inventory
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = createFeedInventorySchema.parse(body);
    const tenantContext = await getTenantContext();
    const now = new Date().toISOString();
    const created = unwrap(
      await tenantDb(tenantContext.tenantId)
        .insert(
          'feed_inventory',
          toSnake({
            id: `feed_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            ...validatedData,
            createdBy: tenantContext.userId,
            createdAt: now,
            updatedAt: now,
          })
        )
        .select()
        .single(),
      'Create feed inventory'
    );
    return NextResponse.json({
      success: true,
      data: toCamel(created as unknown as FeedRow),
      message: 'Feed inventory item added successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/feed-management/inventory?id=xxx - Soft delete feed inventory
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feed item ID is required' },
        { status: 400 }
      );
    }
    unwrap(
      await tenantDb(tenantContext.tenantId)
        .update('feed_inventory', { is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id),
      'Archive feed inventory'
    );

    return NextResponse.json({ success: true, message: 'Feed item archived successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
