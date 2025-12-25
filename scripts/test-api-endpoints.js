// Test API endpoints
require('dotenv').config({ path: '.env.local' });

async function testAPIEndpoints() {
  console.log('🔍 Testing API Endpoints\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test animals endpoint
  console.log('1️⃣ Testing /api/animals...');
  try {
    const response = await fetch(`${baseUrl}/api/animals`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: Found ${data.animals?.length || 0} animals`);
      if (data.animals && data.animals.length > 0) {
        console.log('   Sample animal:', {
          tag: data.animals[0].tag,
          name: data.animals[0].name,
          status: data.animals[0].status
        });
      }
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('   Error details:', text.substring(0, 200));
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log('   Make sure the server is running on http://localhost:3000');
  }
  
  // Test weather endpoint
  console.log('\n2️⃣ Testing /api/weather...');
  try {
    const response = await fetch(`${baseUrl}/api/weather?limit=5`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: Found ${data.data?.length || 0} weather records`);
      if (data.data && data.data.length > 0) {
        console.log('   Sample weather:', {
          city: data.data[0].city_name,
          temperature: data.data[0].temperature,
          condition: data.data[0].weather_description
        });
      }
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('   Error details:', text.substring(0, 200));
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log('   Make sure the server is running on http://localhost:3000');
  }
  
  // Test manual weather sync
  console.log('\n3️⃣ Testing manual weather sync...');
  try {
    const response = await fetch(`${baseUrl}/api/weather/sync?tenantId=org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: ${data.message}`);
      if (data.data) {
        console.log(`   Updated ${data.data.length} cities`);
      }
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('   Error details:', text.substring(0, 200));
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n📋 Troubleshooting Tips:');
  console.log('1. Make sure your server is running: npm run dev');
  console.log('2. Check browser console (F12 > Console) for JavaScript errors');
  console.log('3. Check Network tab (F12 > Network) for failed requests');
  console.log('4. Ensure you are logged in to the application');
  console.log('5. Clear browser cache and cookies');
  console.log('6. Try incognito/private browsing mode');
}

testAPIEndpoints();
