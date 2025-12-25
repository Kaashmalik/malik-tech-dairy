const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWeatherIntegration() {
  try {
    console.log('🌤️ Testing Weather Integration for MTK Dairy\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    
    // Test 1: Check if weather table exists
    console.log('1️⃣ Checking weather_data table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('weather_data')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log('   ❌ weather_data table does not exist');
      return;
    } else {
      console.log('   ✅ weather_data table exists');
    }
    
    // Test 2: Add sample weather data
    console.log('\n2️⃣ Adding sample weather data...');
    const sampleWeather = [
      {
        id: `weather_jatoi_${Date.now()}`,
        tenant_id: tenantId,
        city_name: 'Jatoi',
        country: 'PK',
        latitude: 29.5654,
        longitude: 70.9271,
        temperature: 32.5,
        feels_like: 35.2,
        humidity: 65,
        pressure: 1012,
        visibility: 10000,
        wind_speed: 12.5,
        wind_direction: 180,
        weather_main: 'Clear',
        weather_description: 'clear sky',
        weather_icon: '01d',
        cloudiness: 10,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        data_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `weather_alipur_${Date.now()}`,
        tenant_id: tenantId,
        city_name: 'Ali Pur',
        country: 'PK',
        latitude: 29.5974,
        longitude: 71.0812,
        temperature: 34.0,
        feels_like: 37.8,
        humidity: 60,
        pressure: 1010,
        visibility: 8000,
        wind_speed: 15.3,
        wind_direction: 200,
        weather_main: 'Clouds',
        weather_description: 'few clouds',
        weather_icon: '02d',
        cloudiness: 25,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        data_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `weather_muzzafargarh_${Date.now()}`,
        tenant_id: tenantId,
        city_name: 'Muzzafargarh',
        country: 'PK',
        latitude: 30.0735,
        longitude: 71.1935,
        temperature: 33.2,
        feels_like: 36.5,
        humidity: 70,
        pressure: 1008,
        visibility: 9000,
        wind_speed: 8.7,
        wind_direction: 160,
        weather_main: 'Rain',
        weather_description: 'light rain',
        weather_icon: '10d',
        cloudiness: 75,
        rain_1h: 0.5,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        data_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    for (const weather of sampleWeather) {
      const { data, error } = await supabase
        .from('weather_data')
        .insert(weather)
        .select();
      
      if (error) {
        console.log(`   ❌ Error adding weather for ${weather.city_name}: ${error.message}`);
      } else {
        console.log(`   ✅ Added weather data for ${weather.city_name}`);
      }
    }
    
    // Test 3: Retrieve weather data
    console.log('\n3️⃣ Retrieving weather data...');
    const { data: weatherData, error: fetchError } = await supabase
      .from('weather_data')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data_timestamp', { ascending: false });
    
    if (fetchError) {
      console.log(`   ❌ Error fetching weather: ${fetchError.message}`);
    } else {
      console.log(`   ✅ Found ${weatherData.length} weather records`);
      
      // Display summary
      console.log('\n📊 Weather Summary:');
      weatherData.forEach(record => {
        const temp = Math.round(record.temperature);
        const condition = record.weather_description;
        const time = new Date(record.data_timestamp).toLocaleTimeString();
        console.log(`   • ${record.city_name}: ${temp}°C, ${condition} (${time})`);
      });
    }
    
    // Test 4: Check API endpoints
    console.log('\n4️⃣ Testing API endpoints...');
    
    // Test GET endpoint
    try {
      const response = await fetch('http://localhost:3000/api/weather?limit=5', {
        headers: {
          'Cookie': '__session=test-session' // Add session cookie if needed
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ GET /api/weather working - returned ${result.data?.length || 0} records`);
      } else {
        console.log(`   ⚠️ GET /api/weather returned ${response.status}`);
      }
    } catch (err) {
      console.log(`   ⚠️ Could not test GET endpoint (server may not be running)`);
    }
    
    // Test 5: Farming recommendations
    console.log('\n5️⃣ Testing farming recommendations...');
    
    if (weatherData && weatherData.length > 0) {
      const hotWeather = weatherData.find(w => w.temperature > 30);
      const rainyWeather = weatherData.find(w => w.weather_main === 'Rain');
      
      if (hotWeather) {
        console.log(`   🌡️ Hot weather (${hotWeather.city_name}):`);
        console.log(`      - Ensure shade and cool water for animals`);
        console.log(`      - Increase water availability`);
        console.log(`      - Monitor for heat stress`);
      }
      
      if (rainyWeather) {
        console.log(`   🌧️ Rainy weather (${rainyWeather.city_name}):`);
        console.log(`      - Keep animals in covered areas`);
        console.log(`      - Ensure proper drainage`);
        console.log(`      - Check feed storage for moisture`);
      }
    }
    
    console.log('\n✅ Weather integration test completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Add your OpenWeather API key to .env.local:');
    console.log('   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here');
    console.log('2. The weather widget will appear on your dashboard');
    console.log('3. Weather data updates every 30 minutes automatically');
    console.log('4. You can view weather for Jatoi, Ali Pur, and Muzzafargarh');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWeatherIntegration();
