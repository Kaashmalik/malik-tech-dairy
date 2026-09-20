import { getDrizzle } from '@/lib/supabase/server';
import { expenses, sales } from '@/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { ServiceContext, PaginatedResult } from '../types';
import { logAuditEvent } from '@/lib/audit';
import { SubscriptionService } from '@/lib/subscriptions/management';

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SaleFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateExpenseDTO {
  category: string;
  amount: number;
  date: string | Date;
  description?: string;
  vendorName?: string;
  receiptUrl?: string;
}

export interface CreateSaleDTO {
  type: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total?: number;
  date: string | Date;
  buyerName?: string;
  buyerPhone?: string;
  notes?: string;
}

export class FinanceService {
  /**
   * List expenses with category and date filtering
   */
  static async listExpenses(
    ctx: ServiceContext,
    filters: ExpenseFilters = {}
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const db = getDrizzle();
    const conditions = [eq(expenses.tenantId, ctx.tenantId)];

    if (filters.category) {
      conditions.push(eq(expenses.category, filters.category));
    }
    if (filters.startDate && filters.endDate) {
      conditions.push(
        and(
          gte(expenses.date, new Date(filters.startDate)),
          lte(expenses.date, new Date(filters.endDate))
        )!
      );
    }

    const whereClause = and(...conditions);

    const [totalCount] = await db.select({ count: count() }).from(expenses).where(whereClause);

    const total = Number(totalCount?.count || 0);

    const rows = await db
      .select()
      .from(expenses)
      .where(whereClause)
      .orderBy(desc(expenses.date))
      .limit(limit)
      .offset(offset);

    const items = rows.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      category: r.category,
      amount: r.amount,
      currency: r.currency || 'PKR',
      date: r.date,
      description: r.description,
      vendorName: r.vendorName,
      receiptUrl: r.receiptUrl,
      createdAt: r.createdAt,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Record new expense
   */
  static async recordExpense(ctx: ServiceContext, data: CreateExpenseDTO) {
    const subscriptionService = new SubscriptionService(ctx.tenantId);
    await subscriptionService.requireFeature('expense_tracking');

    const db = getDrizzle();
    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const descriptionText = data.description?.trim() || `${data.category} expense`;

    const [created] = await db
      .insert(expenses)
      .values({
        id: expenseId,
        tenantId: ctx.tenantId,
        category: data.category,
        amount: Math.round(data.amount),
        currency: 'PKR',
        date: new Date(data.date),
        description: descriptionText,
        vendorName: data.vendorName?.trim() || null,
        receiptUrl: data.receiptUrl || null,
        recordedBy: ctx.userId,
        createdAt: new Date(),
      })
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'create',
        resource: 'expenses',
        resourceId: created.id,
        details: { category: data.category, amount: data.amount },
      });
    } catch {
      // Ignore audit failure
    }

    return created;
  }

  /**
   * List sales
   */
  static async listSales(
    ctx: ServiceContext,
    filters: SaleFilters = {}
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const db = getDrizzle();
    const conditions = [eq(sales.tenantId, ctx.tenantId)];

    if (filters.type) {
      conditions.push(eq(sales.type, filters.type));
    }
    if (filters.startDate && filters.endDate) {
      conditions.push(
        and(
          gte(sales.date, new Date(filters.startDate)),
          lte(sales.date, new Date(filters.endDate))
        )!
      );
    }

    const whereClause = and(...conditions);

    const [totalCount] = await db.select({ count: count() }).from(sales).where(whereClause);

    const total = Number(totalCount?.count || 0);

    const rows = await db
      .select()
      .from(sales)
      .where(whereClause)
      .orderBy(desc(sales.date))
      .limit(limit)
      .offset(offset);

    const items = rows.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      type: r.type,
      quantity: r.quantity,
      unit: r.unit,
      pricePerUnit: r.pricePerUnit,
      total: r.total,
      currency: r.currency || 'PKR',
      date: r.date,
      buyerName: r.buyerName,
      buyerPhone: r.buyerPhone,
      notes: r.notes,
      createdAt: r.createdAt,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Record new sale
   */
  static async recordSale(ctx: ServiceContext, data: CreateSaleDTO) {
    const subscriptionService = new SubscriptionService(ctx.tenantId);
    await subscriptionService.requireFeature('expense_tracking');

    const db = getDrizzle();
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const calculatedTotal =
      data.total !== undefined
        ? Math.round(data.total)
        : Math.round(data.quantity * data.pricePerUnit);

    const [created] = await db
      .insert(sales)
      .values({
        id: saleId,
        tenantId: ctx.tenantId,
        type: data.type,
        quantity: Math.round(data.quantity * 100), // precision
        unit: data.unit.trim(),
        pricePerUnit: Math.round(data.pricePerUnit),
        total: calculatedTotal,
        currency: 'PKR',
        date: new Date(data.date),
        buyerName: data.buyerName?.trim() || null,
        buyerPhone: data.buyerPhone?.trim() || null,
        notes: data.notes?.trim() || null,
        recordedBy: ctx.userId,
        createdAt: new Date(),
      })
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'create',
        resource: 'sales',
        resourceId: created.id,
        details: { type: data.type, total: calculatedTotal },
      });
    } catch {
      // Ignore audit failure
    }

    return created;
  }

  /**
   * Server-side financial summary with accurate Revenue, Operating Expenses, and Net Result
   */
  static async getFinancialSummary(
    ctx: ServiceContext,
    startDateStr?: string,
    endDateStr?: string
  ) {
    const now = new Date();
    const start = startDateStr
      ? new Date(startDateStr)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDateStr
      ? new Date(endDateStr)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const db = getDrizzle();

    // Total sales in period
    const [salesSum] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
        countSales: count(),
      })
      .from(sales)
      .where(and(eq(sales.tenantId, ctx.tenantId), gte(sales.date, start), lte(sales.date, end)));

    // Total expenses in period
    const [expensesSum] = await db
      .select({
        totalExpenses: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
        countExpenses: count(),
      })
      .from(expenses)
      .where(
        and(eq(expenses.tenantId, ctx.tenantId), gte(expenses.date, start), lte(expenses.date, end))
      );

    const totalRevenue = Number(salesSum?.totalRevenue || 0);
    const totalExpenses = Number(expensesSum?.totalExpenses || 0);
    const netResult = totalRevenue - totalExpenses;

    // Expenses breakdown by category
    const categoryBreakdown = await db
      .select({
        category: expenses.category,
        amount: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        and(eq(expenses.tenantId, ctx.tenantId), gte(expenses.date, start), lte(expenses.date, end))
      )
      .groupBy(expenses.category);

    return {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      revenue: totalRevenue,
      operatingExpenses: totalExpenses,
      netResult, // Clearly labeled: Net Result (Revenue minus Operating Expenses)
      categoryBreakdown: categoryBreakdown.map(c => ({
        category: c.category,
        amount: Number(c.amount),
      })),
    };
  }
}
