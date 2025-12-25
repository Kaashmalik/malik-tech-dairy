const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTables() {
  try {
    console.log('Testing table existence...\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    
    const tables = [
      { name: 'animals', module: 'Animals' },
      { name: 'milk_logs', module: 'Milk Production' },
      { name: 'health_records', module: 'Health Records' },
      { name: 'breeding_records', module: 'Breeding Records' },
      { name: 'medicine_inventory', module: 'Medicine Inventory' },
      { name: 'medicine_logs', module: 'Medicine Logs' },
      { name: 'assets', module: 'Assets' },
      { name: 'expenses', module: 'Expenses' },
      { name: 'sales', module: 'Sales' },
      { name: 'feed_logs', module: 'Feed Logs' },
      { name: 'vaccinations', module: 'Vaccinations' },
      { name: 'diseases', module: 'Disease Registry' },
      { name: 'treatment_protocols', module: 'Treatment Protocols' },
      { name: 'staff', module: 'Staff Management' },
      { name: 'tasks', module: 'Task Management' },
      { name: 'iot_devices', module: 'IoT Devices' },
    ];
    
    for (const table of tables) {
      console.log(`\n=== ${table.module} (${table.name}) ===`);
      
      try {
        // Try to select count
        const { count, error: countError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);
        
        if (countError) {
          if (countError.code === 'PGRST116') {
            console.log('  ❌ Table does not exist');
          } else if (countError.code === '42703') {
            console.log('  ⚠️ Table exists but column error:', countError.message);
          } else {
            console.log('  ❌ Error:', countError.message);
          }
        } else {
          console.log(`  ✓ Table exists - ${count || 0} records`);
          
          // Get sample data
          const { data, error } = await supabase
            .from(table.name)
            .select('*')
            .eq('tenant_id', tenantId)
            .limit(1);
          
          if (error) {
            console.log('  Error fetching sample:', error.message);
          } else if (data && data.length > 0) {
            console.log('  Columns:', Object.keys(data[0]).join(', '));
          }
        }
      } catch (err) {
        console.log('  ❌ Exception:', err.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTables();
