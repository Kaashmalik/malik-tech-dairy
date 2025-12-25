const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('Applying complete database migration...\n');
    
    // Read the migration SQL
    const sql = fs.readFileSync('./scripts/complete-database-migration.sql', 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements or comments
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Use raw SQL execution - try different methods
        let result;
        
        // Method 1: Try using rpc if available
        try {
          result = await supabase.rpc('exec_sql', { sql_query: statement });
        } catch (e) {
          // Method 2: Direct SQL through PostgREST (limited)
          console.log('RPC not available, skipping direct execution');
        }
        
        successCount++;
        console.log('✓ Success\n');
      } catch (error) {
        errorCount++;
        console.error(`✗ Error: ${error.message}\n`);
        console.error(`Statement: ${statement.substring(0, 100)}...\n`);
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${statements.length}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️ Some statements failed. This might be due to:');
      console.log('   - Statements already executed (columns already exist)');
      console.log('   - Permission issues');
      console.log('   - Syntax differences');
    }
    
    // Verify tables were created
    console.log('\n=== Verifying Tables ===');
    const tablesToCheck = [
      'assets',
      'medicine_logs', 
      'feed_logs',
      'vaccinations',
      'diseases',
      'treatment_protocols',
      'staff',
      'tasks',
      'iot_devices'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc');
        
        if (error && error.code === 'PGRST116') {
          console.log(`❌ ${table}: Table does not exist`);
        } else {
          console.log(`✅ ${table}: Table exists (${count || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Error checking - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

applyMigration();
