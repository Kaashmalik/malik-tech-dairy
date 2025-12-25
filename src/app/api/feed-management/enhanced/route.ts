import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and, or, ilike, gte, lte, desc, asc, sql, between } from 'drizzle-orm';
import { getDrizzle, getSupabaseClient } from '@/lib/supabase';
import { feedInventory, animals, tenants } from '@/db/schema';
import { getTenantContext } from '@/lib/tenant/context';
// Note: nutrition_requirements accessed via Supabase REST API
import { z } from 'zod';
// Enhanced feed query schema
const enhancedFeedQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 20)),
  search: z.string().optional(),
  category: z
    .string()
    .optional()
    .transform(val => (val ? val.split(',') : [])),
  qualityGrade: z
    .string()
    .optional()
    .transform(val => (val ? val.split(',') : [])),
  lowStock: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  expiringSoon: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  sortBy: z.enum(['name', 'category', 'currentStock', 'expiryDate', 'unitCost']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  minStock: z
    .string()
    .optional()
    .transform(val => (val ? parseFloat(val) : undefined)),
  maxStock: z
    .string()
    .optional()
    .transform(val => (val ? parseFloat(val) : undefined)),
  minCost: z
    .string()
    .optional()
    .transform(val => (val ? parseFloat(val) : undefined)),
  maxCost: z
    .string()
    .optional()
    .transform(val => (val ? parseFloat(val) : undefined)),
  expiryDays: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : undefined)),
  storageLocation: z.string().optional(),
});
// GET /api/feed-management/enhanced - Advanced feed inventory with analytics
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
    const db = getDrizzle();
    const { searchParams } = new URL(request.url);
    const query = enhancedFeedQuerySchema.parse(Object.fromEntries(searchParams));
    const {
      page,
      limit,
      search,
      category,
      qualityGrade,
      lowStock,
      expiringSoon,
      sortBy,
      sortOrder,
      minStock,
      maxStock,
      minCost,
      maxCost,
      expiryDays,
      storageLocation,
    } = query;
    // Build where conditions
    const whereConditions = [
      eq(feedInventory.tenantId, tenantContext.tenantId),
      eq(feedInventory.isActive, true),
    ];
    // Search functionality
    if (search) {
      const searchConditions = [
        ilike(feedInventory.feedName, `%${search}%`),
        ilike(feedInventory.supplier ?? '', `%${search}%`),
        ilike(feedInventory.batchNumber ?? '', `%${search}%`),
        ilike(feedInventory.storageLocation ?? '', `%${search}%`),
      ].filter(Boolean);
      if (searchConditions.length > 0) {
        whereConditions.push(or(...searchConditions)!);
      }
    }
    // Category filter
    if (category && category.length > 0) {
      whereConditions.push(sql`${feedInventory.feedType} = ANY(${category})`);
    }
    // Quality grade filter (using feedType as category since qualityGrade doesn't exist)
    if (qualityGrade && qualityGrade.length > 0) {
      whereConditions.push(sql`${feedInventory.feedType} = ANY(${qualityGrade})`);
    }
    // Low stock filter
    if (lowStock) {
      whereConditions.push(sql`${feedInventory.quantity} <= ${feedInventory.minimumStock}`);
    }
    // Expiring soon filter
    if (expiringSoon) {
      const days = expiryDays || 30;
      whereConditions.push(
        sql`${feedInventory.expiryDate} <= CURRENT_DATE + INTERVAL '${days} days'`
      );
    }
    // Stock range filter
    if (minStock !== undefined || maxStock !== undefined) {
      if (minStock !== undefined && maxStock !== undefined) {
        whereConditions.push(
          sql`${feedInventory.quantity} >= ${minStock} AND ${feedInventory.quantity} <= ${maxStock}`
        );
      } else if (minStock !== undefined) {
        whereConditions.push(sql`${feedInventory.quantity} >= ${minStock}`);
      } else if (maxStock !== undefined) {
        whereConditions.push(sql`${feedInventory.quantity} <= ${maxStock}`);
      }
    }
    // Cost range filter
    if (minCost !== undefined || maxCost !== undefined) {
      if (minCost !== undefined && maxCost !== undefined) {
        whereConditions.push(
          sql`${feedInventory.unitPrice} >= ${minCost} AND ${feedInventory.unitPrice} <= ${maxCost}`
        );
      } else if (minCost !== undefined) {
        whereConditions.push(sql`${feedInventory.unitPrice} >= ${minCost}`);
      } else if (maxCost !== undefined) {
        whereConditions.push(sql`${feedInventory.unitPrice} <= ${maxCost}`);
      }
    }
    // Storage location filter
    if (storageLocation) {
      whereConditions.push(ilike(feedInventory.storageLocation, `%${storageLocation}%`));
    }
    // Combine all conditions
    const finalWhereCondition =
      whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];
    // Build order by
    let orderBy;
    switch (sortBy) {
      case 'category':
        orderBy = sortOrder === 'desc' ? desc(feedInventory.feedType) : asc(feedInventory.feedType);
        break;
      case 'currentStock':
        orderBy = sortOrder === 'desc' ? desc(feedInventory.quantity) : asc(feedInventory.quantity);
        break;
      case 'expiryDate':
        orderBy =
          sortOrder === 'desc' ? desc(feedInventory.expiryDate) : asc(feedInventory.expiryDate);
        break;
      case 'unitCost':
        orderBy =
          sortOrder === 'desc' ? desc(feedInventory.unitPrice) : asc(feedInventory.unitPrice);
        break;
      default:
        orderBy = sortOrder === 'desc' ? desc(feedInventory.feedName) : asc(feedInventory.feedName);
    }
    // Execute main query
    const [feedData, totalCount] = await Promise.all([
      db
        .select({
          id: feedInventory.id,
          ingredientName: feedInventory.feedName,
          category: feedInventory.feedType,
          currentStock: feedInventory.quantity,
          unit: feedInventory.unit,
          reorderLevel: feedInventory.minimumStock,
          maxStockLevel: feedInventory.quantity, // Using quantity as max stock for now
          unitCost: feedInventory.unitPrice,
          totalValue: sql<number>`(${feedInventory.quantity} * ${feedInventory.unitPrice})`,
          supplierName: feedInventory.supplier,
          batchNumber: feedInventory.batchNumber,
          manufactureDate: feedInventory.purchaseDate,
          expiryDate: feedInventory.expiryDate,
          storageLocation: feedInventory.storageLocation,
          qualityGrade: sql<string>`'A'`, // Mock quality grade
          moistureContent: sql<number>`12.5`, // Mock moisture content
          proteinContent: sql<number>`18.2`, // Mock protein content
          energyContent: sql<number>`3500`, // Mock energy content
          averageDailyConsumption: sql<number>`50`, // Mock daily consumption
          createdAt: sql<string>`CURRENT_TIMESTAMP`,
          updatedAt: sql<string>`CURRENT_TIMESTAMP`,
          // Computed fields
          daysUntilExpiry: sql<number>`CASE 
            WHEN ${feedInventory.expiryDate} IS NULL THEN NULL 
            ELSE GREATEST(0, ${feedInventory.expiryDate} - CURRENT_DATE) 
          END`.as('daysUntilExpiry'),
          stockStatus: sql<string>`CASE
            WHEN ${feedInventory.quantity} <= ${feedInventory.minimumStock} THEN 'critical'
            WHEN ${feedInventory.quantity} <= (${feedInventory.minimumStock} * 1.5) THEN 'low'
            WHEN ${feedInventory.quantity} >= (${feedInventory.minimumStock} * 3) THEN 'overstock'
            ELSE 'adequate'
          END`.as('stockStatus'),
          daysOfSupply: sql<number>`CASE
            WHEN 50 > 0 THEN 
              FLOOR(${feedInventory.quantity} / 50)
            ELSE NULL
          END`.as('daysOfSupply'),
          usageRate: sql<number>`COALESCE(50, 0)`.as('usageRate'),
        })
        .from(feedInventory)
        .where(finalWhereCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(feedInventory)
        .where(finalWhereCondition)
        .then((result: any[]) => result[0]?.count || 0),
    ]);
    // Calculate inventory analytics
    const analytics = await calculateFeedAnalytics(tenantContext.tenantId, db);
    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    return NextResponse.json({
      success: true,
      data: {
        feedItems: feedData,
        analytics,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          applied: {
            search,
            category,
            qualityGrade,
            lowStock,
            expiringSoon,
            sortBy,
            sortOrder,
            stockRange:
              minStock !== undefined || maxStock !== undefined
                ? { min: minStock, max: maxStock }
                : undefined,
            costRange:
              minCost !== undefined || maxCost !== undefined
                ? { min: minCost, max: maxCost }
                : undefined,
            expiryDays,
            storageLocation,
          },
          available: {
            categories: await getDistinctValues('category', tenantContext.tenantId, db),
            qualityGrades: await getDistinctValues('quality_grade', tenantContext.tenantId, db),
            storageLocations: await getDistinctValues(
              'storage_location',
              tenantContext.tenantId,
              db
            ),
          },
        },
      },
      message: `Found ${feedData.length} feed items`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch feed inventory',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
// Helper function to calculate feed analytics
async function calculateFeedAnalytics(tenantId: string, db: any) {
  try {
    const [totalValue, lowStockItems, expiringItems, categoryBreakdown] = await Promise.all([
      // Total inventory value
      db
        .select({
          total: sql<number>`COALESCE(SUM(${feedInventory.quantity} * ${feedInventory.unitPrice}), 0)`,
        })
        .from(feedInventory)
        .where(and(eq(feedInventory.tenantId, tenantId), eq(feedInventory.isActive, true)))
        .then((result: any[]) => result[0]?.total || 0),
      // Low stock items count
      db
        .select({ count: sql<number>`count(*)` })
        .from(feedInventory)
        .where(
          and(
            eq(feedInventory.tenantId, tenantId),
            eq(feedInventory.isActive, true),
            sql`${feedInventory.quantity} <= ${feedInventory.minimumStock}`
          )
        )
        .then((result: any[]) => result[0]?.count || 0),
      // Expiring items count (next 30 days)
      db
        .select({ count: sql<number>`count(*)` })
        .from(feedInventory)
        .where(
          and(
            eq(feedInventory.tenantId, tenantId),
            eq(feedInventory.isActive, true),
            sql`${feedInventory.expiryDate} <= CURRENT_DATE + INTERVAL '30 days'`
          )
        )
        .then((result: any[]) => result[0]?.count || 0),
      // Category breakdown
      db
        .select({
          category: feedInventory.feedType,
          totalValue: sql<number>`COALESCE(SUM(${feedInventory.quantity} * ${feedInventory.unitPrice}), 0)`,
          totalStock: sql<number>`COALESCE(SUM(${feedInventory.quantity}), 0)`,
          itemCount: sql<number>`count(*)`,
        })
        .from(feedInventory)
        .where(and(eq(feedInventory.tenantId, tenantId), eq(feedInventory.isActive, true)))
        .groupBy(feedInventory.feedType)
        .orderBy(desc(sql`SUM(${feedInventory.quantity} * ${feedInventory.unitPrice})`)),
    ]);
    // Calculate additional metrics
    const totalItems = categoryBreakdown.reduce((sum: number, cat: any) => sum + cat.itemCount, 0);
    const totalStock = categoryBreakdown.reduce((sum: number, cat: any) => sum + cat.totalStock, 0);
    return {
      totalValue,
      totalItems,
      totalStock,
      lowStockItems,
      expiringItems,
      categoryBreakdown: categoryBreakdown.map((cat: any) => ({
        ...cat,
        percentage: totalValue > 0 ? (cat.totalValue / totalValue) * 100 : 0,
      })),
      efficiencyMetrics: {
        averageDaysOfSupply: totalItems > 0 ? 45 : 0, // Mock calculation
        stockTurnoverRate: totalItems > 0 ? 8.5 : 0, // Mock calculation
        wastePercentage: totalItems > 0 ? 2.3 : 0, // Mock calculation
        costPerDay: totalValue > 0 ? totalValue / 30 : 0,
      },
    };
  } catch (error) {
    return {
      totalValue: 0,
      totalItems: 0,
      totalStock: 0,
      lowStockItems: 0,
      expiringItems: 0,
      categoryBreakdown: [],
      efficiencyMetrics: {
        averageDaysOfSupply: 0,
        stockTurnoverRate: 0,
        wastePercentage: 0,
        costPerDay: 0,
      },
    };
  }
}
// Helper function to get distinct values for filters
async function getDistinctValues(column: string, tenantId: string, db: any): Promise<string[]> {
  try {
    const result = await db
      .select({ value: sql<string>`DISTINCT ${sql.raw(column)}` })
      .from(feedInventory)
      .where(
        and(
          eq(feedInventory.tenantId, tenantId),
          eq(feedInventory.isActive, true),
          sql`${sql.raw(column)} IS NOT NULL`,
          sql`${sql.raw(column)} != ''`
        )
      )
      .orderBy(asc(sql.raw(column)));
    return result.map((row: any) => row.value).filter(Boolean);
  } catch (error) {
    return [];
  }
}