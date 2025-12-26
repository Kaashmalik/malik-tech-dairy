// PDF Report Generation using pdfmake
import { adminDb } from '@/lib/firebase/admin';
import { getTenantSubcollection, getTenantConfig } from '@/lib/firebase/tenant';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Initialize pdfmake fonts (using default fonts for now)
// Note: In production, you should use proper font files
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

export async function generatePDFReport(
  tenantId: string,
  type: 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  endDate: Date
): Promise<Buffer> {
  const config = await getTenantConfig(tenantId);
  const farmName = config?.farmName || 'Farm';

  // Fetch data based on report type
  const milkLogsRef = getTenantSubcollection(tenantId, 'milkLogs', 'logs');
  const expensesRef = getTenantSubcollection(tenantId, 'expenses', 'records');
  const salesRef = getTenantSubcollection(tenantId, 'sales', 'records');

  const [milkLogsSnapshot, expensesSnapshot, salesSnapshot] = await Promise.all([
    milkLogsRef
      .where('date', '>=', startDate.toISOString().split('T')[0])
      .where('date', '<=', endDate.toISOString().split('T')[0])
      .get(),
    expensesRef.where('date', '>=', startDate).where('date', '<=', endDate).get(),
    salesRef.where('date', '>=', startDate).where('date', '<=', endDate).get(),
  ]);

  const milkLogs = milkLogsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date,
  })) as any[];

  const expenses = expensesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
    amount: doc.data().amount,
  })) as any[];

  const sales = salesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
    total: doc.data().total,
  })) as any[];

  const totalMilk = milkLogs.reduce((sum, log: any) => sum + (log.yield || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const profit = totalSales - totalExpenses;

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: farmName, style: 'header', alignment: 'center' },
      {
        text: `${type.toUpperCase()} Report`,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 20],
      },
      {
        text: `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        style: 'period',
        alignment: 'center',
        margin: [0, 0, 0, 30],
      },
      {
        columns: [
          {
            text: `Total Milk: ${totalMilk.toFixed(2)} L`,
            style: 'summary',
          },
          {
            text: `Total Expenses: PKR ${totalExpenses.toLocaleString()}`,
            style: 'summary',
          },
          {
            text: `Total Sales: PKR ${totalSales.toLocaleString()}`,
            style: 'summary',
          },
          {
            text: `Net Profit: PKR ${profit.toLocaleString()}`,
            style: 'summary',
            color: profit >= 0 ? 'green' : 'red',
          },
        ],
        margin: [0, 0, 0, 30],
      },
      {
        text: 'Milk Production',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*'],
          body: [
            ['Date', 'Session', 'Quantity (L)', 'Animal ID'],
            ...milkLogs
              .slice(0, 50)
              .map(log => [
                log.date || '',
                log.session || '',
                (log.yield || 0).toFixed(2),
                log.animalId || '',
              ]),
          ],
        },
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Expenses',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            ['Date', 'Category', 'Amount (PKR)'],
            ...expenses
              .slice(0, 50)
              .map(exp => [
                exp.date?.toLocaleDateString() || '',
                exp.category || '',
                (exp.amount || 0).toLocaleString(),
              ]),
          ],
        },
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Sales',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*'],
          body: [
            ['Date', 'Type', 'Quantity', 'Total (PKR)'],
            ...sales
              .slice(0, 50)
              .map(sale => [
                sale.date?.toLocaleDateString() || '',
                sale.type || '',
                `${sale.quantity || 0} ${sale.unit || ''}`,
                (sale.total || 0).toLocaleString(),
              ]),
          ],
        },
      },
      {
        text: `Generated on ${new Date().toLocaleString()}`,
        style: 'footer',
        alignment: 'center',
        margin: [0, 30, 0, 0],
      },
    ],
    styles: {
      header: {
        fontSize: 24,
        bold: true,
      },
      subheader: {
        fontSize: 18,
        bold: true,
      },
      period: {
        fontSize: 12,
        italics: true,
      },
      summary: {
        fontSize: 11,
        bold: true,
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
      },
      footer: {
        fontSize: 10,
        italics: true,
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
