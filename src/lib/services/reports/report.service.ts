import { fetchAllRows, tenantDb, type TenantDb } from '@/lib/supabase/tenant-db';
import { ServiceContext } from '../types';
import { generatePDFReport } from '@/lib/reports/pdf';

type CsvValue = string | number | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/**
 * RFC 4180 cell escaping plus spreadsheet formula-injection guard
 * (cells starting with = + - @ are executed by Excel/Sheets).
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n']/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
}

const day = (value?: string | Date | null) =>
  value ? new Date(value).toISOString().split('T')[0] : '';

async function animalTagMap(t: TenantDb): Promise<Map<string, string>> {
  const rows = await fetchAllRows<{ id: string; tag: string }>(
    () => t.select('animals', 'id, tag').order('id'),
    'Load animal tags'
  );
  return new Map(rows.map(r => [r.id, r.tag]));
}

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
    const t = tenantDb(ctx.tenantId);

    switch (reportType) {
      case 'animals': {
        const rows = await fetchAllRows<Row>(
          () => t.select('animals').order('created_at', { ascending: false }).order('id'),
          'Export animals'
        );
        return toCsv(
          [
            'ID',
            'Tag',
            'Name',
            'Species',
            'Breed',
            'Gender',
            'Status',
            'Weight',
            'Date of Birth',
            'Created At',
          ],
          rows.map(r => [
            r.id,
            r.tag,
            r.name,
            r.species,
            r.breed,
            r.gender,
            r.status,
            r.weight,
            day(r.date_of_birth),
            r.created_at ? new Date(r.created_at).toISOString() : '',
          ])
        );
      }

      case 'milk': {
        const [rows, tags] = await Promise.all([
          fetchAllRows<Row>(() => {
            let q = t
              .select('milk_logs', 'id, animal_id, date, session, quantity, quality, notes')
              .order('date', { ascending: false })
              .order('id');
            if (startDateStr) q = q.gte('date', startDateStr);
            if (endDateStr) q = q.lte('date', endDateStr);
            return q;
          }, 'Export milk logs'),
          animalTagMap(t),
        ]);
        return toCsv(
          ['Log ID', 'Date', 'Session', 'Animal Tag', 'Quantity (L)', 'Quality (1-10)', 'Notes'],
          rows.map(r => [
            r.id,
            r.date,
            r.session,
            tags.get(r.animal_id) || '',
            r.quantity,
            r.quality,
            r.notes,
          ])
        );
      }

      case 'financial': {
        const start = (startDateStr ? new Date(startDateStr) : new Date(0)).toISOString();
        const end = (endDateStr ? new Date(endDateStr) : new Date()).toISOString();
        const inRange = (table: string) => () =>
          t.select(table).gte('date', start).lte('date', end).order('date').order('id');

        const [expenseRows, saleRows] = await Promise.all([
          fetchAllRows<Row>(inRange('expenses'), 'Export expenses'),
          fetchAllRows<Row>(inRange('sales'), 'Export sales'),
        ]);

        return toCsv(
          ['Type', 'Date', 'Category/Product', 'Amount/Total (PKR)', 'Description/Notes'],
          [
            ...expenseRows.map(e => ['Expense', day(e.date), e.category, e.amount, e.description]),
            ...saleRows.map(s => ['Sale (Revenue)', day(s.date), s.type, s.total, s.notes]),
          ]
        );
      }

      case 'health': {
        const [rows, tags] = await Promise.all([
          fetchAllRows<Row>(
            () =>
              t
                .select(
                  'health_records',
                  'id, animal_id, date, type, description, cost, veterinarian'
                )
                .order('date', { ascending: false })
                .order('id'),
            'Export health records'
          ),
          animalTagMap(t),
        ]);
        return toCsv(
          ['ID', 'Date', 'Animal Tag', 'Type', 'Description', 'Cost', 'Veterinarian'],
          rows.map(r => [
            r.id,
            day(r.date),
            tags.get(r.animal_id) || '',
            r.type,
            r.description,
            r.cost,
            r.veterinarian,
          ])
        );
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
