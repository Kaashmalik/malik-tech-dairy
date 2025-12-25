const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTablesDirectly() {
  try {
    console.log('Creating missing tables directly...\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    const userId = 'user_36OD5mI59b8m6dHyG8S3q6x4tmD';
    
    // 1. Create Assets table and insert test data
    console.log('1. Creating Assets table...');
    try {
      // Try to insert an asset to see if table works
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
        description: 'Automatic milking machine for 2 cows',
        created_by: userId,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('   Assets table does not exist - needs manual creation');
        } else {
          console.log('   Error:', error.message);
        }
      } else {
        console.log('   ✅ Asset added successfully');
      }
    } catch (err) {
      console.log('   Error:', err.message);
    }
    
    // 2. Add test health record with correct schema
    console.log('\n2. Adding Health Record...');
    try {
      // First check current schema
      const { data: sample, error: sampleError } = await supabase
        .from('health_records')
        .select('*')
        .limit(1);
      
      if (sampleError && !sampleError.code === 'PGRST116') {
        console.log('   Current error:', sampleError.message);
      }
      
      // Try to add with various possible schemas
      const healthRecord = {
        id: `health_${Date.now()}`,
        tenant_id: tenantId,
        animal_id: '21b80e01-e7d7-4c58-9783-989cca8157f4',
        date: new Date().toISOString().split('T')[0],
        checkup_date: new Date().toISOString().split('T')[0],
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
        console.log('   Error:', healthError.message);
        console.log('   Trying alternative schema...');
        
        // Try without checkup_date
        delete healthRecord.checkup_date;
        const { data: altData, error: altError } = await supabase
          .from('health_records')
          .insert(healthRecord)
          .select();
        
        if (altError) {
          console.log('   Alternative schema also failed:', altError.message);
        } else {
          console.log('   ✅ Health record added with alternative schema');
        }
      } else {
        console.log('   ✅ Health record added successfully');
      }
    } catch (err) {
      console.log('   Error:', err.message);
    }
    
    // 3. Create Medicine Log
    console.log('\n3. Creating Medicine Log...');
    try {
      const medicineLog = {
        id: `medlog_${Date.now()}`,
        tenant_id: tenantId,
        medicine_id: `med_${Date.now()}`,
        animal_id: '21b80e01-e7d7-4c58-9783-989cca8157f4',
        date: new Date().toISOString().split('T')[0],
        dosage: '10ml',
        frequency: 'twice daily',
        duration: 7,
        notes: 'Vitamin supplement',
        administered_by: userId,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('medicine_logs')
        .insert(medicineLog)
        .select();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('   Medicine logs table does not exist - needs manual creation');
        } else {
          console.log('   Error:', error.message);
        }
      } else {
        console.log('   ✅ Medicine log added successfully');
      }
    } catch (err) {
      console.log('   Error:', err.message);
    }
    
    // 4. Create Feed Log
    console.log('\n4. Creating Feed Log...');
    try {
      const feedLog = {
        id: `feed_${Date.now()}`,
        tenant_id: tenantId,
        animal_id: '21b80e01-e7d7-4c58-9783-989cca8157f4',
        date: new Date().toISOString().split('T')[0],
        feed_type: 'concentrate',
        quantity: 5,
        unit: 'kg',
        cost: 250,
        supplier: 'Feed Supplier Inc',
        notes: 'High protein concentrate',
        recorded_by: userId,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('feed_logs')
        .insert(feedLog)
        .select();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('   Feed logs table does not exist - needs manual creation');
        } else {
          console.log('   Error:', error.message);
        }
      } else {
        console.log('   ✅ Feed log added successfully');
      }
    } catch (err) {
      console.log('   Error:', err.message);
    }
    
    // 5. Create Vaccination Record
    console.log('\n5. Creating Vaccination Record...');
    try {
      const vaccination = {
        id: `vax_${Date.now()}`,
        tenant_id: tenantId,
        animal_id: '21b80e01-e7d7-4c58-9783-989cca8157f4',
        vaccine_name: 'Foot-and-Mouth Vaccine',
        vaccine_type: 'inactivated',
        manufacturer: 'VetCare',
        batch_number: 'FAM2024001',
        vaccination_date: new Date().toISOString().split('T')[0],
        next_due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        administered_by: userId,
        notes: 'Annual FMD vaccination',
        status: 'administered',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('vaccinations')
        .insert(vaccination)
        .select();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('   Vaccinations table does not exist - needs manual creation');
        } else {
          console.log('   Error:', error.message);
        }
      } else {
        console.log('   ✅ Vaccination record added successfully');
      }
    } catch (err) {
      console.log('   Error:', err.message);
    }
    
    // 6. Add Sales Record
    console.log('\n6. Adding Sales Record...');
    try {
      const sale = {
        id: `sale_${Date.now()}`,
        tenant_id: tenantId,
        category: 'milk',
        amount: 5000,
        date: new Date().toISOString().split('T')[0],
        description: 'Milk sale to local dairy',
        customer_name: 'Local Dairy Store',
        contact_info: 'Phone: 123-456-7890',
        payment_method: 'cash',
        payment_status: 'completed',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('sales')
        .insert(sale)
        .select();
      
      if (error) {
        console.log('   Error:', error.message);
      } else {
        console.log('   ✅ Sales record added successfully');
      }
    } catch (err) {
      console.log('   Error:', err.message);
    }
    
    // 7. Add Expense Record
    console.log('\n7. Adding Expense Record...');
    try {
      const expense = {
        id: `expense_${Date.now()}`,
        tenant_id: tenantId,
        category: 'feed',
        amount: 10000,
        date: new Date().toISOString().split('T')[0],
        description: 'Monthly feed purchase',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select();
      
      if (error) {
        console.log('   Error:', error.message);
      } else {
        console.log('   ✅ Expense record added successfully');
      }
    } catch (err) {
      console.log('   Error:', err.message);
    }
    
    console.log('\n✅ Test data creation completed!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTablesDirectly();
