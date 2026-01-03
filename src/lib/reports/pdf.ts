// PDF Report Generation using pdfmake (Supabase-based)
import { getSupabaseClient } from '@/lib/supabase/server';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Initialize pdfmake fonts (using default fonts)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

// Lazy-load pdfmake to avoid build-time issues
let printer: any = null;
function getPrinter() {
  if (!printer) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PdfPrinter = require('pdfmake');
    printer = new PdfPrinter(fonts);
  }
  return printer;
}

/**
 * Get tenant configuration from Supabase
 */
async function getTenantConfig(tenantId: string) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tenants')
      .select('name, settings')
      .eq('clerk_org_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching tenant config:', error);
      return null;
    }

    return {
      farmName: data?.name || 'Farm',
      settings: data?.settings || {},
    };
  } catch (error) {
    console.error('Error in getTenantConfig:', error);
    return null;
  }
}

/**
 * Fetch milk logs from Supabase
 */
async function getMilkLogs(tenantId: string, startDate: Date, endDate: Date) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('milk_logs')
      .select('id, date, session, quantity, animal_id, notes')
      .eq('tenant_id', tenantId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching milk logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMilkLogs:', error);
    return [];
  }
}

/**
 * Fetch expenses from Supabase
 */
async function getExpenses(tenantId: string, startDate: Date, endDate: Date) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('id, date, category, amount, description')
      .eq('tenant_id', tenantId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getExpenses:', error);
    return [];
  }
}

/**
 * Fetch sales from Supabase
 */
async function getSales(tenantId: string, startDate: Date, endDate: Date) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sales')
      .select('id, date, type, quantity, unit, total, customer_name')
      .eq('tenant_id', tenantId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching sales:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSales:', error);
    return [];
  }
}

/**
 * Fetch animals for animal report
 */
async function getAnimals(tenantId: string) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('animals')
      .select('id, tag_number, name, species, breed, status, gender, birth_date')
      .eq('tenant_id', tenantId)
      .order('tag_number', { ascending: true })
      .limit(200);

    if (error) {
      console.error('Error fetching animals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAnimals:', error);
    return [];
  }
}

/**
 * Fetch health records
 */
async function getHealthRecords(tenantId: string, startDate: Date, endDate: Date) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('health_records')
      .select('id, date, type, description, animal_id, treatment, vet_name')
      .eq('tenant_id', tenantId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching health records:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getHealthRecords:', error);
    return [];
  }
}

/**
 * Generate PDF report based on type
 */
export async function generatePDFReport(
  tenantId: string,
  type: 'daily' | 'weekly' | 'monthly' | 'animals' | 'milk' | 'health' | 'financial',
  startDate: Date,
  endDate: Date
): Promise<Buffer> {
  const config = await getTenantConfig(tenantId);
  const farmName = config?.farmName || 'Farm';

  // Fetch data based on report type
  let docDefinition: TDocumentDefinitions;

  switch (type) {
    case 'animals':
      docDefinition = await generateAnimalReport(tenantId, farmName, startDate, endDate);
      break;
    case 'milk':
      docDefinition = await generateMilkReport(tenantId, farmName, startDate, endDate);
      break;
    case 'health':
      docDefinition = await generateHealthReport(tenantId, farmName, startDate, endDate);
      break;
    case 'financial':
    case 'daily':
    case 'weekly':
    case 'monthly':
    default:
      docDefinition = await generateFinancialReport(tenantId, farmName, type, startDate, endDate);
      break;
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = getPrinter().createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Animal Report
 */
async function generateAnimalReport(
  tenantId: string,
  farmName: string,
  startDate: Date,
  endDate: Date
): Promise<TDocumentDefinitions> {
  const animals = await getAnimals(tenantId);

  const speciesCount: Record<string, number> = {};
  const statusCount: Record<string, number> = {};

  animals.forEach((animal: any) => {
    speciesCount[animal.species || 'Unknown'] = (speciesCount[animal.species || 'Unknown'] || 0) + 1;
    statusCount[animal.status || 'Unknown'] = (statusCount[animal.status || 'Unknown'] || 0) + 1;
  });

  return {
    content: [
      { text: farmName, style: 'header', alignment: 'center' },
      {
        text: 'Animal Inventory Report',
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 20],
      },
      {
        text: `Generated: ${new Date().toLocaleDateString()}`,
        style: 'period',
        alignment: 'center',
        margin: [0, 0, 0, 30],
      },
      {
        text: `Total Animals: ${animals.length}`,
        style: 'summary',
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Species Distribution',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            ['Species', 'Count'],
            ...Object.entries(speciesCount).map(([species, count]) => [species, count.toString()]),
          ],
        },
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Status Overview',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            ['Status', 'Count'],
            ...Object.entries(statusCount).map(([status, count]) => [status, count.toString()]),
          ],
        },
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Animal List',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', '*', '*', '*'],
          body: [
            ['Tag', 'Name', 'Species', 'Breed', 'Status'],
            ...animals.slice(0, 50).map((animal: any) => [
              animal.tag_number || '',
              animal.name || '',
              animal.species || '',
              animal.breed || '',
              animal.status || '',
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
    styles: getStyles(),
    defaultStyle: { font: 'Roboto' },
  };
}

/**
 * Generate Milk Production Report
 */
async function generateMilkReport(
  tenantId: string,
  farmName: string,
  startDate: Date,
  endDate: Date
): Promise<TDocumentDefinitions> {
  const milkLogs = await getMilkLogs(tenantId, startDate, endDate);

  const totalMilk = milkLogs.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
  const avgPerDay = milkLogs.length > 0 ? totalMilk / Math.max(1, new Set(milkLogs.map((l: any) => l.date)).size) : 0;

  const sessionTotals: Record<string, number> = {};
  milkLogs.forEach((log: any) => {
    const session = log.session || 'Unknown';
    sessionTotals[session] = (sessionTotals[session] || 0) + (log.quantity || 0);
  });

  return {
    content: [
      { text: farmName, style: 'header', alignment: 'center' },
      {
        text: 'Milk Production Report',
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
          { text: `Total Production: ${totalMilk.toFixed(2)} L`, style: 'summary' },
          { text: `Daily Average: ${avgPerDay.toFixed(2)} L`, style: 'summary' },
          { text: `Total Records: ${milkLogs.length}`, style: 'summary' },
        ],
        margin: [0, 0, 0, 30],
      },
      {
        text: 'Production by Session',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            ['Session', 'Total (L)'],
            ...Object.entries(sessionTotals).map(([session, total]) => [
              session,
              (total as number).toFixed(2),
            ]),
          ],
        },
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Daily Records',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*'],
          body: [
            ['Date', 'Session', 'Quantity (L)', 'Animal ID'],
            ...milkLogs.slice(0, 50).map((log: any) => [
              log.date || '',
              log.session || '',
              (log.quantity || 0).toFixed(2),
              log.animal_id || '',
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
    styles: getStyles(),
    defaultStyle: { font: 'Roboto' },
  };
}

/**
 * Generate Health Report
 */
async function generateHealthReport(
  tenantId: string,
  farmName: string,
  startDate: Date,
  endDate: Date
): Promise<TDocumentDefinitions> {
  const healthRecords = await getHealthRecords(tenantId, startDate, endDate);

  const typeCount: Record<string, number> = {};
  healthRecords.forEach((record: any) => {
    const type = record.type || 'Unknown';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  return {
    content: [
      { text: farmName, style: 'header', alignment: 'center' },
      {
        text: 'Health Report',
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
        text: `Total Records: ${healthRecords.length}`,
        style: 'summary',
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Records by Type',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            ['Type', 'Count'],
            ...Object.entries(typeCount).map(([type, count]) => [type, count.toString()]),
          ],
        },
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Health Records',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', '*', '*'],
          body: [
            ['Date', 'Type', 'Animal ID', 'Treatment'],
            ...healthRecords.slice(0, 50).map((record: any) => [
              record.date || '',
              record.type || '',
              record.animal_id || '',
              record.treatment || '',
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
    styles: getStyles(),
    defaultStyle: { font: 'Roboto' },
  };
}

/**
 * Generate Financial Report
 */
async function generateFinancialReport(
  tenantId: string,
  farmName: string,
  type: string,
  startDate: Date,
  endDate: Date
): Promise<TDocumentDefinitions> {
  const [milkLogs, expenses, sales] = await Promise.all([
    getMilkLogs(tenantId, startDate, endDate),
    getExpenses(tenantId, startDate, endDate),
    getSales(tenantId, startDate, endDate),
  ]);

  const totalMilk = milkLogs.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const totalSales = sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
  const profit = totalSales - totalExpenses;

  return {
    content: [
      { text: farmName, style: 'header', alignment: 'center' },
      {
        text: `${type.toUpperCase()} Financial Report`,
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
          { text: `Total Milk: ${totalMilk.toFixed(2)} L`, style: 'summary' },
          { text: `Total Expenses: PKR ${totalExpenses.toLocaleString()}`, style: 'summary' },
          { text: `Total Sales: PKR ${totalSales.toLocaleString()}`, style: 'summary' },
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
            ...milkLogs.slice(0, 50).map((log: any) => [
              log.date || '',
              log.session || '',
              (log.quantity || 0).toFixed(2),
              log.animal_id || '',
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
            ...expenses.slice(0, 50).map((exp: any) => [
              exp.date || '',
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
            ...sales.slice(0, 50).map((sale: any) => [
              sale.date || '',
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
    styles: getStyles(),
    defaultStyle: { font: 'Roboto' },
  };
}

/**
 * Get PDF styles
 */
function getStyles() {
  return {
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
  };
}
