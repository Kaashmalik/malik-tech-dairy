const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnimalsForUser() {
  try {
    console.log('Checking animals for kaash0542@gmail.com...\n');
    
    // Get the user ID
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
    
    // Get tenant memberships for this user
    const { data: memberships, error: memberError } = await supabase
      .from('tenant_members')
      .select('tenant_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (memberError) {
      console.error('Error finding memberships:', memberError);
      return;
    }
    
    if (!memberships || memberships.length === 0) {
      console.log('No active tenant memberships found for this user');
      return;
    }
    
    console.log('\nFound tenant memberships:', memberships);
    
    // Get animals for each tenant
    for (const membership of memberships) {
      console.log(`\nChecking animals for tenant: ${membership.tenant_id}`);
      
      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select('*')
        .eq('tenant_id', membership.tenant_id)
        .order('created_at', { ascending: false });
      
      if (animalsError) {
        console.error('Error fetching animals:', animalsError);
        continue;
      }
      
      console.log(`Found ${animals.length} animals:`);
      animals.forEach(animal => {
        console.log(`  - Tag: ${animal.tag}, Name: ${animal.name || 'N/A'}, Species: ${animal.species}, Breed: ${animal.breed || 'N/A'}, Created: ${animal.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAnimalsForUser();
