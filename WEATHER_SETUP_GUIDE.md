# Weather Integration Setup Guide

## 🌤️ Weather Status for Pakistan Cities

The MTK Dairy application now includes weather tracking for Pakistan cities with Jatoi, Ali Pur, and Muzzafargarh as default locations.

## 🚀 Quick Setup

### 1. Get OpenWeather API Key
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

### 2. Add API Key to Environment
Add this line to your `.env.local` file:
```bash
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_actual_api_key_here
```

### 3. Restart Your Application
```bash
npm run dev
```

## 📋 Features Included

### ✅ **Weather Dashboard Widget**
- Real-time weather for your farm locations
- Temperature, humidity, pressure, wind speed
- Weather conditions and forecasts
- Sunrise/sunset times
- Visibility and UV index

### ✅ **Default Pakistan Cities**
- **Jatoi** - Punjab Province
- **Ali Pur** - Punjab Province  
- **Muzzafargarh** - Punjab Province
- Plus 7 more major cities (Lahore, Karachi, Islamabad, etc.)

### ✅ **Farming Recommendations**
The system provides smart farming recommendations based on weather:
- 🌡️ **High Temperature**: Shade, cool water, heat stress monitoring
- 🌧️ **Rainy Weather**: Covered areas, drainage, feed storage
- 💨 **Strong Winds**: Secure equipment, protect young animals
- 💦 **High Humidity**: Ventilation, fungal infection checks

### ✅ **Data Storage**
- All weather data stored in your database
- Historical weather tracking
- Automatic updates every 30 minutes
- Multi-tenant support

## 🔧 API Endpoints

### Get Weather Data
```javascript
GET /api/weather?city=Jatoi&limit=10
```

### Save Weather Data
```javascript
POST /api/weather
{
  "city_name": "Jatoi",
  "temperature": 32.5,
  "humidity": 65,
  "weather_main": "Clear",
  // ... other weather fields
}
```

### Sync Weather for All Cities
```javascript
POST /api/weather/sync
Authorization: Bearer YOUR_SYNC_SECRET
```

## 📊 Database Schema

The `weather_data` table includes:
- City information and coordinates
- Temperature (actual and feels like)
- Humidity, pressure, visibility
- Wind speed and direction
- Weather conditions and descriptions
- Rain/snow measurements
- Sunrise/sunset times
- Timestamps for data tracking

## 🔄 Automatic Updates

Weather data automatically updates:
- Every 30 minutes on the dashboard
- Via cron job using `/api/weather/sync`
- Manual refresh available in UI

## 🎯 Integration with Farm Management

The weather system integrates with:
- **Feed Management**: Adjust feed based on temperature
- **Health Monitoring**: Weather-related health alerts
- **Activity Planning**: Schedule tasks based on forecast
- **Resource Management**: Water, shelter, equipment needs

## 🛠️ Troubleshooting

### Weather Not Showing?
1. Check your API key is correctly set
2. Verify internet connection
3. Check browser console for errors
4. Ensure the weather table exists in database

### API Key Errors?
1. Verify the key is valid and active
2. Check if you've exceeded free tier limits
3. Ensure proper environment variable naming

### Data Not Updating?
1. Check the sync endpoint is accessible
2. Verify cron job configuration
3. Manual refresh available in dashboard

## 📱 Mobile Support

The weather widget is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones
- Progressive Web App (PWA)

## 🔔 Future Enhancements

Planned features:
- Weather alerts and notifications
- 7-day forecast view
- Historical weather analytics
- Weather impact on milk production
- Integration with IoT sensors

## 📞 Support

For weather integration issues:
1. Check the setup guide above
2. Review the test script: `scripts/test-weather-integration.js`
3. Check OpenWeather API documentation
4. Contact support with error details

---

**Note**: The free OpenWeather plan includes:
- 60 calls per minute
- 1,000 calls per day
- Current weather data
- 5-day forecast

For higher usage, consider upgrading to a paid plan.
