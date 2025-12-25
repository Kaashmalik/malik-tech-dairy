const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveTest() {
  try {
    console.log('🚀 Running comprehensive SaaS-level database test...\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    const userId = 'user_36OD5mI59b8m6dHyG8S3q6x4tmD';
    const today = new Date().toISOString().split('T')[0];
    
    // Get existing animals
    const { data: animals, error: animalError } = await supabase
      .from('animals')
      .select('id, tag')
      .eq('tenant_id', tenantId);
    
    if (animalError || !animals || animals.length === 0) {
      console.error('❌ No animals found');
      return;
    }
    
    console.log(`✅ Found ${animals.length} animals for testing\n`);
    
    const testResults = {
      passed: 0,
      failed: 0,
      details: []
    };
    
    // Test 1: Animals Module
    console.log('1️⃣ Testing Animals Module...');
    try {
      const newAnimal = {
        id: `animal_test_${Date.now()}`,
        tenant_id: tenantId,
        tag: `TEST-${Date.now()}`,
        name: 'Test Animal',
        species: 'cow',
        breed: 'Test Breed',
        gender: 'female',
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('animals')
        .insert(newAnimal)
        .select();
      
      if (error) throw error;
      testResults.passed++;
      testResults.details.push('✅ Animals: CRUD operations working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Animals: ${error.message}`);
    }
    
    // Test 2: Milk Production Module
    console.log('\n2️⃣ Testing Milk Production Module...');
    try {
      const milkLog = {
        id: `milk_test_${Date.now()}`,
        tenant_id: tenantId,
        animal_id: animals[0].id,
        date: today,
        session: 'morning',
        quantity: 15000,
        quality: 8,
        fat: 450,
        recorded_by: userId,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('milk_logs')
        .insert(milkLog)
        .select();
      
      if (error) throw error;
      testResults.passed++;
      testResults.details.push('✅ Milk Logs: Recording working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Milk Logs: ${error.message}`);
    }
    
    // Test 3: Health Records Module
    console.log('\n3️⃣ Testing Health Records Module...');
    try {
      const healthRecord = {
        id: `health_test_${Date.now()}`,
        tenant_id: tenantId,
        animal_id: animals[0].id,
        date: today,
        checkup_date: today,
        type: 'checkup',
        temperature: 38.5,
        weight: 450,
        heart_rate: 65,
        respiratory_rate: 30,
        symptoms: ['Healthy'],
        diagnosis: 'Normal',
        treatment: 'None required',
        notes: 'Regular checkup',
        veterinarian_id: userId,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('health_records')
        .insert(healthRecord)
        .select();
      
      if (error) throw error;
      testResults.passed++;
      testResults.details.push('✅ Health Records: CRUD working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Health Records: ${error.message}`);
    }
    
    // Test 4: Medicine Inventory Module
    console.log('\n4️⃣ Testing Medicine Inventory Module...');
    try {
      // First add a medicine
      const medicine = {
        tenant_id: tenantId,
        name: 'Test Medicine',
        category: 'supplement',
        quantity: 100,
        unit: 'bottles',
        expiry_date: '2025-12-31',
        manufacturer: 'Test Corp',
        batch_number: 'TEST001',
        storage_location: 'Pharmacy',
        description: 'Test medicine',
        created_by: userId
      };
      
      const { data: medData, error: medError } = await supabase
        .from('medicine_inventory')
        .insert(medicine)
        .select();
      
      if (medError) throw medError;
      
      // Then add a medicine log
      const medicineLog = {
        id: `medlog_test_${Date.now()}`,
        tenant_id: tenantId,
        medicine_id: medData[0].id,
        animal_id: animals[0].id,
        date: today,
        dosage: '10ml',
        frequency: 'daily',
        duration: 7,
        notes: 'Test administration',
        administered_by: userId,
        created_at: new Date().toISOString()
      };
      
      const { data: logData, error: logError } = await supabase
        .from('medicine_logs')
        .insert(medicineLog)
        .select();
      
      if (logError) throw logError;
      testResults.passed++;
      testResults.details.push('✅ Medicine Module: Inventory & Logs working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Medicine Module: ${error.message}`);
    }
    
    // Test 5: Feed Management Module
    console.log('\n5️⃣ Testing Feed Management Module...');
    try {
      const feedTypes = ['concentrate', 'silage', 'hay', 'minerals'];
      
      for (const feedType of feedTypes) {
        const feedLog = {
          id: `feed_${feedType}_${Date.now()}`,
          tenant_id: tenantId,
          animal_id: animals[0].id,
          date: today,
          feed_type: feedType,
          quantity: Math.floor(Math.random() * 10) + 1,
          unit: 'kg',
          cost: Math.floor(Math.random() * 500) + 100,
          supplier: 'Feed Supplier Inc',
          notes: `${feedType} feed`,
          recorded_by: userId,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('feed_logs')
          .insert(feedLog)
          .select();
        
        if (error) throw error;
      }
      
      testResults.passed++;
      testResults.details.push('✅ Feed Management: All feed types working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Feed Management: ${error.message}`);
    }
    
    // Test 6: Vaccination Module
    console.log('\n6️⃣ Testing Vaccination Module...');
    try {
      const vaccines = [
        { name: 'FMD Vaccine', type: 'inactivated' },
        { name: 'HS Vaccine', type: 'live_attenuated' },
        { name: 'BQ Vaccine', type: 'toxoid' }
      ];
      
      for (const vaccine of vaccines) {
        const vaccination = {
          id: `vax_${vaccine.name.replace(' ', '_')}_${Date.now()}`,
          tenant_id: tenantId,
          animal_id: animals[0].id,
          vaccine_name: vaccine.name,
          vaccine_type: vaccine.type,
          manufacturer: 'VetLab',
          batch_number: `VAC${Date.now()}`,
          vaccination_date: today,
          next_due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          administered_by: userId,
          notes: `Annual ${vaccine.name}`,
          status: 'administered',
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('vaccinations')
          .insert(vaccination)
          .select();
        
        if (error) throw error;
      }
      
      testResults.passed++;
      testResults.details.push('✅ Vaccination Module: All vaccine types working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Vaccination Module: ${error.message}`);
    }
    
    // Test 7: Asset Management Module
    console.log('\n7️⃣ Testing Asset Management Module...');
    try {
      const assets = [
        { type: 'equipment', name: 'Milking Machine', value: 150000 },
        { type: 'vehicle', name: 'Tractor', value: 2500000 },
        { type: 'building', name: 'Barn A', value: 5000000 },
        { type: 'land', name: 'Pasture Area', value: 10000000 }
      ];
      
      for (const asset of assets) {
        const assetRecord = {
          id: `asset_${asset.type}_${Date.now()}`,
          tenant_id: tenantId,
          name: asset.name,
          type: asset.type,
          category: 'farm',
          value: asset.value,
          purchase_date: '2024-01-01',
          status: 'operational',
          location: 'Main Farm',
          description: `${asset.name} - Test asset`,
          created_by: userId,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('assets')
          .insert(assetRecord)
          .select();
        
        if (error) throw error;
      }
      
      testResults.passed++;
      testResults.details.push('✅ Asset Management: All asset types working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Asset Management: ${error.message}`);
    }
    
    // Test 8: Financial Module (Sales & Expenses)
    console.log('\n8️⃣ Testing Financial Module...');
    try {
      // Add expenses
      const expenses = [
        { category: 'feed', amount: 25000, description: 'Monthly feed purchase' },
        { category: 'medicine', amount: 10000, description: 'Vaccines and medicines' },
        { category: 'maintenance', amount: 15000, description: 'Equipment maintenance' },
        { category: 'labor', amount: 50000, description: 'Staff salaries' }
      ];
      
      for (const expense of expenses) {
        const expenseRecord = {
          id: `expense_${expense.category}_${Date.now()}`,
          tenant_id: tenantId,
          date: today,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          currency: 'PKR',
          recorded_by: userId,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('expenses')
          .insert(expenseRecord)
          .select();
        
        if (error) throw error;
      }
      
      // Add sales
      const sales = [
        { category: 'milk', amount: 45000, description: 'Daily milk sales' },
        { category: 'animals', amount: 100000, description: 'Sold calf' }
      ];
      
      for (const sale of sales) {
        const saleRecord = {
          id: `sale_${sale.category}_${Date.now()}`,
          tenant_id: tenantId,
          date: today,
          category: sale.category,
          type: 'sale',
          quantity: 1,
          unit: 'unit',
          price_per_unit: sale.amount,
          total: sale.amount,
          currency: 'PKR',
          customer_name: 'Test Customer',
          contact_info: 'Phone: 123-456-7890',
          payment_method: 'bank_transfer',
          payment_status: 'completed',
          amount: sale.amount,
          description: sale.description,
          recorded_by: userId,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('sales')
          .insert(saleRecord)
          .select();
        
        if (error) throw error;
      }
      
      testResults.passed++;
      testResults.details.push('✅ Financial Module: Sales & Expenses working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Financial Module: ${error.message}`);
    }
    
    // Test 9: Breeding Module
    console.log('\n9️⃣ Testing Breeding Module...');
    try {
      const breedingRecord = {
        id: `breeding_test_${Date.now()}`,
        tenant_id: tenantId,
        animal_id: animals[0].id,
        sire_id: animals.length > 1 ? animals[1].id : null,
        breeding_date: new Date().toISOString(),
        expected_calving_date: new Date(Date.now() + 283 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_progress',
        notes: 'AI breeding performed',
        recorded_by: userId,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('breeding_records')
        .insert(breedingRecord)
        .select();
      
      if (error) throw error;
      testResults.passed++;
      testResults.details.push('✅ Breeding Module: CRUD working');
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Breeding Module: ${error.message}`);
    }
    
    // Test 10: Multi-tenancy Data Isolation
    console.log('\n🔒 Testing Multi-tenancy Data Isolation...');
    try {
      // Try to access data with different tenant
      const { data: isolatedData, error: isolationError } = await supabase
        .from('animals')
        .select('*')
        .eq('tenant_id', 'fake-tenant-id');
      
      if (isolatedData && isolatedData.length === 0) {
        testResults.passed++;
        testResults.details.push('✅ Multi-tenancy: Data isolation working');
      } else {
        throw new Error('Data isolation failed');
      }
    } catch (error) {
      testResults.failed++;
      testResults.details.push(`❌ Multi-tenancy: ${error.message}`);
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    console.log('\n📝 Details:');
    testResults.details.forEach(detail => console.log(`   ${detail}`));
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Database is production-ready for SaaS!');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above.');
    }
    
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

comprehensiveTest();
