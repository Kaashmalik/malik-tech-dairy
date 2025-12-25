const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllData() {
  try {
    console.log('Checking all data for kaash0542@gmail.com...\n');
    
    // Get the user ID and tenant
    const { data: user, error: userError } = await supabase
      .from('platform_users')
      .select('id, email')
      .eq('email', 'kaash0542@gmail.com')
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }
    
    console.log('✓ Found user:', user.email);
    
    // Get tenant membership
    const { data: memberships, error: memberError } = await supabase
      .from('tenant_members')
      .select('tenant_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (memberError || !memberships || memberships.length === 0) {
      console.error('Error finding tenant memberships');
      return;
    }
    
    const tenantId = memberships[0].tenant_id;
    console.log(`✓ Found tenant: ${tenantId}\n`);
    
    // Check all modules
    const modules = [
      { name: 'Animals', table: 'animals', fields: 'id, tag, name, species, breed, created_at' },
      { name: 'Milk Logs', table: 'milk_logs', fields: 'id, animal_id, date, quantity, session, created_at' },
      { name: 'Health Records', table: 'health_records', fields: 'id, animal_id, date, diagnosis, treatment, created_at' },
      { name: 'Breeding Records', table: 'breeding_records', fields: 'id, animal_id, date, type, status, created_at' },
      { name: 'Medicine Inventory', table: 'medicine_inventory', fields: 'id, name, quantity, unit, expiry_date' },
      { name: 'Medicine Logs', table: 'medicine_logs', fields: 'id, medicine_id, animal_id, date, dosage, created_at' },
      { name: 'Assets', table: 'assets', fields: 'id, name, type, value, purchase_date, created_at' },
      { name: 'Expenses', table: 'expenses', fields: 'id, category, amount, date, description, created_at' },
      { name: 'Sales', table: 'sales', fields: 'id, category, amount, date, description, created_at' },
      { name: 'Feed Logs', table: 'feed_logs', fields: 'id, animal_id, date, feed_type, quantity, created_at' },
    ];
    
    for (const module of modules) {
      console.log(`\n=== ${module.name} ===`);
      
      try {
        const { data, error, count } = await supabase
          .from(module.table)
          .select(module.fields, { count: 'exact' })
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`  Table '${module.table}' does not exist`);
          } else {
            console.log(`  Error: ${error.message}`);
          }
        } else {
          console.log(`  Total records: ${count || 0}`);
          
          if (data && data.length > 0) {
            console.log('  Recent records:');
            data.forEach(record => {
              const recordStr = Object.entries(record)
                .filter(([key]) => key !== 'tenant_id')
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
              console.log(`    - ${recordStr}`);
            });
          } else {
            console.log('  No records found');
          }
        }
      } catch (err) {
        console.log(`  Error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllData();
