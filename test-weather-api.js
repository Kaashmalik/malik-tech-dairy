// Quick test to verify weather API is working
async function testWeatherAPI() {
  console.log('🌤️ Testing Weather API after fix...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/weather');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Weather API is working!');
      console.log('Data:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Weather API failed:');
      console.log('Status:', response.status);
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Could not connect to server');
    console.log('Make sure npm run dev is running');
  }
}

testWeatherAPI();
