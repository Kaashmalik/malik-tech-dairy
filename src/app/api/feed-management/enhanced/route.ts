import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
import { fetchAllRows, tenantDb } from '@/lib/supabase/tenant-db';
import { logger } from '@/lib/logger';

// Enhanced feed query schema
const optionalNumber = (parse: (v: string) => number) =>
  z
    .string()
    .optional()
    .transform(val => (val ? parse(val) : undefined))
    .refine(val => val === undefined || Number.isFinite(val), 'Must be a number');
const csvList = z
  .string()
  .optional()
  .transform(val => (val ? val.split(',').filter(Boolean) : []));

const enhancedFeedQuerySchema = z.object({
  page: optionalNumber(parseInt).transform(v => Math.max(1, v ?? 1)),
  limit: optionalNumber(parseInt).transform(v => Math.min(100, Math.max(1, v ?? 20))),
  search: z.string().optional(),
  category: csvList,
  qualityGrade: csvList,
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
  minStock: optionalNumber(parseFloat),
  maxStock: optionalNumber(parseFloat),
  minCost: optionalNumber(parseFloat),
  maxCost: optionalNumber(parseFloat),
  expiryDays: optionalNumber(parseInt),
  storageLocation: z.string().optional(),
});

interface FeedRow {
  id: string;
  feed_name: string;
  feed_type: string;
  quantity: number;
  unit: string;
  unit_price: number;
  minimum_stock: number | null;
  supplier: string | null;
  batch_number: string | null;
  purchase_date: string | null;
  expiry_date: string | null;
  storage_location: string | null;
  nutritional_info: { protein?: number; moisture?: number; energy?: number } | null;
  created_at: string;
  updated_at: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function stockStatus(item: FeedRow): 'critical' | 'low' | 'overstock' | 'adequate' {
  const min = Number(item.minimum_stock ?? 0);
  const qty = Number(item.quantity);
  if (min <= 0) return 'adequate';
  if (qty <= min) return 'critical';
  if (qty <= min * 1.5) return 'low';
  if (qty >= min * 3) return 'overstock';
  return 'adequate';
}

const daysUntil = (date: string | null) =>
  date ? Math.max(0, Math.floor((new Date(date).getTime() - Date.now()) / DAY_MS)) : null;

const SORT_KEYS: Record<string, (i: FeedRow) => string | number> = {
  name: i => i.feed_name.toLowerCase(),
  category: i => i.feed_type,
  currentStock: i => Number(i.quantity),
  expiryDate: i => (i.expiry_date ? new Date(i.expiry_date).getTime() : Number.MAX_SAFE_INTEGER),
  unitCost: i => Number(i.unit_price),
};

function toFeedItem(item: FeedRow) {
  return {
    id: item.id,
    ingredientName: item.feed_name,
    category: item.feed_type,
    currentStock: item.quantity,
    unit: item.unit,
    reorderLevel: item.minimum_stock,
    maxStockLevel: item.quantity,
    unitCost: item.unit_price,
    totalValue: Number(item.quantity) * Number(item.unit_price),
    supplierName: item.supplier,
    batchNumber: item.batch_number,
    manufactureDate: item.purchase_date,
    expiryDate: item.expiry_date,
    storageLocation: item.storage_location,
    // Real values only - null when not recorded (previously hard-coded mock numbers)
    qualityGrade: null,
    moistureContent: item.nutritional_info?.moisture ?? null,
    proteinContent: item.nutritional_info?.protein ?? null,
    energyContent: item.nutritional_info?.energy ?? null,
    averageDailyConsumption: null,
    daysOfSupply: null,
    usageRate: null,
    daysUntilExpiry: daysUntil(item.expiry_date),
    stockStatus: stockStatus(item),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function calculateFeedAnalytics(items: FeedRow[]) {
  const value = (i: FeedRow) => Number(i.quantity) * Number(i.unit_price);
  const totalValue = items.reduce((sum, i) => sum + value(i), 0);
  const expiryLimit = Date.now() + 30 * DAY_MS;

  const byCategory = new Map<
    string,
    { totalValue: number; totalStock: number; itemCount: number }
  >();
  for (const item of items) {
    const cat = byCategory.get(item.feed_type) || { totalValue: 0, totalStock: 0, itemCount: 0 };
    cat.totalValue += value(item);
    cat.totalStock += Number(item.quantity);
    cat.itemCount += 1;
    byCategory.set(item.feed_type, cat);
  }

  return {
    totalValue,
    totalItems: items.length,
    totalStock: items.reduce((sum, i) => sum + Number(i.quantity), 0),
    lowStockItems: items.filter(i => stockStatus(i) === 'critical').length,
    expiringItems: items.filter(
      i => i.expiry_date && new Date(i.expiry_date).getTime() <= expiryLimit
    ).length,
    categoryBreakdown: [...byCategory.entries()]
      .map(([category, c]) => ({
        category,
        ...c,
        percentage: totalValue > 0 ? (c.totalValue / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue),
    // Consumption is not tracked yet, so these stay 0 instead of invented numbers
    efficiencyMetrics: {
      averageDaysOfSupply: 0,
      stockTurnoverRate: 0,
      wastePercentage: 0,
      costPerDay: 0,
    },
  };
}

const includesText = (value: string | null, term: string) =>
  (value || '').toLowerCase().includes(term);

// GET /api/feed-management/enhanced - Advanced feed inventory with analytics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = enhancedFeedQuerySchema.parse(Object.fromEntries(searchParams));
    const { page, limit, sortBy, sortOrder } = query;

    // A farm's active inventory is small; load it once and derive list + analytics
    const t = tenantDb(tenantContext.tenantId);
    const allItems = await fetchAllRows<FeedRow>(
      () => t.select('feed_inventory').eq('is_active', true).order('id'),
      'Load feed inventory'
    );

    const term = query.search?.trim().toLowerCase();
    const categories = [...query.category, ...query.qualityGrade];
    const expiryLimit = Date.now() + (query.expiryDays || 30) * DAY_MS;
    const location = query.storageLocation?.toLowerCase();

    const filtered = allItems.filter(i => {
      const qty = Number(i.quantity);
      const price = Number(i.unit_price);
      if (
        term &&
        ![i.feed_name, i.supplier, i.batch_number, i.storage_location].some(v =>
          includesText(v, term)
        )
      ) {
        return false;
      }
      if (categories.length > 0 && !categories.includes(i.feed_type)) return false;
      if (query.lowStock && stockStatus(i) !== 'critical') return false;
      if (
        query.expiringSoon &&
        !(i.expiry_date && new Date(i.expiry_date).getTime() <= expiryLimit)
      ) {
        return false;
      }
      if (query.minStock !== undefined && qty < query.minStock) return false;
      if (query.maxStock !== undefined && qty > query.maxStock) return false;
      if (query.minCost !== undefined && price < query.minCost) return false;
      if (query.maxCost !== undefined && price > query.maxCost) return false;
      if (location && !includesText(i.storage_location, location)) return false;
      return true;
    });

    const key = SORT_KEYS[sortBy];
    const direction = sortOrder === 'desc' ? -1 : 1;
    filtered.sort((a, b) => (key(a) < key(b) ? -direction : key(a) > key(b) ? direction : 0));

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit);
    const feedItems = filtered.slice((page - 1) * limit, page * limit).map(toFeedItem);
    const distinct = (pick: (i: FeedRow) => string | null) =>
      [...new Set(allItems.map(pick).filter((v): v is string => Boolean(v)))].sort();

    return NextResponse.json({
      success: true,
      data: {
        feedItems,
        analytics: calculateFeedAnalytics(allItems),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          applied: {
            search: query.search,
            category: query.category,
            qualityGrade: query.qualityGrade,
            lowStock: query.lowStock,
            expiringSoon: query.expiringSoon,
            sortBy,
            sortOrder,
            stockRange:
              query.minStock !== undefined || query.maxStock !== undefined
                ? { min: query.minStock, max: query.maxStock }
                : undefined,
            costRange:
              query.minCost !== undefined || query.maxCost !== undefined
                ? { min: query.minCost, max: query.maxCost }
                : undefined,
            expiryDays: query.expiryDays,
            storageLocation: query.storageLocation,
          },
          available: {
            categories: distinct(i => i.feed_type),
            qualityGrades: [],
            storageLocations: distinct(i => i.storage_location),
          },
        },
      },
      message: `Found ${feedItems.length} feed items`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Enhanced feed inventory failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feed inventory' },
      { status: 500 }
    );
  }
}
