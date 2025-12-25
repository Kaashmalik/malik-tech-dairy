const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  try {
    console.log('Checking existing tables in database...\n');
    
    // List all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }
    
    console.log('Available tables:');
    tables?.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check specific tables that should exist
    const criticalTables = [
      'animals',
      'milk_logs',
      'health_records',
      'breeding_records',
      'medicine_inventory',
      'assets',
      'expenses',
      'sales',
      'feed_logs'
    ];
    
    console.log('\n\nChecking critical tables:');
    
    for (const tableName of criticalTables) {
      console.log(`\n=== ${tableName} ===`);
      
      try {
        // Try to get a sample record to see the structure
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`  ❌ Table does not exist`);
          } else {
            console.log(`  ❌ Error: ${error.message}`);
          }
        } else {
          console.log(`  ✓ Table exists`);
          if (data && data.length > 0) {
            console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
          } else {
            console.log(`  Table is empty`);
          }
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
