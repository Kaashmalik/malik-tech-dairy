const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnimals() {
  try {
    console.log('Checking animals for kaash0542@gmail.com...\n');
    
    // First get the user ID
    const { data: user, error: userError } = await supabase
      .from('platform_users')
      .select('id, email')
      .eq('email', 'kaash0542@gmail.com')
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }
    
    console.log('Found user:', user);
    
    // Get tenant info for this user
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', user.id)
      .single();
    
    if (tenantError) {
      console.error('Error finding tenant:', tenantError);
      return;
    }
    
    console.log('\nFound tenant:', tenant);
    
    // Get all animals for this tenant
    const { data: animals, error: animalsError } = await supabase
      .from('animals')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });
    
    if (animalsError) {
      console.error('Error fetching animals:', animalsError);
      return;
    }
    
    console.log(`\nFound ${animals.length} animals:`);
    animals.forEach(animal => {
      console.log(`- Tag: ${animal.tag}, Name: ${animal.name || 'N/A'}, Species: ${animal.species}, Breed: ${animal.breed || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAnimals();
