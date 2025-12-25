// Weather API Service for MTK Dairy
// Integrates with OpenWeatherMap API

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

export interface PakistanCity {
  name: string;
  displayName: string;
  province: string;
  latitude: number;
  longitude: number;
  searchName: string;
}

// Default Pakistan cities for dairy farming
import { DEFAULT_PAKISTAN_CITIES } from './pakistan-cities';

class WeatherService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openweathermap.org/data/2.5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get current weather for a city
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
   * Get current weather by coordinates
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
  async getForecast(city: string): Promise<any> {
    const url = `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Transform OpenWeather data to our database format
   */
  transformWeatherData(data: OpenWeatherResponse, tenantId: string, cityDisplayName?: string): Omit<WeatherData, 'id' | 'created_at' | 'updated_at'> {
    return {
      tenant_id: tenantId,
      city_name: cityDisplayName || data.name,
      country: data.sys.country,
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
   * Get weather for multiple default cities
   */
  async getDefaultCitiesWeather(tenantId: string): Promise<Array<{ city: PakistanCity; weather: OpenWeatherResponse }>> {
    const results = [];
    
    for (const city of DEFAULT_PAKISTAN_CITIES) {
      try {
        // Use searchName for OpenWeather API, but keep displayName for display
        const weather = await this.getCurrentWeather(city.searchName || city.displayName);
        results.push({ city, weather });
      } catch (error) {
        console.error(`Failed to fetch weather for ${city.displayName}:`, error);
      }
    }
    
    return results;
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
  async getWeatherData(tenantId: string, city?: string): Promise<WeatherData[]> {
    const url = city ? `/api/weather?city=${city}` : '/api/weather';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const result = await response.json();
    return result.data || [];
  }

  /**
   * Get farming recommendations based on weather
   */
  getFarmingRecommendations(weather: WeatherData): string[] {
    const recommendations: string[] = [];
    
    // Temperature-based recommendations
    if (weather.temperature > 35) {
      recommendations.push('🌡️ High temperature! Ensure animals have access to shade and cool water');
      recommendations.push('💧 Increase water availability for livestock');
    } else if (weather.temperature < 10) {
      recommendations.push('🧥 Cold weather! Provide shelter and warm bedding for animals');
      recommendations.push('🌾 Consider increasing feed to maintain body temperature');
    }
    
    // Rain-based recommendations
    if (weather.rain_1h && weather.rain_1h > 5) {
      recommendations.push('🌧️ Heavy rain! Keep animals indoors and ensure drainage');
      recommendations.push('📅 Postpone outdoor activities until weather improves');
    }
    
    // Wind-based recommendations
    if (weather.wind_speed > 30) {
      recommendations.push('💨 Strong winds! Secure loose items and protect young animals');
    }
    
    // Humidity-based recommendations
    if (weather.humidity > 80) {
      recommendations.push('💦 High humidity! Watch for heat stress and ensure proper ventilation');
      recommendations.push('🦠 Check for signs of fungal infections in feed storage');
    }
    
    // General recommendations based on weather condition
    switch (weather.weather_main.toLowerCase()) {
      case 'rain':
      case 'drizzle':
        recommendations.push('☔ Rainy weather - perfect for indoor maintenance tasks');
        break;
      case 'clear':
        recommendations.push('☀️ Clear weather - ideal for grazing and outdoor activities');
        recommendations.push('🌾 Good day for hay making and feed drying');
        break;
      case 'clouds':
        recommendations.push('☁️ Cloudy weather - moderate conditions for most activities');
        break;
      case 'snow':
        recommendations.push('❄️ Snow! Keep animals warm and provide extra feed');
        break;
      case 'thunderstorm':
        recommendations.push('⛈️ Thunderstorm! Keep all animals indoors and secure equipment');
        break;
    }
    
    return recommendations;
  }
}

// Create singleton instance
export const weatherService = new WeatherService(process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '');

export default weatherService;
