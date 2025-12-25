// Test script to verify animals and weather display
require('dotenv').config({ path: '.env.local' });

async function testDisplay() {
  console.log('🔍 Testing Animals and Weather Display\n');
  
  // Test 1: Check if server is running
  console.log('1️⃣ Checking if server is running...');
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('   ✅ Server is running');
    } else {
      console.log('   ❌ Server returned error');
      console.log('\n🚨 PLEASE START THE SERVER:');
      console.log('   1. Open terminal');
      console.log('   2. Run: npm run dev');
      console.log('   3. Wait for server to start');
      console.log('   4. Refresh this test');
      return;
    }
  } catch (error) {
    console.log('   ❌ Server is NOT running');
    console.log('\n🚨 PLEASE START THE SERVER:');
    console.log('   1. Open terminal');
    console.log('   2. Run: npm run dev');
    console.log('   3. Wait for server to start');
    console.log('   4. Refresh this test');
    return;
  }
  
  // Test 2: Check animals API
  console.log('\n2️⃣ Testing Animals API...');
  try {
    const response = await fetch('http://localhost:3000/api/animals');
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Animals API working: ${data.animals?.length || 0} animals`);
      if (data.animals && data.animals.length > 0) {
        console.log('   Sample animals:');
        data.animals.slice(0, 3).forEach(a => {
          console.log(`     - ${a.tag}: ${a.name || 'No name'} (${a.status})`);
        });
      }
    } else {
      console.log(`   ❌ Animals API failed: ${response.status}`);
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Animals API error: ${error.message}`);
  }
  
  // Test 3: Check weather API
  console.log('\n3️⃣ Testing Weather API...');
  try {
    const response = await fetch('http://localhost:3000/api/weather');
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Weather API working: ${data.data?.length || 0} records`);
      if (data.data && data.data.length > 0) {
        const weather = data.data[0];
        console.log(`   Weather: ${weather.city_name} - ${weather.temperature}°C, ${weather.weather_description}`);
      }
      if (data.location) {
        console.log(`   Location: ${data.location.city}, ${data.location.country}`);
      }
    } else {
      console.log(`   ❌ Weather API failed: ${response.status}`);
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Weather API error: ${error.message}`);
  }
  
  // Test 4: Check dashboard page
  console.log('\n4️⃣ Testing Dashboard Page...');
  try {
    const response = await fetch('http://localhost:3000/dashboard');
    if (response.ok) {
      console.log('   ✅ Dashboard page accessible');
    } else {
      console.log(`   ❌ Dashboard failed: ${response.status}`);
      if (response.status === 307 || response.status === 302) {
        console.log('   Redirecting to login - PLEASE LOG IN FIRST');
      }
    }
  } catch (error) {
    console.log(`   ❌ Dashboard error: ${error.message}`);
  }
  
  console.log('\n✅ Test Complete!');
  console.log('\n📋 If APIs are working but data not showing:');
  console.log('1. Make sure you are logged in to the application');
  console.log('2. Go to: http://localhost:3000/dashboard');
  console.log('3. Open browser console (F12) and check for errors');
  console.log('4. Check Network tab for failed requests');
  console.log('5. Try hard refresh: Ctrl+Shift+R');
  console.log('6. Clear browser cache');
  console.log('7. Try in incognito mode');
  
  console.log('\n🔧 Debug Tools Available:');
  console.log('- Visit: http://localhost:3000/debug.html');
  console.log('- This page has tools to test APIs and fix issues');
}

testDisplay();
