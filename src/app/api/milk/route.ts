import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { z } from 'zod';
import { MilkService } from '@/lib/services/milk/milk.service';

export const dynamic = 'force-dynamic';

const milkQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 50)),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  animalId: z.string().optional(),
  session: z.enum(['morning', 'evening']).optional(),
  summary: z.string().optional(),
  trends: z.string().optional(),
  days: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 30)),
});

const createMilkLogSchema = z.object({
  animalId: z.string().min(1, 'Animal is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  session: z.enum(['morning', 'evening']),
  quantity: z
    .number()
    .min(0.1, 'Quantity must be greater than 0')
    .max(100, 'Quantity exceeds realistic single milking limit'),
  quality: z.number().min(1).max(10).optional(),
  fat: z.number().min(0).max(20).optional(),
  notes: z.string().max(500).optional(),
});

const bulkMilkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  session: z.enum(['morning', 'evening']),
  entries: z
    .array(
      z.object({
        animalId: z.string().min(1),
        quantity: z.number().min(0.1),
        quality: z.number().min(1).max(10).optional(),
      })
    )
    .min(1, 'At least one milk entry required'),
});

// GET: List milk logs, daily summary, or trends
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = milkQuerySchema.parse(Object.fromEntries(searchParams));

      // 1. Daily Summary request
      if (query.summary === 'true') {
        const summary = await MilkService.getDailySummary(context, query.date);
        return NextResponse.json({ success: true, summary, data: summary });
      }

      // 2. Production trends request
      if (query.trends === 'true') {
        const trends = await MilkService.getProductionTrends(context, query.days || 30);
        return NextResponse.json({ success: true, trends, data: trends });
      }

      // 3. Regular paginated list
      const result = await MilkService.listLogs(context, {
        date: query.date,
        startDate: query.startDate,
        endDate: query.endDate,
        animalId: query.animalId,
        session: query.session,
        page: query.page,
        limit: query.limit,
      });

      return NextResponse.json({
        success: true,
        logs: result.items, // backwards compatibility
        data: {
          logs: result.items,
          pagination: result.pagination,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error fetching milk logs:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// POST: Record milk log (single or bulk)
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();

      // Check if bulk insert
      if (body.entries && Array.isArray(body.entries)) {
        const validatedBulk = bulkMilkSchema.parse(body);
        const result = await MilkService.bulkLogMilk(context, validatedBulk);
        return NextResponse.json({ ...result }, { status: 201 });
      }

      // Single entry
      const validated = createMilkLogSchema.parse(body);
      const logged = await MilkService.logMilk(context, validated);

      return NextResponse.json(
        {
          success: true,
          data: { log: logged },
          message: 'Milk entry recorded successfully',
        },
        { status: 201 }
      );
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      const message = error.message || '';
      if (message.startsWith('NOT_FOUND')) {
        return NextResponse.json({ success: false, error: message }, { status: 404 });
      }
      if (message.startsWith('DUPLICATE_ENTRY')) {
        return NextResponse.json({ success: false, error: message }, { status: 409 });
      }
      if (message.startsWith('INVALID_STATE')) {
        return NextResponse.json({ success: false, error: message }, { status: 422 });
      }

      console.error('Error recording milk log:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
