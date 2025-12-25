// Test OpenWeather API with correct city names
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

async function testOpenWeatherAPI() {
  console.log('🌤️ Testing OpenWeather API with Pakistan Cities\n');
  
  const cities = [
    { name: 'Muzaffargarh', display: 'Jatoi' },
    { name: 'Muzaffargarh', display: 'Ali Pur' },
    { name: 'Muzaffargarh', display: 'Muzzafargarh' },
    { name: 'Lahore', display: 'Lahore' },
    { name: 'Multan', display: 'Multan' }
  ];
  
  for (const city of cities) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city.name},PK&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${city.display}: ${Math.round(data.main.temp)}°C, ${data.weather[0].description}`);
        console.log(`   Coordinates: ${data.coord.lat}, ${data.coord.lon}`);
      } else {
        const error = await response.json();
        console.log(`❌ ${city.display}: ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ ${city.display}: ${err.message}`);
    }
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Clear browser cache (Ctrl+Shift+R)');
  console.log('3. Check the dashboard for weather widget');
  console.log('4. Check browser console (F12) for any errors');
}

testOpenWeatherAPI();
