const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDisplayIssues() {
  try {
    console.log('🔍 Debugging Animals and Weather Display Issues\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    const userId = 'user_36OD5mI59b8m6dHyG8S3q6x4tmD';
    
    // 1. Check animals data
    console.log('1️⃣ Checking Animals Data...');
    const { data: animals, error: animalError } = await supabase
      .from('animals')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (animalError) {
      console.log('   ❌ Error fetching animals:', animalError.message);
    } else {
      console.log(`   ✅ Found ${animals.length} animals`);
      animals.forEach(animal => {
        console.log(`      - ${animal.tag} (${animal.name || 'No name'}) - Status: ${animal.status}`);
      });
    }
    
    // 2. Check weather data
    console.log('\n2️⃣ Checking Weather Data...');
    const { data: weather, error: weatherError } = await supabase
      .from('weather_data')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data_timestamp', { ascending: false })
      .limit(5);
    
    if (weatherError) {
      console.log('   ❌ Error fetching weather:', weatherError.message);
    } else {
      console.log(`   ✅ Found ${weather.length} weather records`);
      weather.forEach(record => {
        console.log(`      - ${record.city_name}: ${record.temperature}°C, ${record.weather_description}`);
      });
    }
    
    // 3. Check tenant membership
    console.log('\n3️⃣ Checking Tenant Membership...');
    const { data: membership, error: memberError } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);
    
    if (memberError) {
      console.log('   ❌ Error checking membership:', memberError.message);
    } else if (membership.length === 0) {
      console.log('   ❌ User is not a member of this tenant!');
    } else {
      console.log(`   ✅ User is ${membership[0].role} of tenant`);
    }
    
    // 4. Test API endpoints directly
    console.log('\n4️⃣ Testing API Endpoints...');
    
    // Test animals API
    try {
      const animalResponse = await fetch('http://localhost:3000/api/animals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (animalResponse.ok) {
        const animalResult = await animalResponse.json();
        console.log(`   ✅ Animals API: ${animalResult.animals?.length || 0} animals returned`);
      } else {
        console.log(`   ❌ Animals API returned ${animalResponse.status}`);
        const errorText = await animalResponse.text();
        console.log(`      Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (err) {
      console.log(`   ⚠️ Could not test Animals API (server running?): ${err.message}`);
    }
    
    // Test weather API
    try {
      const weatherResponse = await fetch('http://localhost:3000/api/weather?limit=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (weatherResponse.ok) {
        const weatherResult = await weatherResponse.json();
        console.log(`   ✅ Weather API: ${weatherResult.data?.length || 0} records returned`);
      } else {
        console.log(`   ❌ Weather API returned ${weatherResponse.status}`);
        const errorText = await weatherResponse.text();
        console.log(`      Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (err) {
      console.log(`   ⚠️ Could not test Weather API (server running?): ${err.message}`);
    }
    
    // 5. Check OpenWeather API
    console.log('\n5️⃣ Testing OpenWeather API...');
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.log('   ❌ OpenWeather API key not found in environment');
    } else {
      try {
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Jatoi&appid=${apiKey}&units=metric`
        );
        
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          console.log(`   ✅ OpenWeather API working: ${weatherData.main.temp}°C in ${weatherData.name}`);
        } else {
          console.log(`   ❌ OpenWeather API error: ${weatherResponse.status}`);
          const errorData = await weatherResponse.json();
          console.log(`      Message: ${errorData.message}`);
        }
      } catch (err) {
        console.log(`   ❌ OpenWeather API request failed: ${err.message}`);
      }
    }
    
    // 6. Check for common issues
    console.log('\n6️⃣ Common Issues Check:');
    
    // Check if server needs restart
    console.log('   📋 If you just added the API key:');
    console.log('      1. Stop the server (Ctrl+C)');
    console.log('      2. Run: npm run dev');
    console.log('      3. Clear browser cache (Ctrl+Shift+R)');
    
    // Check console errors
    console.log('\n   📋 Check browser console for:');
    console.log('      - Network errors (F12 > Network tab)');
    console.log('      - JavaScript errors (F12 > Console tab)');
    console.log('      - Authentication issues');
    
    console.log('\n✅ Debug complete! Review the results above.');
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugDisplayIssues();
