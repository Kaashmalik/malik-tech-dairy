/**
 * Script to check and create missing Supabase tables
 * Run this after configuring MCP server
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// List of required tables
const requiredTables = [
  'tenants',
  'platform_users',
  'tenant_members',
  'subscriptions',
  'animals',
  'milk_logs',
  'health_records',
  'breeding_records',
  'expenses',
  'sales',
  'payments',
  'api_keys',
  'audit_logs',
  'farm_applications',
  'custom_fields_config',
  'email_subscriptions',
  'predictions'
];

async function checkTables() {

  try {
    // Get existing tables using a different approach
    const { data: tables, error } = await supabase
      .rpc('get_table_info', { schema_name: 'public' });

    // If RPC doesn't exist, try checking each table individually
    if (error) {
      
      const existingTables = [];
      
      for (const table of requiredTables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('count')
            .limit(1);
          
          if (!tableError || tableError.code !== 'PGRST116') {
            existingTables.push(table);
          }
        } catch (e) {
          // Table doesn't exist
        }
      }
      
      
      const missingTables = [];
      
      requiredTables.forEach(table => {
        const exists = existingTables.includes(table);
        const status = exists ? '✅' : '❌';
        
        if (!exists) {
          missingTables.push(table);
        }
      });

      if (missingTables.length === 0) {
      } else {
        console.log(`\n⚠️  Missing ${missingTables.length} tables: ${missingTables.join(', ')}`);
      }
      
      return;
    }
    
    const existingTables = tables?.map(t => t.table_name) || [];
    
    
    const missingTables = [];
    
    requiredTables.forEach(table => {
      const exists = existingTables.includes(table);
      const status = exists ? '✅' : '❌';
      
      if (!exists) {
        missingTables.push(table);
      }
    });

    if (missingTables.length === 0) {
    } else {
      console.log(`\n⚠️  Missing ${missingTables.length} tables: ${missingTables.join(', ')}`);
    }

    // Check RLS policies
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .eq('schemaname', 'public');

    if (!policyError && policies) {
      const tablesWithPolicies = [...new Set(policies.map(p => p.tablename))];
      requiredTables.forEach(table => {
        const hasPolicy = tablesWithPolicies.includes(table);
        const status = hasPolicy ? '✅' : '⚠️ ';
      });
    }

  } catch (error) {
  }
}

async function createMissingTables() {

  try {
    // Read the complete migration file
    const migrationPath = join(__dirname, '../scripts/supabase-complete-migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
    } else {
    }
  } catch (error) {
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'create') {
  createMissingTables();
} else {
  checkTables();
}