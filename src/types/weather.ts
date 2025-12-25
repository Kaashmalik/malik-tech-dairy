// Fix for TypeScript and hydration issues
import { Database } from '@/types/supabase';

// Define proper types for weather_data table
export interface WeatherDataRow {
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

// Define proper types for tenants table
export interface TenantRow {
  id: string;
  farm_name: string;
  farm_location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    address?: string;
    timezone?: string;
  };
  weather_enabled: boolean;
  weather_unit: 'metric' | 'imperial';
  created_at: string;
  updated_at: string;
}
