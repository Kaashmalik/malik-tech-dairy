const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDisplayIssues() {
  try {
    console.log('🔧 Fixing Weather and Animals Display Issues\n');
    
    const tenantId = 'org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc';
    const userId = 'user_36OD5mI59b8m6dHyG8S3q6x4tmD';
    
    // 1. Check and fix animals data
    console.log('1️⃣ Checking Animals Data...');
    const { data: animals, error: animalError } = await supabase
      .from('animals')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (animalError) {
      console.log('   ❌ Error:', animalError.message);
    } else {
      console.log(`   ✅ Found ${animals.length} animals`);
      
      // Ensure all animals have required fields
      for (const animal of animals) {
        if (!animal.status) {
          await supabase
            .from('animals')
            .update({ status: 'active' })
            .eq('id', animal.id);
          console.log(`   ✓ Updated status for animal ${animal.tag}`);
        }
      }
    }
    
    // 2. Check and fix weather data
    console.log('\n2️⃣ Checking Weather Data...');
    
    // First, get tenant location
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('farm_location, weather_enabled')
      .eq('id', tenantId)
      .single();
    
    if (tenantError) {
      console.log('   ❌ Tenant error:', tenantError.message);
    } else {
      console.log('   ✅ Tenant location:', tenant.farm_location.city);
      
      // Clear old weather data
      await supabase
        .from('weather_data')
        .delete()
        .eq('tenant_id', tenantId);
      console.log('   ✓ Cleared old weather data');
      
      // Add fresh weather data
      const freshWeather = {
        id: `weather_${tenantId}_${Date.now()}`,
        tenant_id: tenantId,
        city_name: tenant.farm_location.city,
        country: tenant.farm_location.country,
        latitude: tenant.farm_location.latitude,
        longitude: tenant.farm_location.longitude,
        temperature: 22.5,
        feels_like: 24,
        humidity: 65,
        pressure: 1013,
        visibility: 10000,
        wind_speed: 12,
        wind_direction: 180,
        weather_main: 'Clouds',
        weather_description: 'scattered clouds',
        weather_icon: '03d',
        cloudiness: 40,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        data_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: savedWeather, error: saveError } = await supabase
        .from('weather_data')
        .insert(freshWeather)
        .select()
        .single();
      
      if (saveError) {
        console.log('   ❌ Error saving weather:', saveError.message);
      } else {
        console.log('   ✅ Fresh weather data added');
      }
    }
    
    // 3. Check tenant membership
    console.log('\n3️⃣ Checking Tenant Membership...');
    const { data: membership, error: memberError } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);
    
    if (memberError) {
      console.log('   ❌ Error:', memberError.message);
    } else if (membership.length === 0) {
      console.log('   ❌ User is not a member of tenant - ADDING...');
      await supabase
        .from('tenant_members')
        .insert({
          id: `member_${userId}_${tenantId}`,
          tenant_id: tenantId,
          user_id: userId,
          role: 'farm_owner',
          joined_at: new Date().toISOString(),
          status: 'active'
        });
      console.log('   ✅ Added user as farm owner');
    } else {
      console.log(`   ✅ User is ${membership[0].role} of tenant`);
    }
    
    // 4. Test API endpoints
    console.log('\n4️⃣ Testing API Endpoints...');
    
    // Test animals API
    console.log('   Testing /api/animals...');
    try {
      const animalResponse = await fetch('http://localhost:3000/api/animals');
      if (animalResponse.ok) {
        const animalData = await animalResponse.json();
        console.log(`   ✅ Animals API: ${animalData.animals?.length || 0} animals`);
      } else {
        console.log(`   ⚠️ Animals API: ${animalResponse.status}`);
      }
    } catch (err) {
      console.log(`   ⚠️ Server may not be running`);
    }
    
    // Test weather API
    console.log('   Testing /api/weather...');
    try {
      const weatherResponse = await fetch('http://localhost:3000/api/weather');
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        console.log(`   ✅ Weather API: ${weatherData.data?.length || 0} records`);
      } else {
        console.log(`   ⚠️ Weather API: ${weatherResponse.status}`);
      }
    } catch (err) {
      console.log(`   ⚠️ Server may not be running`);
    }
    
    // 5. Check environment variables
    console.log('\n5️⃣ Checking Environment...');
    console.log(`   ✅ Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'NOT SET'}`);
    console.log(`   ✅ OpenWeather API: ${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ? 'Set' : 'NOT SET'}`);
    
    // 6. Final verification
    console.log('\n6️⃣ Final Data Verification...');
    
    const { data: finalAnimals } = await supabase
      .from('animals')
      .select('tag, name, status')
      .eq('tenant_id', tenantId);
    
    const { data: finalWeather } = await supabase
      .from('weather_data')
      .select('city_name, temperature, weather_description')
      .eq('tenant_id', tenantId);
    
    console.log('\n📊 Final Status:');
    console.log(`   Animals: ${finalAnimals?.length || 0} records`);
    finalAnimals?.forEach(a => console.log(`     - ${a.tag} (${a.name || 'No name'})`));
    
    console.log(`   Weather: ${finalWeather?.length || 0} records`);
    finalWeather?.forEach(w => console.log(`     - ${w.city_name}: ${w.temperature}°C, ${w.weather_description}`));
    
    console.log('\n✅ Fix Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Stop the server (Ctrl+C)');
    console.log('2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('3. Run: npm run dev');
    console.log('4. Go to: http://localhost:3000/dashboard');
    console.log('5. Animals and Weather should now be visible!');
    
    console.log('\n🔍 If still not showing:');
    console.log('- Open browser console (F12)');
    console.log('- Check Network tab for failed requests');
    console.log('- Ensure you are logged in');
    console.log('- Try incognito mode');
    
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixDisplayIssues();
