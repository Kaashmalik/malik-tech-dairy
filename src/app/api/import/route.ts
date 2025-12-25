import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import {
  parseCSV,
  parseExcel,
  validateImportFile,
  AnimalImportData,
} from '@/lib/import/csv-parser';
import { getSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
const bulkImportSchema = z.object({
  type: z.enum(['animals', 'milk', 'health']).default('animals'),
  dryRun: z.boolean().default(false),
});
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const options = JSON.parse((formData.get('options') as string) || '{}');
      const { type, dryRun } = bulkImportSchema.parse(options);
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }
      // Validate file
      const validation = validateImportFile(file);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
      // Parse file based on type
      let parseResult;
      if (file.name.endsWith('.csv')) {
        parseResult = await parseCSV(file);
      } else {
        parseResult = await parseExcel(file);
      }
      if (!parseResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to parse file',
          details: parseResult.errors,
        });
      }
      // If dry run, return validation results only
      if (dryRun) {
        return NextResponse.json({
          success: true,
          data: {
            validation: parseResult.summary,
            errors: parseResult.errors,
            preview: parseResult.data.slice(0, 5), // Show first 5 records
          },
        });
      }
      // Import data based on type
      let importResult;
      switch (type) {
        case 'animals':
          importResult = await importAnimals(parseResult.data, context.tenantId);
          break;
        case 'milk':
          importResult = await importMilkRecords(parseResult.data, context.tenantId);
          break;
        case 'health':
          importResult = await importHealthRecords(parseResult.data, context.tenantId);
          break;
        default:
          throw new Error(`Unsupported import type: ${type}`);
      }
      return NextResponse.json({
        success: true,
        data: {
          validation: parseResult.summary,
          errors: parseResult.errors,
          import: importResult,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Invalid options', details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
    }
  })(request);
}
// Import animals
async function importAnimals(data: AnimalImportData[], tenantId: string) {
  const supabase = getSupabaseClient();
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };
  // Check tenant limits before importing
  try {
    const { data: subscription } = (await supabase
      .from('subscriptions')
      .select('plan')
      .eq('tenant_id', tenantId)
      .single()) as { data: any; error: any };
    const { count: currentAnimalCount } = (await supabase
      .from('animals')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)) as { count: number; error: any };
    // Define limits based on subscription plan
    const limits: Record<string, number> = {
      free: 5,
      professional: 100,
      farm: 500,
      enterprise: Infinity,
    };
    const maxAnimals = limits[subscription?.plan || 'free'] || 5;
    const availableSlots = maxAnimals - currentAnimalCount;
    if (availableSlots <= 0) {
      results.errors.push(
        `You've reached your limit of ${maxAnimals} animals. Please upgrade your subscription to add more animals.`
      );
      return results;
    }
    if (data.length > availableSlots) {
      results.errors.push(
        `You can only import ${availableSlots} more animals with your current subscription. ${data.length} animals were in the file.`
      );
      // Limit the import to available slots
      data = data.slice(0, availableSlots);
    }
  } catch (error) {
    // Continue with import if limit check fails
  }
  for (const animal of data) {
    try {
      // Check if animal with this tag already exists
      const { data: existing } = (await supabase
        .from('animals')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('tag', animal.tag)
        .single()) as { data: any; error: any };
      if (existing) {
        results.skipped++;
        results.errors.push(`Animal with tag "${animal.tag}" already exists`);
        continue;
      }
      // Insert new animal
      const { error } = (await supabase.from('animals').insert({
        ...animal,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)) as { error: any };
      if (error) {
        results.errors.push(`Failed to import ${animal.tag}: ${error.message}`);
      } else {
        results.imported++;
      }
    } catch (error) {
      results.errors.push(
        `Error importing ${animal.tag}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  return results;
}
// Import milk records
async function importMilkRecords(data: any[], tenantId: string) {
  const supabase = getSupabaseClient();
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };
  // Check tenant limits before importing
  try {
    const { data: subscription } = (await supabase
      .from('subscriptions')
      .select('plan')
      .eq('tenant_id', tenantId)
      .single()) as { data: any; error: any };
    const { count: currentMilkCount } = (await supabase
      .from('milk_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)) as { count: number; error: any };
    // Define limits based on subscription plan
    const limits: Record<string, number> = {
      free: 50,
      professional: 1000,
      farm: 5000,
      enterprise: Infinity,
    };
    const maxMilkRecords = limits[subscription?.plan || 'free'] || 50;
    const availableSlots = maxMilkRecords - currentMilkCount;
    if (availableSlots <= 0) {
      results.errors.push(
        `You've reached your limit of ${maxMilkRecords} milk records. Please upgrade your subscription to add more records.`
      );
      return results;
    }
    if (data.length > availableSlots) {
      results.errors.push(
        `You can only import ${availableSlots} more milk records with your current subscription. ${data.length} records were in the file.`
      );
      // Limit the import to available slots
      data = data.slice(0, availableSlots);
    }
  } catch (error) {
    // Continue with import if limit check fails
  }
  // Validate milk record schema
  const milkSchema = z.object({
    animalTag: z.string(),
    date: z.string(),
    morningYield: z.number(),
    eveningYield: z.number(),
    notes: z.string().optional(),
  });
  for (const record of data) {
    try {
      const validated = milkSchema.parse(record);
      // Find animal by tag
      const { data: animal } = (await supabase
        .from('animals')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('tag', validated.animalTag)
        .single()) as { data: any; error: any };
      if (!animal) {
        results.skipped++;
        results.errors.push(`Animal with tag "${validated.animalTag}" not found`);
        continue;
      }
      // Check if record already exists
      const { data: existing } = (await supabase
        .from('milk_logs')
        .select('id')
        .eq('animal_id', animal.id)
        .eq('date', validated.date)
        .single()) as { data: any; error: any };
      if (existing) {
        results.skipped++;
        results.errors.push(
          `Milk record for ${validated.animalTag} on ${validated.date} already exists`
        );
        continue;
      }
      // Insert milk record
      const { error } = (await supabase.from('milk_logs').insert({
        animal_id: animal.id,
        tenant_id: tenantId,
        date: validated.date,
        morning_yield: validated.morningYield,
        evening_yield: validated.eveningYield,
        notes: validated.notes,
        created_at: new Date().toISOString(),
      } as any)) as { error: any };
      if (error) {
        results.errors.push(
          `Failed to import milk record for ${validated.animalTag}: ${error.message}`
        );
      } else {
        results.imported++;
      }
    } catch (error) {
      results.errors.push(
        `Error importing milk record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  return results;
}
// Import health records
async function importHealthRecords(data: any[], tenantId: string) {
  const supabase = getSupabaseClient();
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };
  // Check tenant limits before importing
  try {
    const { data: subscription } = (await supabase
      .from('subscriptions')
      .select('plan')
      .eq('tenant_id', tenantId)
      .single()) as { data: any; error: any };
    const { count: currentHealthCount } = (await supabase
      .from('health_records')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)) as { count: number; error: any };
    // Define limits based on subscription plan
    const limits: Record<string, number> = {
      free: 25,
      professional: 500,
      farm: 2500,
      enterprise: Infinity,
    };
    const maxHealthRecords = limits[subscription?.plan || 'free'] || 25;
    const availableSlots = maxHealthRecords - currentHealthCount;
    if (availableSlots <= 0) {
      results.errors.push(
        `You've reached your limit of ${maxHealthRecords} health records. Please upgrade your subscription to add more records.`
      );
      return results;
    }
    if (data.length > availableSlots) {
      results.errors.push(
        `You can only import ${availableSlots} more health records with your current subscription. ${data.length} records were in the file.`
      );
      // Limit the import to available slots
      data = data.slice(0, availableSlots);
    }
  } catch (error) {
    // Continue with import if limit check fails
  }
  // Validate health record schema
  const healthSchema = z.object({
    animalTag: z.string(),
    date: z.string(),
    type: z.string(),
    description: z.string(),
    treatment: z.string().optional(),
    veterinarian: z.string().optional(),
    notes: z.string().optional(),
  });
  for (const record of data) {
    try {
      const validated = healthSchema.parse(record);
      // Find animal by tag
      const { data: animal } = (await supabase
        .from('animals')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('tag', validated.animalTag)
        .single()) as { data: any; error: any };
      if (!animal) {
        results.skipped++;
        results.errors.push(`Animal with tag "${validated.animalTag}" not found`);
        continue;
      }
      // Insert health record
      const { error } = (await supabase.from('health_records').insert({
        animal_id: animal.id,
        tenant_id: tenantId,
        date: validated.date,
        type: validated.type,
        description: validated.description,
        treatment: validated.treatment,
        veterinarian: validated.veterinarian,
        notes: validated.notes,
        created_at: new Date().toISOString(),
      } as any)) as { error: any };
      if (error) {
        results.errors.push(
          `Failed to import health record for ${validated.animalTag}: ${error.message}`
        );
      } else {
        results.imported++;
      }
    } catch (error) {
      results.errors.push(
        `Error importing health record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  return results;
}
// Get import templates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'animals';
  try {
    let template: string;
    switch (type) {
      case 'animals':
        template = generateAnimalTemplate();
        break;
      case 'milk':
        template = generateMilkTemplate();
        break;
      case 'health':
        template = generateHealthTemplate();
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid template type' },
          { status: 400 }
        );
    }
    return new Response(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}_import_template.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
function generateAnimalTemplate(): string {
  const headers = [
    'Tag',
    'Name',
    'Species',
    'Breed',
    'Gender',
    'Date of Birth',
    'Age',
    'Weight',
    'Lactation Stage',
    'Status',
    'Notes',
  ];
  const sampleData = [
    [
      'TAG001',
      'Bessie',
      'cow',
      'Holstein',
      'female',
      '2020-01-15',
      '4',
      '500',
      'lactating',
      'active',
      'Healthy cow',
    ],
    [
      '',
      '',
      'cow/buffalo/goat/sheep',
      '',
      'male/female',
      'YYYY-MM-DD',
      '',
      '',
      '',
      'active/sold/deceased',
      '',
    ],
  ];
  return [headers, ...sampleData].map(row => row.join(',')).join('\n');
}
function generateMilkTemplate(): string {
  const headers = ['AnimalTag', 'Date', 'MorningYield', 'EveningYield', 'Notes'];
  const sampleData = [
    ['TAG001', '2024-01-01', '15', '12', 'Normal production'],
    ['', 'YYYY-MM-DD', '0', '0', 'Optional notes'],
  ];
  return [headers, ...sampleData].map(row => row.join(',')).join('\n');
}
function generateHealthTemplate(): string {
  const headers = [
    'AnimalTag',
    'Date',
    'Type',
    'Description',
    'Treatment',
    'Veterinarian',
    'Notes',
  ];
  const sampleData = [
    [
      'TAG001',
      '2024-01-01',
      'Vaccination',
      'Annual vaccination',
      'Standard vaccine',
      'Dr. Smith',
      'No adverse reactions',
    ],
    [
      '',
      'YYYY-MM-DD',
      'Checkup/Treatment/Vaccination',
      'Description',
      'Treatment given',
      'Vet name',
      'Optional notes',
    ],
  ];
  return [headers, ...sampleData].map(row => row.join(',')).join('\n');
}