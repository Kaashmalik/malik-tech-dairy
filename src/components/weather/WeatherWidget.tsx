'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Thermometer, Gauge, Sunrise, Sunset } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import weatherService, { DEFAULT_PAKISTAN_CITIES, WeatherData } from '@/lib/weather/weather-service';

interface WeatherCardProps {
  weather: WeatherData;
  showRecommendations?: boolean;
}

function WeatherCard({ weather, showRecommendations = true }: WeatherCardProps) {
  const recommendations = weatherService.getFarmingRecommendations(weather);
  
  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '01d': <Sun className="h-8 w-8 text-yellow-500" />,
      '01n': <Sun className="h-8 w-8 text-yellow-300" />,
      '02d': <Cloud className="h-8 w-8 text-gray-400" />,
      '02n': <Cloud className="h-8 w-8 text-gray-600" />,
      '03d': <Cloud className="h-8 w-8 text-gray-500" />,
      '03n': <Cloud className="h-8 w-8 text-gray-600" />,
      '04d': <Cloud className="h-8 w-8 text-gray-600" />,
      '04n': <Cloud className="h-8 w-8 text-gray-700" />,
      '09d': <CloudRain className="h-8 w-8 text-blue-500" />,
      '09n': <CloudRain className="h-8 w-8 text-blue-600" />,
      '10d': <CloudRain className="h-8 w-8 text-blue-500" />,
      '10n': <CloudRain className="h-8 w-8 text-blue-600" />,
      '11d': <CloudRain className="h-8 w-8 text-purple-500" />,
      '11n': <CloudRain className="h-8 w-8 text-purple-600" />,
      '13d': <Cloud className="h-8 w-8 text-blue-200" />,
      '13n': <Cloud className="h-8 w-8 text-blue-300" />,
      '50d': <Wind className="h-8 w-8 text-gray-400" />,
      '50n': <Wind className="h-8 w-8 text-gray-500" />,
    };
    
    return iconMap[iconCode] || <Cloud className="h-8 w-8 text-gray-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{weather.city_name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {new Date(weather.data_timestamp).toLocaleTimeString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Weather */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getWeatherIcon(weather.weather_icon)}
              <div>
                <p className="text-2xl font-bold">{Math.round(weather.temperature)}°C</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {weather.weather_description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Feels like</p>
              <p className="text-lg font-semibold">{Math.round(weather.feels_like)}°C</p>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span>Humidity: {weather.humidity}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="h-4 w-4 text-gray-500" />
              <span>Wind: {Math.round(weather.wind_speed)} km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Gauge className="h-4 w-4 text-gray-500" />
              <span>Pressure: {weather.pressure} hPa</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-gray-500" />
              <span>Visibility: {weather.visibility ? Math.round(weather.visibility / 1000) : 'N/A'} km</span>
            </div>
            {weather.sunrise && (
              <div className="flex items-center space-x-2">
                <Sunrise className="h-4 w-4 text-orange-500" />
                <span>Sunrise: {new Date(weather.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {weather.sunset && (
              <div className="flex items-center space-x-2">
                <Sunset className="h-4 w-4 text-orange-600" />
                <span>Sunset: {new Date(weather.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>

          {/* Farming Recommendations */}
          {showRecommendations && recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-green-700">📋 Farming Recommendations:</p>
              <div className="space-y-1">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {rec}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WeatherWidget() {
  const [selectedCity, setSelectedCity] = useState('all');
  
  // Fetch weather data
  const { data: weatherData, isLoading, error, refetch } = useQuery({
    queryKey: ['weather', selectedCity],
    queryFn: async () => {
      const response = await fetch(`/api/weather${selectedCity !== 'all' ? `?city=${selectedCity}` : ''}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });

  // Get unique cities from data
  const uniqueCities = weatherData ? [...new Set(weatherData.map((w: WeatherData) => w.city_name))] : [];

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load weather data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Weather Forecast</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Tabs value={selectedCity} onValueChange={setSelectedCity}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Cities</TabsTrigger>
          <TabsTrigger value="Jatoi">Jatoi</TabsTrigger>
          <TabsTrigger value="Ali Pur">Ali Pur</TabsTrigger>
          <TabsTrigger value="Muzzafargarh">Muzzafargarh</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCity} className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-32" />
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : weatherData && weatherData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weatherData.map((weather: WeatherData) => (
                <WeatherCard key={weather.id} weather={weather} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No weather data available. Please add your OpenWeather API key to start fetching weather data.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add API Key Notice */}
      {!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY && (
        <Alert>
          <AlertDescription>
            To enable weather features, add your OpenWeather API key to your environment variables as NEXT_PUBLIC_OPENWEATHER_API_KEY.
            You can get a free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OpenWeatherMap</a>.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
