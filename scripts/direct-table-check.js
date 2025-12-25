/**
 * Direct Supabase Table Checker
 * Uses the Supabase client to check all tables
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'd:/MalikTech/MalikTech-dairy/malik-tech-dairy/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// All required tables for MTK Dairy
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

async function checkAllTables() {
  

  const results = {
    exist: [],
    missing: [],
    errors: []
  };

  // Check each table
  for (const tableName of requiredTables) {
    try {
      // Try to select 1 row from the table
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116') {
          // Table does not exist
          results.missing.push(tableName);
        } else {
          // Other error (might be permissions)
          results.errors.push({ table: tableName, error: error.message });
        }
      } else {
        // Table exists
        results.exist.push(tableName);
      }
    } catch (err) {
      results.errors.push({ table: tableName, error: err.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary

  if (results.missing.length > 0) {
    results.missing.forEach(table => console.log(`   - ${table}`));
  }

  if (results.errors.length > 0) {
    results.errors.forEach(({ table, error }) => {
    });
  }

  if (results.exist.length === requiredTables.length) {
  }

  // Check if we can get table counts
  console.log('\n📊 Table Row Counts (for existing tables):');
  
  for (const tableName of results.exist.slice(0, 5)) { // Check first 5 tables
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
      }
    } catch (err) {
    }
  }
  
  if (results.exist.length > 5) {
  }
}

// Run the check
checkAllTables().catch(console.error);