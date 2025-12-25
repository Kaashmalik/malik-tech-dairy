const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestData() {
  try {
    console.log('Adding test data for kaash0542@gmail.com...\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    const userId = 'user_36OD5mI59b8m6dHyG8S3q6x4tmD';
    
    // Get animal IDs
    const { data: animals, error: animalError } = await supabase
      .from('animals')
      .select('id, tag')
      .eq('tenant_id', tenantId);
    
    if (animalError || !animals || animals.length === 0) {
      console.error('No animals found');
      return;
    }
    
    console.log('Found animals:', animals);
    
    // Add milk logs for today and yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const milkLogs = [
      {
        id: `milk_${Date.now()}_1`,
        tenant_id: tenantId,
        animal_id: animals[0].id,
        date: today,
        session: 'morning',
        quantity: 15000, // 15 liters in ml
        quality: 8,
        fat: 450, // 4.5%
        recorded_by: userId,
        created_at: new Date().toISOString()
      },
      {
        id: `milk_${Date.now()}_2`,
        tenant_id: tenantId,
        animal_id: animals[0].id,
        date: today,
        session: 'evening',
        quantity: 12000, // 12 liters in ml
        quality: 7,
        fat: 420, // 4.2%
        recorded_by: userId,
        created_at: new Date().toISOString()
      },
      {
        id: `milk_${Date.now()}_3`,
        tenant_id: tenantId,
        animal_id: animals[1].id,
        date: yesterday,
        session: 'morning',
        quantity: 14000, // 14 liters in ml
        quality: 8,
        fat: 440, // 4.4%
        recorded_by: userId,
        created_at: new Date().toISOString()
      }
    ];
    
    // Insert milk logs
    console.log('\nAdding milk logs...');
    for (const log of milkLogs) {
      const { data, error } = await supabase
        .from('milk_logs')
        .insert(log)
        .select();
      
      if (error) {
        console.error(`Error adding milk log for ${log.session}:`, error.message);
      } else {
        console.log(`✓ Added milk log - ${log.animal_id}: ${log.quantity}ml (${log.session})`);
      }
    }
    
    // Add a health record
    console.log('\nAdding health record...');
    const healthRecord = {
      id: `health_${Date.now()}`,
      tenant_id: tenantId,
      animal_id: animals[0].id,
      checkup_date: today,
      temperature: 38.5,
      weight: 450,
      heart_rate: 65,
      respiratory_rate: 30,
      symptoms: ['Normal'],
      notes: 'Regular health checkup - all parameters normal',
      veterinarian_id: userId,
      created_at: new Date().toISOString()
    };
    
    const { data: healthData, error: healthError } = await supabase
      .from('health_records')
      .insert(healthRecord)
      .select();
    
    if (healthError) {
      console.error('Error adding health record:', healthError.message);
    } else {
      console.log('✓ Added health record');
    }
    
    // Add an asset
    console.log('\nAdding asset...');
    const asset = {
      id: `asset_${Date.now()}`,
      tenant_id: tenantId,
      name: 'Milking Machine',
      type: 'equipment',
      category: 'milking',
      value: 150000,
      purchase_date: '2024-01-15',
      warranty_expiry: '2025-01-15',
      status: 'operational',
      location: 'Main Barn',
      notes: 'Automatic milking machine for 2 cows',
      created_by: userId,
      created_at: new Date().toISOString()
    };
    
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .insert(asset)
      .select();
    
    if (assetError) {
      console.error('Error adding asset:', assetError.message);
    } else {
      console.log('✓ Added asset');
    }
    
    // Add medicine inventory
    console.log('\nAdding medicine inventory...');
    const medicines = [
      {
        id: `med_${Date.now()}_1`,
        tenant_id: tenantId,
        name: 'Calcium Supplement',
        category: 'supplement',
        manufacturer: 'VetCare',
        batch_number: 'CAL2024001',
        expiry_date: '2025-12-31',
        quantity: 50,
        unit: 'bottles',
        unit_cost: 500,
        storage_location: 'Pharmacy',
        description: 'Calcium supplement for milk production',
        created_by: userId,
        created_at: new Date().toISOString()
      },
      {
        id: `med_${Date.now()}_2`,
        tenant_id: tenantId,
        name: 'Antibiotic Ointment',
        category: 'antibiotic',
        manufacturer: 'MediFarm',
        batch_number: 'ANT2024001',
        expiry_date: '2025-06-30',
        quantity: 20,
        unit: 'tubes',
        unit_cost: 150,
        storage_location: 'Pharmacy',
        description: 'Topical antibiotic for minor wounds',
        created_by: userId,
        created_at: new Date().toISOString()
      }
    ];
    
    for (const med of medicines) {
      const { data, error } = await supabase
        .from('medicine_inventory')
        .insert(med)
        .select();
      
      if (error) {
        console.error(`Error adding medicine ${med.name}:`, error.message);
      } else {
        console.log(`✓ Added medicine - ${med.name}`);
      }
    }
    
    console.log('\n✅ Test data added successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestData();
