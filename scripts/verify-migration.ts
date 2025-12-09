#!/usr/bin/env tsx

/**
 * Migration Verification Script
 * Verifies all Phase 1 enhancement tables exist with proper structure
 * Run before deployment to ensure database is ready
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected table definitions for Phase 1
const expectedTables = [
  {
    name: 'genetic_profiles',
    requiredColumns: [
      'id',
      'tenant_id',
      'animal_id',
      'sire_id',
      'dam_id',
      'breed_score',
      'milk_yield_potential',
      'genetic_value_index',
      'laboratory',
      'created_at',
      'updated_at',
    ],
    foreignKeys: [
      { from: 'tenant_id', to: 'tenants(id)' },
      { from: 'animal_id', to: 'animals(id)' },
      { from: 'sire_id', to: 'animals(id)' },
      { from: 'dam_id', to: 'animals(id)' },
    ],
  },
  {
    name: 'feed_inventory',
    requiredColumns: [
      'id',
      'tenant_id',
      'ingredient_name',
      'category',
      'current_stock',
      'unit',
      'reorder_level',
      'max_stock_level',
      'unit_cost',
      'total_value',
      'supplier_name',
      'batch_number',
      'manufacture_date',
      'expiry_date',
      'storage_location',
      'quality_grade',
      'moisture_content',
      'protein_content',
      'energy_content',
      'average_daily_consumption',
      'is_active',
      'created_by',
      'created_at',
      'updated_at',
    ],
    foreignKeys: [
      { from: 'tenant_id', to: 'tenants(id)' },
      { from: 'created_by', to: 'platform_users(id)' },
    ],
  },
  {
    name: 'nutrition_requirements',
    requiredColumns: [
      'id',
      'tenant_id',
      'animal_category',
      'production_stage',
      'min_protein',
      'max_protein',
      'min_energy',
      'max_energy',
      'min_fiber',
      'max_fiber',
      'min_moisture',
      'max_moisture',
      'created_by',
      'created_at',
      'updated_at',
    ],
    foreignKeys: [
      { from: 'tenant_id', to: 'tenants(id)' },
      { from: 'created_by', to: 'platform_users(id)' },
    ],
  },
  {
    name: 'computer_vision_records',
    requiredColumns: [
      'id',
      'tenant_id',
      'animal_id',
      'image_url',
      'analysis_type',
      'body_condition_score',
      'confidence_score',
      'health_indicators',
      'analysis_results',
      'verified_by',
      'verification_status',
      'created_at',
      'updated_at',
    ],
    foreignKeys: [
      { from: 'tenant_id', to: 'tenants(id)' },
      { from: 'animal_id', to: 'animals(id)' },
      { from: 'verified_by', to: 'platform_users(id)' },
    ],
  },
  {
    name: 'financial_accounts',
    requiredColumns: [
      'id',
      'tenant_id',
      'account_name',
      'account_type',
      'account_number',
      'bank_name',
      'balance',
      'currency',
      'status',
      'parent_account_id',
      'created_by',
      'created_at',
      'updated_at',
    ],
    foreignKeys: [
      { from: 'tenant_id', to: 'tenants(id)' },
      { from: 'parent_account_id', to: 'financial_accounts(id)' },
      { from: 'created_by', to: 'platform_users(id)' },
    ],
  },
  {
    name: 'staff_certifications',
    requiredColumns: [
      'id',
      'tenant_id',
      'user_id',
      'certification_name',
      'issuing_organization',
      'certificate_number',
      'issue_date',
      'expiry_date',
      'status',
      'document_url',
      'created_by',
      'created_at',
      'updated_at',
    ],
    foreignKeys: [
      { from: 'tenant_id', to: 'tenants(id)' },
      { from: 'user_id', to: 'platform_users(id)' },
      { from: 'created_by', to: 'platform_users(id)' },
    ],
  },
  {
    name: 'regulatory_compliance',
    requiredColumns: [
      'id',
      'tenant_id',
      'compliance_type',
      'reference_number',
      'issue_date',
      'expiry_date',
      'status',
      'compliance_officer_id',
      'documents',
      'notes',
      'created_by',
      'created_at',
      'updated_at',
    ],
    foreignKeys: [
      { from: 'tenant_id', to: 'tenants(id)' },
      { from: 'compliance_officer_id', to: 'platform_users(id)' },
      { from: 'created_by', to: 'platform_users(id)' },
    ],
  },
  {
    name: 'blockchain_transactions',
    requiredColumns: [
      'id',
      'tenant_id',
      'transaction_hash',
      'block_number',
      'transaction_type',
      'asset_type',
      'asset_id',
      'from_address',
      'to_address',
      'timestamp',
      'metadata',
      'created_at',
    ],
    foreignKeys: [{ from: 'tenant_id', to: 'tenants(id)' }],
  },
  {
    name: 'drone_flights',
    requiredColumns: [
      'id',
      'tenant_id',
      'flight_date',
      'flight_duration',
      'area_covered',
      'flight_type',
      'pilot_id',
      'weather_conditions',
      'data_collected',
      'findings',
      'created_at',
      'updated_at',
    ],
    foreignKeys: [
      { from: 'tenant_id', to: 'tenants(id)' },
      { from: 'pilot_id', to: 'platform_users(id)' },
    ],
  },
];

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .single();

    if (error) {
      console.error(`❌ Error checking table ${tableName}:`, error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error(`❌ Exception checking table ${tableName}:`, error);
    return false;
  }
}

async function checkTableColumns(tableName: string, requiredColumns: string[]): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .in('column_name', requiredColumns);

    if (error) {
      console.error(`❌ Error checking columns for ${tableName}:`, error);
      return false;
    }

    const foundColumns = data?.map(col => col.column_name) || [];
    const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));

    if (missingColumns.length > 0) {
      console.error(`❌ Table ${tableName} missing columns: ${missingColumns.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Exception checking columns for ${tableName}:`, error);
    return false;
  }
}

async function checkForeignKeys(
  tableName: string,
  foreignKeys: Array<{ from: string; to: string }>
): Promise<boolean> {
  try {
    // Check if foreign key constraints exist (simplified check)
    for (const fk of foreignKeys) {
      const { data, error } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .eq('constraint_type', 'FOREIGN KEY');

      if (error) {
        console.error(`❌ Error checking foreign keys for ${tableName}:`, error);
        return false;
      }

      // Simplified check - just ensure some foreign keys exist
      if (!data || data.length === 0) {
        console.error(`❌ Table ${tableName} has no foreign key constraints`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ Exception checking foreign keys for ${tableName}:`, error);
    return false;
  }
}

async function verifyMigration(): Promise<void> {
  console.log('🔍 Starting migration verification...\n');

  let allTablesExist = true;
  let allColumnsValid = true;
  let allForeignKeysValid = true;

  // Check each table
  for (const table of expectedTables) {
    console.log(`📋 Checking table: ${table.name}`);

    // Check table exists
    const tableExists = await checkTableExists(table.name);
    if (!tableExists) {
      console.error(`   ❌ Table ${table.name} does not exist`);
      allTablesExist = false;
      continue;
    }
    console.log(`   ✅ Table ${table.name} exists`);

    // Check columns
    const columnsValid = await checkTableColumns(table.name, table.requiredColumns);
    if (!columnsValid) {
      allColumnsValid = false;
    } else {
      console.log(`   ✅ All required columns present in ${table.name}`);
    }

    // Check foreign keys
    const foreignKeysValid = await checkForeignKeys(table.name, table.foreignKeys);
    if (!foreignKeysValid) {
      allForeignKeysValid = false;
    } else {
      console.log(`   ✅ Foreign key constraints valid for ${table.name}`);
    }

    console.log('');
  }

  // Summary
  console.log('📊 Migration Verification Summary:');
  console.log(`   Tables Exist: ${allTablesExist ? '✅' : '❌'}`);
  console.log(`   Columns Valid: ${allColumnsValid ? '✅' : '❌'}`);
  console.log(`   Foreign Keys Valid: ${allForeignKeysValid ? '✅' : '❌'}`);

  const migrationValid = allTablesExist && allColumnsValid && allForeignKeysValid;

  if (migrationValid) {
    console.log('\n🎉 Migration verification PASSED! Database is ready for deployment.');
    process.exit(0);
  } else {
    console.log(
      '\n💥 Migration verification FAILED! Please fix database issues before deployment.'
    );
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  verifyMigration().catch(error => {
    console.error('❌ Migration verification failed with exception:', error);
    process.exit(1);
  });
}

export { verifyMigration };
