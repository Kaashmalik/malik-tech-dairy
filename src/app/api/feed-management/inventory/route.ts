import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { feedInventory } from '@/db/schema';
import { eq, and, ilike, lte, desc, sql, isNotNull } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';

// Validation schemas
const feedInventoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  feedType: z.enum(['concentrate', 'silage', 'hay', 'minerals', 'supplements', 'water']).optional(),
  supplier: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  expiringSoon: z.coerce.boolean().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
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

    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;

    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    const whereConditions = [
      eq(feedInventory.tenantId, tenantContext.tenantId),
      eq(feedInventory.isActive, query.isActive),
    ];

    if (query.feedType) {
      whereConditions.push(eq(feedInventory.feedType, query.feedType));
    }

    if (query.supplier) {
      whereConditions.push(ilike(feedInventory.supplier, `%${query.supplier}%`));
    }

    if (query.search) {
      whereConditions.push(ilike(feedInventory.feedName, `%${query.search}%`));
    }

    if (query.lowStock === true) {
      whereConditions.push(sql`${feedInventory.quantity} <= ${feedInventory.minimumStock}`);
    }

    if (query.expiringSoon === true) {
      // Items expiring within 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      whereConditions.push(
        and(lte(feedInventory.expiryDate, thirtyDaysFromNow), isNotNull(feedInventory.expiryDate))
      );
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedInventory)
      .where(and(...whereConditions));

    const total = totalCountResult[0]?.count || 0;

    // Get feed inventory
    const inventoryList = await db
      .select()
      .from(feedInventory)
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(desc(feedInventory.purchaseDate));

    // Calculate stock status for each item
    const inventoryWithStatus = inventoryList.map(item => ({
      ...item,
      stockStatus: item.minimumStock && item.quantity <= item.minimumStock ? 'low' : 'adequate',
      daysToExpiry: item.expiryDate
        ? Math.ceil(
            (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
      isExpiringSoon: item.expiryDate
        ? new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : false,
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
          lowStockItems: inventoryList.filter(item => item.quantity <= item.minimumStock).length,
          expiringSoonItems: inventoryList.filter(
            item =>
              item.expiryDate &&
              new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          ).length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching feed inventory:', error);
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

    const db = getDrizzle();
    const inventoryId = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get tenant context
    const tenantContext = await getTenantContext();

    const newInventoryItem = await db
      .insert(feedInventory)
      .values({
        id: inventoryId,
        tenantId: tenantContext.tenantId,
        ...validatedData,
        createdBy: tenantContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newInventoryItem[0],
      message: 'Feed inventory item added successfully',
    });
  } catch (error) {
    console.error('Error adding feed inventory:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
