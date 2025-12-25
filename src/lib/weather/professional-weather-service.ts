// Professional Weather Service for MTK Dairy
// Uses tenant's actual farm location instead of default cities

export interface FarmLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address?: string;
  timezone?: string;
}

export interface WeatherData {
  id: string;
  tenant_id: string;
  city_name: string;
  country: string;
  latitude?: number;
  longitude?: number;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  visibility?: number;
  uv_index?: number;
  wind_speed: number;
  wind_direction: number;
  wind_gust?: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  cloudiness: number;
  rain_1h?: number;
  rain_3h?: number;
  snow_1h?: number;
  snow_3h?: number;
  sunrise?: string;
  sunset?: string;
  data_timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface OpenWeatherResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

class ProfessionalWeatherService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openweathermap.org/data/2.5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get current weather for specific coordinates
   */
  async getCurrentWeatherByCoords(lat: number, lon: number): Promise<OpenWeatherResponse> {
    const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get 5-day weather forecast
   */
  async getForecast(lat: number, lon: number): Promise<any> {
    const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get weather by city name (fallback)
   */
  async getCurrentWeather(city: string): Promise<OpenWeatherResponse> {
    const url = `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Transform OpenWeather data to our database format
   */
  transformWeatherData(data: OpenWeatherResponse, tenantId: string, farmLocation?: FarmLocation): Omit<WeatherData, 'id' | 'created_at' | 'updated_at'> {
    return {
      tenant_id: tenantId,
      city_name: farmLocation?.city || data.name,
      country: farmLocation?.country || data.sys.country,
      latitude: data.coord.lat,
      longitude: data.coord.lon,
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility,
      wind_speed: data.wind.speed * 3.6, // Convert m/s to km/h
      wind_direction: data.wind.deg,
      wind_gust: data.wind.gust ? data.wind.gust * 3.6 : undefined, // Convert m/s to km/h
      weather_main: data.weather[0].main,
      weather_description: data.weather[0].description,
      weather_icon: data.weather[0].icon,
      cloudiness: data.clouds.all,
      rain_1h: data.rain?.['1h'],
      rain_3h: data.rain?.['3h'],
      snow_1h: data.snow?.['1h'],
      snow_3h: data.snow?.['3h'],
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
      data_timestamp: new Date(data.dt * 1000).toISOString()
    };
  }

  /**
   * Get weather for a specific tenant based on their farm location
   */
  async getTenantWeather(tenantId: string, farmLocation: FarmLocation): Promise<OpenWeatherResponse> {
    try {
      // First try to get weather by exact coordinates
      return await this.getCurrentWeatherByCoords(farmLocation.latitude, farmLocation.longitude);
    } catch (error) {
      console.log(`Failed to get weather by coordinates, trying city name: ${farmLocation.city}`);
      // Fallback to city name
      return await this.getCurrentWeather(farmLocation.city);
    }
  }

  /**
   * Get weather for multiple tenants
   */
  async getMultipleTenantsWeather(tenants: Array<{ id: string; farm_location: FarmLocation }>): Promise<Array<{ tenantId: string; weather: OpenWeatherResponse; location: FarmLocation }>> {
    const results = [];
    
    for (const tenant of tenants) {
      try {
        const weather = await this.getTenantWeather(tenant.id, tenant.farm_location);
        results.push({ 
          tenantId: tenant.id, 
          weather, 
          location: tenant.farm_location 
        });
      } catch (error) {
        console.error(`Failed to fetch weather for tenant ${tenant.id}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get farming recommendations based on weather
   */
  getFarmingRecommendations(weather: WeatherData): string[] {
    const recommendations: string[] = [];
    
    // Temperature-based recommendations
    if (weather.temperature > 35) {
      recommendations.push('🌡️ Extreme heat! Provide shade and cool water immediately');
      recommendations.push('💧 Increase water availability to 2-3x normal');
      recommendations.push('🕐 Avoid outdoor activities between 11 AM - 4 PM');
      recommendations.push('🧊 Consider using sprinklers for cooling');
    } else if (weather.temperature > 30) {
      recommendations.push('🌡️ High temperature! Ensure shade and cool water');
      recommendations.push('💧 Monitor water intake closely');
    } else if (weather.temperature < 10) {
      recommendations.push('🧥 Cold weather! Provide shelter and warm bedding');
      recommendations.push('🌾 Increase feed by 10-20% for energy');
      recommendations.push('🔥 Check water heaters to prevent freezing');
    }
    
    // Rain-based recommendations
    if (weather.rain_1h && weather.rain_1h > 10) {
      recommendations.push('🌧️ Heavy rain! Move all animals to covered areas');
      recommendations.push('🚫 Postpone all outdoor activities');
      recommendations.push('🌾 Check feed storage for water damage');
    } else if (weather.rain_1h && weather.rain_1h > 2) {
      recommendations.push('🌧️ Moderate rain! Keep animals in covered areas');
      recommendations.push('📅 Postpone grazing until rain stops');
    }
    
    // Wind-based recommendations
    if (weather.wind_speed > 40) {
      recommendations.push('💨 Strong winds! Secure all loose equipment');
      recommendations.push('🐄 Move young animals to protected areas');
      recommendations.push('🏠 Check barn integrity');
    } else if (weather.wind_speed > 25) {
      recommendations.push('💨 Windy conditions! Secure outdoor items');
    }
    
    // Humidity-based recommendations
    if (weather.humidity > 85) {
      recommendations.push('💦 Very high humidity! Risk of heat stress');
      recommendations.push('🌪️ Ensure maximum ventilation');
      recommendations.push('🦠 Check for signs of fungal diseases');
      recommendations.push('📦 Store feed in dry, ventilated areas');
    } else if (weather.humidity > 70) {
      recommendations.push('💦 High humidity! Ensure good ventilation');
    }
    
    // Weather condition recommendations
    switch (weather.weather_main.toLowerCase()) {
      case 'rain':
      case 'drizzle':
        recommendations.push('☔ Rainy weather - Perfect for indoor maintenance');
        recommendations.push('🧹 Clean and sanitize equipment');
        break;
      case 'clear':
        recommendations.push('☀️ Clear weather - Ideal for grazing');
        recommendations.push('🌾 Good day for hay making and feed drying');
        recommendations.push('☀️ Check water trough levels');
        break;
      case 'clouds':
        recommendations.push('☁️ Cloudy weather - Good for outdoor work');
        recommendations.push('📊 Ideal conditions for animal observation');
        break;
      case 'snow':
        recommendations.push('❄️ Snow! Keep animals warm indoors');
        recommendations.push('🔥 Check heating systems');
        recommendations.push('🍼 Provide extra feed for energy');
        break;
      case 'thunderstorm':
        recommendations.push('⛈️ Thunderstorm! Emergency protocols in effect');
        recommendations.push('⚡ Disconnect electrical equipment');
        recommendations.push('🚫 Keep all animals indoors');
        break;
      case 'fog':
        recommendations.push('🌫️ Foggy conditions - Low visibility');
        recommendations.push('🚜 Avoid vehicle operations');
        recommendations.push('🔊 Use sound to locate animals');
        break;
      case 'dust':
        recommendations.push('🌪️ Dusty conditions - Respiratory risk');
        recommendations.push('😷 Use masks when working outdoors');
        recommendations.push('💧 Lightly water dusty areas');
        break;
    }
    
    // Time-based recommendations
    const currentHour = new Date().getHours();
    if (currentHour >= 10 && currentHour <= 15 && weather.temperature > 30) {
      recommendations.push('🕐 Peak heat hours! Maximum supervision required');
    }
    
    return recommendations;
  }

  /**
   * Get weather alert level
   */
  getWeatherAlertLevel(weather: WeatherData): 'normal' | 'moderate' | 'high' | 'extreme' {
    // Extreme conditions
    if (weather.temperature > 40 || weather.temperature < 5) return 'extreme';
    if (weather.wind_speed > 50) return 'extreme';
    if (weather.rain_1h && weather.rain_1h > 20) return 'extreme';
    
    // High conditions
    if (weather.temperature > 35 || weather.temperature < 10) return 'high';
    if (weather.wind_speed > 35) return 'high';
    if (weather.rain_1h && weather.rain_1h > 10) return 'high';
    if (weather.humidity > 85 && weather.temperature > 30) return 'high';
    
    // Moderate conditions
    if (weather.temperature > 30 || weather.temperature < 15) return 'moderate';
    if (weather.wind_speed > 25) return 'moderate';
    if (weather.rain_1h && weather.rain_1h > 2) return 'moderate';
    if (weather.humidity > 75) return 'moderate';
    
    return 'normal';
  }

  /**
   * Save weather data to database
   */
  async saveWeatherData(data: Omit<WeatherData, 'id' | 'created_at' | 'updated_at'>): Promise<WeatherData> {
    const response = await fetch('/api/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save weather data');
    }
    
    return response.json();
  }

  /**
   * Get weather data from database
   */
  async getWeatherData(tenantId: string): Promise<WeatherData[]> {
    const response = await fetch('/api/weather?limit=10');
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const result = await response.json();
    return result.data || [];
  }
}

// Create singleton instance
export const professionalWeatherService = new ProfessionalWeatherService(process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '');

export default professionalWeatherService;
