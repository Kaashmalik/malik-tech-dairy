const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('Applying egg_logs table migration...\n');
    
    // Read the SQL file
    const sql = fs.readFileSync('./scripts/create-egg-logs-table.sql', 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      
      // Try executing directly
      console.log('\nTrying to execute SQL directly...');
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement.trim() + ';' 
          });
          
          if (stmtError) {
            console.error('Error with statement:', stmtError.message);
          } else {
            console.log('✓ Success');
          }
        }
      }
    } else {
      console.log('Migration applied successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();
