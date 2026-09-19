import { getDrizzle } from '@/lib/supabase/server';
import { animals, milkLogs, healthRecords, expenses, sales } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { ServiceContext } from '../types';
import { generatePDFReport } from '@/lib/reports/pdf';

export class ReportService {
  /**
   * Generate raw CSV export string for tabular reports
   */
  static async generateCSV(
    ctx: ServiceContext,
    reportType: 'animals' | 'milk' | 'health' | 'financial',
    startDateStr?: string,
    endDateStr?: string
  ): Promise<string> {
    const db = getDrizzle();

    switch (reportType) {
      case 'animals': {
        const rows = await db
          .select()
          .from(animals)
          .where(eq(animals.tenantId, ctx.tenantId))
          .orderBy(desc(animals.createdAt));

        const headers = ['ID', 'Tag', 'Name', 'Species', 'Breed', 'Gender', 'Status', 'Weight', 'Date of Birth', 'Created At'];
        const csvRows = rows.map(r => [
          r.id,
          `"${r.tag}"`,
          `"${r.name || ''}"`,
          r.species,
          `"${r.breed || ''}"`,
          r.gender,
          r.status,
          r.weight || '',
          r.dateOfBirth ? new Date(r.dateOfBirth).toISOString().split('T')[0] : '',
          new Date(r.createdAt).toISOString(),
        ]);

        return [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
      }

      case 'milk': {
        const conditions = [eq(milkLogs.tenantId, ctx.tenantId)];
        if (startDateStr && endDateStr) {
          conditions.push(and(gte(milkLogs.date, startDateStr), lte(milkLogs.date, endDateStr))!);
        }

        const rows = await db
          .select({
            id: milkLogs.id,
            date: milkLogs.date,
            session: milkLogs.session,
            quantity: milkLogs.quantity,
            quality: milkLogs.quality,
            notes: milkLogs.notes,
            animalTag: animals.tag,
          })
          .from(milkLogs)
          .leftJoin(animals, eq(milkLogs.animalId, animals.id))
          .where(and(...conditions))
          .orderBy(desc(milkLogs.date));

        const headers = ['Log ID', 'Date', 'Session', 'Animal Tag', 'Quantity (L)', 'Quality (1-10)', 'Notes'];
        const csvRows = rows.map(r => [
          r.id,
          r.date,
          r.session,
          `"${r.animalTag || ''}"`,
          r.quantity,
          r.quality || '',
          `"${(r.notes || '').replace(/"/g, '""')}"`,
        ]);

        return [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
      }

      case 'financial': {
        const start = startDateStr ? new Date(startDateStr) : new Date(0);
        const end = endDateStr ? new Date(endDateStr) : new Date();

        const expenseRows = await db
          .select()
          .from(expenses)
          .where(and(eq(expenses.tenantId, ctx.tenantId), gte(expenses.date, start), lte(expenses.date, end)));

        const saleRows = await db
          .select()
          .from(sales)
          .where(and(eq(sales.tenantId, ctx.tenantId), gte(sales.date, start), lte(sales.date, end)));

        const headers = ['Type', 'Date', 'Category/Product', 'Amount/Total (PKR)', 'Description/Notes'];
        const lines: string[] = [headers.join(',')];

        for (const exp of expenseRows) {
          lines.push([
            'Expense',
            new Date(exp.date).toISOString().split('T')[0],
            `"${exp.category}"`,
            exp.amount,
            `"${(exp.description || '').replace(/"/g, '""')}"`,
          ].join(','));
        }

        for (const sale of saleRows) {
          lines.push([
            'Sale (Revenue)',
            new Date(sale.date).toISOString().split('T')[0],
            `"${sale.type}"`,
            sale.total,
            `"${(sale.notes || '').replace(/"/g, '""')}"`,
          ].join(','));
        }

        return lines.join('\n');
      }

      case 'health': {
        const rows = await db
          .select({
            id: healthRecords.id,
            date: healthRecords.date,
            type: healthRecords.type,
            description: healthRecords.description,
            cost: healthRecords.cost,
            veterinarian: healthRecords.veterinarian,
            animalTag: animals.tag,
          })
          .from(healthRecords)
          .leftJoin(animals, eq(healthRecords.animalId, animals.id))
          .where(eq(healthRecords.tenantId, ctx.tenantId))
          .orderBy(desc(healthRecords.date));

        const headers = ['ID', 'Date', 'Animal Tag', 'Type', 'Description', 'Cost', 'Veterinarian'];
        const csvRows = rows.map(r => [
          r.id,
          new Date(r.date).toISOString().split('T')[0],
          `"${r.animalTag || ''}"`,
          r.type,
          `"${(r.description || '').replace(/"/g, '""')}"`,
          r.cost || '',
          `"${(r.veterinarian || '').replace(/"/g, '""')}"`,
        ]);

        return [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
      }
    }
  }

  /**
   * Generate PDF Report via existing pdfmake engine
   */
  static async generatePDF(
    ctx: ServiceContext,
    reportType: 'animals' | 'daily' | 'milk' | 'health' | 'financial' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<Buffer> {
    return generatePDFReport(ctx.tenantId, reportType, startDate, endDate);
  }
}
