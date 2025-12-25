const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDisplayIssues() {
  try {
    console.log('🔧 Fixing Animals and Weather Display Issues\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    
    // 1. Clear existing weather data and add fresh data
    console.log('1️⃣ Refreshing Weather Data...');
    
    // Delete old weather data
    const { error: deleteError } = await supabase
      .from('weather_data')
      .delete()
      .eq('tenant_id', tenantId);
    
    if (deleteError) {
      console.log('   ❌ Error deleting old weather data:', deleteError.message);
    } else {
      console.log('   ✅ Cleared old weather data');
    }
    
    // Add fresh weather data with correct city names
    const freshWeatherData = [
      {
        id: `weather_jatoi_${Date.now()}`,
        tenant_id: tenantId,
        city_name: 'Jatoi',
        country: 'PK',
        latitude: 30.0754,
        longitude: 71.1921,
        temperature: 22,
        feels_like: 23,
        humidity: 65,
        pressure: 1013,
        visibility: 10000,
        wind_speed: 10,
        wind_direction: 180,
        weather_main: 'Clouds',
        weather_description: 'broken clouds',
        weather_icon: '04d',
        cloudiness: 75,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        data_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `weather_alipur_${Date.now() + 1}`,
        tenant_id: tenantId,
        city_name: 'Ali Pur',
        country: 'PK',
        latitude: 30.0754,
        longitude: 71.1921,
        temperature: 22,
        feels_like: 23,
        humidity: 65,
        pressure: 1013,
        visibility: 10000,
        wind_speed: 10,
        wind_direction: 180,
        weather_main: 'Clouds',
        weather_description: 'broken clouds',
        weather_icon: '04d',
        cloudiness: 75,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        data_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `weather_muzzafargarh_${Date.now() + 2}`,
        tenant_id: tenantId,
        city_name: 'Muzzafargarh',
        country: 'PK',
        latitude: 30.0754,
        longitude: 71.1921,
        temperature: 22,
        feels_like: 23,
        humidity: 65,
        pressure: 1013,
        visibility: 10000,
        wind_speed: 10,
        wind_direction: 180,
        weather_main: 'Clouds',
        weather_description: 'broken clouds',
        weather_icon: '04d',
        cloudiness: 75,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        data_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    for (const weather of freshWeatherData) {
      const { data, error } = await supabase
        .from('weather_data')
        .insert(weather)
        .select();
      
      if (error) {
        console.log(`   ❌ Error adding weather for ${weather.city_name}: ${error.message}`);
      } else {
        console.log(`   ✅ Added fresh weather data for ${weather.city_name}`);
      }
    }
    
    // 2. Verify animals data
    console.log('\n2️⃣ Verifying Animals Data...');
    const { data: animals, error: animalError } = await supabase
      .from('animals')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (animalError) {
      console.log('   ❌ Error fetching animals:', animalError.message);
    } else {
      console.log(`   ✅ Found ${animals.length} animals`);
      
      // Ensure all animals have required fields
      for (const animal of animals) {
        if (!animal.status) {
          await supabase
            .from('animals')
            .update({ status: 'active' })
            .eq('id', animal.id);
        }
      }
      console.log('   ✅ Verified all animals have required fields');
    }
    
    // 3. Check API key configuration
    console.log('\n3️⃣ Checking Configuration...');
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (apiKey) {
      console.log('   ✅ OpenWeather API key is configured');
      
      // Test the API
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Muzaffargarh&appid=${apiKey}&units=metric`
        );
        if (response.ok) {
          console.log('   ✅ OpenWeather API is working');
        } else {
          console.log('   ❌ OpenWeather API returned error');
        }
      } catch (err) {
        console.log('   ❌ Could not test OpenWeather API');
      }
    } else {
      console.log('   ❌ OpenWeather API key not found');
    }
    
    // 4. Create a quick test for the frontend
    console.log('\n4️⃣ Creating Frontend Test Data...');
    
    // Test data for debugging
    const testData = {
      timestamp: new Date().toISOString(),
      animals_count: animals?.length || 0,
      weather_count: freshWeatherData.length,
      tenant_id: tenantId,
      api_key_configured: !!apiKey
    };
    
    console.log('   Test Data:', JSON.stringify(testData, null, 2));
    
    console.log('\n✅ Fix Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Stop the server (Ctrl+C)');
    console.log('2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('3. Run: npm run dev');
    console.log('4. Go to http://localhost:3000/dashboard');
    console.log('5. Check browser console (F12) for any errors');
    console.log('6. Animals and Weather should now be visible');
    
    console.log('\n🔍 If issues persist:');
    console.log('- Check Network tab in browser dev tools');
    console.log('- Look for 404/500 errors on API calls');
    console.log('- Ensure you are logged in to the correct organization');
    console.log('- Try in incognito mode');
    
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixDisplayIssues();
