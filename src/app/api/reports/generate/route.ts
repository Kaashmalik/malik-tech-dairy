// API Route: Generate PDF Reports
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantContext } from '@/lib/api/middleware';
import { generatePDFReport } from '@/lib/reports/pdf';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const MAX_RANGE_DAYS = 366;
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const reportSchema = z
  .object({
    type: z.enum(['animals', 'milk', 'health', 'financial', 'daily', 'weekly', 'monthly']),
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine(r => r.startDate <= r.endDate, { message: 'startDate must be before endDate' })
  .refine(
    r =>
      (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86_400_000 <=
      MAX_RANGE_DAYS,
    { message: `Date range cannot exceed ${MAX_RANGE_DAYS} days` }
  );

export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    // Per-call context: the logger is a shared singleton, so never setContext() here
    const logContext = { tenantId: context.tenantId, userId: context.userId };
    try {
      const { type, startDate, endDate } = reportSchema.parse(await req.json());

      const pdfBuffer = await generatePDFReport(
        context.tenantId,
        type,
        new Date(`${startDate}T00:00:00Z`),
        new Date(`${endDate}T00:00:00Z`)
      );

      logger.info('PDF report generated', { ...logContext, type, size: pdfBuffer.length });

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${type}-${startDate}-${endDate}.pdf"`,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0]?.message || 'Invalid report request', details: error.errors },
          { status: 400 }
        );
      }
      logger.error('Error generating PDF report', error, logContext);
      return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
  })(request);
}
