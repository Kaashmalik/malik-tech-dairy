import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';

// Animal import schema
const animalImportSchema = z.object({
  tag: z.string().min(1, "Tag is required"),
  name: z.string().optional(),
  species: z.enum(['cow', 'buffalo', 'goat', 'sheep']),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().optional().transform(val => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0];
  }),
  age: z.number().optional(),
  weight: z.number().optional(),
  lactationStage: z.string().optional(),
  status: z.enum(['active', 'sold', 'deceased']).default('active'),
  notes: z.string().optional(),
});

export type AnimalImportData = z.infer<typeof animalImportSchema>;

export interface ImportResult {
  success: boolean;
  data: AnimalImportData[];
  errors: string[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export interface ColumnMapping {
  [key: string]: string; // CSV column -> database field
}

// Default column mappings for animal import
const defaultAnimalMapping: ColumnMapping = {
  'Tag': 'tag',
  'tag': 'tag',
  'Animal Tag': 'tag',
  'ID': 'tag',
  'Name': 'name',
  'name': 'name',
  'Animal Name': 'name',
  'Species': 'species',
  'species': 'species',
  'Type': 'species',
  'Breed': 'breed',
  'breed': 'breed',
  'Gender': 'gender',
  'gender': 'gender',
  'Sex': 'gender',
  'Date of Birth': 'dateOfBirth',
  'DOB': 'dateOfBirth',
  'Birth Date': 'dateOfBirth',
  'Age': 'age',
  'Weight': 'weight',
  'Lactation Stage': 'lactationStage',
  'Status': 'status',
  'Notes': 'notes',
  'Remarks': 'notes',
};

// Parse CSV file
export async function parseCSV(file: File, mapping: ColumnMapping = defaultAnimalMapping): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const processed = processImportData(results.data, mapping);
        resolve(processed);
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [`Failed to parse CSV: ${error.message}`],
          summary: { total: 0, valid: 0, invalid: 0 },
        });
      },
    });
  });
}

// Parse Excel file
export async function parseExcel(file: File, mapping: ColumnMapping = defaultAnimalMapping): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      return {
        success: false,
        data: [],
        errors: ['Excel file must have at least a header row and one data row'],
        summary: { total: 0, valid: 0, invalid: 0 },
      };
    }
    
    // Convert array of arrays to array of objects using headers
    const headers = data[0] as string[];
    const rows = data.slice(1) as any[][];
    
    const jsonData = rows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    const processed = processImportData(jsonData, mapping);
    return processed;
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      summary: { total: 0, valid: 0, invalid: 0 },
    };
  }
}

// Process and validate import data
function processImportData(rawData: any[], mapping: ColumnMapping): ImportResult {
  const validData: AnimalImportData[] = [];
  const errors: string[] = [];
  
  rawData.forEach((row, index) => {
    try {
      // Map CSV columns to database fields
      const mappedRow: any = {};
      
      Object.keys(mapping).forEach(csvColumn => {
        const dbField = mapping[csvColumn];
        if (row[csvColumn] !== undefined && row[csvColumn] !== '') {
          mappedRow[dbField] = row[csvColumn];
        }
      });
      
      // Validate and transform the row
      const validated = animalImportSchema.parse(mappedRow);
      validData.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `Row ${index + 1}: ${err.path.join('.')} - ${err.message}`
        );
        errors.push(...errorMessages);
      } else {
        errors.push(`Row ${index + 1}: Invalid data format`);
      }
    }
  });
  
  return {
    success: errors.length === 0,
    data: validData,
    errors,
    summary: {
      total: rawData.length,
      valid: validData.length,
      invalid: errors.length,
    },
  };
}

// Generate sample CSV template
export function generateSampleCSV(): string {
  const headers = ['Tag', 'Name', 'Species', 'Breed', 'Gender', 'Date of Birth', 'Age', 'Weight', 'Lactation Stage', 'Status', 'Notes'];
  const sampleData = [
    ['TAG001', 'Bessie', 'cow', 'Holstein', 'female', '2020-01-15', '4', '500', 'lactating', 'active', 'Healthy cow'],
    ['TAG002', 'Daisy', 'cow', 'Jersey', 'female', '2021-03-20', '3', '450', 'lactating', 'active', 'Good milk producer'],
    ['TAG003', 'Bruno', 'buffalo', 'Murrah', 'male', '2019-06-10', '5', '600', '', 'active', 'Breeding bull'],
  ];
  
  return [headers, ...sampleData].map(row => row.join(',')).join('\n');
}

// Download sample CSV
export function downloadSampleCSV() {
  const csv = generateSampleCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'animal_import_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Auto-detect column mapping from headers
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  headers.forEach(header => {
    const normalized = header.toLowerCase().trim();
    
    // Find best match for known columns
    for (const [csvColumn, dbField] of Object.entries(defaultAnimalMapping)) {
      if (
        normalized === csvColumn.toLowerCase() ||
        normalized.includes(csvColumn.toLowerCase()) ||
        csvColumn.toLowerCase().includes(normalized)
      ) {
        mapping[header] = dbField;
        break;
      }
    }
  });
  
  return mapping;
}

// Validate file before parsing
export function validateImportFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    // Check file extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
      return { valid: false, error: 'File must be CSV or Excel format' };
    }
  }
  
  return { valid: true };
}
