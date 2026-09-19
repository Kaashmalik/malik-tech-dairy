import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { ReportService } from '@/lib/services/reports/report.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const exportQuerySchema = z.object({
  type: z.enum(['animals', 'milk', 'health', 'financial']),
  format: z.enum(['csv', 'pdf']).default('csv'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = exportQuerySchema.parse(Object.fromEntries(searchParams));

      if (query.format === 'csv') {
        const csvContent = await ReportService.generateCSV(
          context,
          query.type,
          query.startDate,
          query.endDate
        );

        const filename = `${query.type}-export-${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      // If PDF format requested
      const start = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 86400000);
      const end = query.endDate ? new Date(query.endDate) : new Date();

      const pdfBuffer = await ReportService.generatePDF(context, query.type, start, end);
      const filename = `${query.type}-report-${new Date().toISOString().split('T')[0]}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Invalid export parameters', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Report export failed:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Report export failed' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
