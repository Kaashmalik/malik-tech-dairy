const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  try {
    console.log('Checking tenants table schema...\n');
    
    // Get the actual schema
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'tenants' });
    
    if (error) {
      console.error('Error getting schema:', error);
      
      // Alternative: Try to select a record to see the structure
      console.log('\nTrying to fetch a tenant record to see structure...');
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching tenant:', fetchError);
      } else if (tenant && tenant.length > 0) {
        console.log('Tenant structure:', Object.keys(tenant[0]));
      }
      
      return;
    }
    
    console.log('Tenants table columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Now get user's tenant through tenant_members
    console.log('\n\nChecking tenant_members for user kaash0542@gmail.com...');
    
    const { data: user, error: userError } = await supabase
      .from('platform_users')
      .select('id')
      .eq('email', 'kaash0542@gmail.com')
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }
    
    const { data: memberships, error: memberError } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('user_id', user.id);
    
    if (memberError) {
      console.error('Error finding memberships:', memberError);
      return;
    }
    
    console.log('Found memberships:', memberships);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
