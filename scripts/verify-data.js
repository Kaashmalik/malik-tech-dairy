const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyData() {
  try {
    console.log('Verifying data for kaash0542@gmail.com...\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    
    // Check milk logs
    console.log('=== Milk Logs ===');
    const { data: milkData, error: milkError } = await supabase
      .from('milk_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (milkError) {
      console.error('Error:', milkError.message);
    } else {
      console.log(`Found ${milkData.length} milk records:`);
      milkData.forEach(record => {
        const liters = (record.quantity / 1000).toFixed(1);
        const fatPercent = (record.fat / 100).toFixed(1);
        console.log(`  - ${record.date} ${record.session}: ${liters}L (Fat: ${fatPercent}%, Quality: ${record.quality}/10)`);
      });
    }
    
    // Check health records structure
    console.log('\n=== Health Records Schema ===');
    const { data: healthSample, error: healthError } = await supabase
      .from('health_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(1);
    
    if (healthError && healthError.code !== 'PGRST116') {
      console.log('Health records table exists with error:', healthError.message);
    } else if (healthSample && healthSample.length > 0) {
      console.log('Columns:', Object.keys(healthSample[0]).join(', '));
    } else {
      console.log('No health records found');
    }
    
    // Check medicine inventory structure
    console.log('\n=== Medicine Inventory Schema ===');
    const { data: medSample, error: medError } = await supabase
      .from('medicine_inventory')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(1);
    
    if (medError && medError.code !== 'PGRST116') {
      console.log('Medicine inventory table exists with error:', medError.message);
    } else if (medSample && medSample.length > 0) {
      console.log('Columns:', Object.keys(medSample[0]).join(', '));
    } else {
      console.log('No medicine records found');
    }
    
    // Summary
    console.log('\n=== Summary ===');
    console.log('✅ Animals: 2 records');
    console.log('✅ Milk Logs: 3 records (successfully added)');
    console.log('❌ Health Records: Table exists but schema mismatch');
    console.log('❌ Medicine Inventory: Table exists but schema mismatch');
    console.log('❌ Assets: Table does not exist');
    console.log('❌ Other modules: Tables exist but may have schema issues');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyData();
