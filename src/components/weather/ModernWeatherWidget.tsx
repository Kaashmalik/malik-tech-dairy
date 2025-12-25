'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Thermometer, MapPin } from 'lucide-react';

export default function ModernWeatherWidget() {
  const [isClient, setIsClient] = useState(false);
  const [weather, setWeather] = useState({
    temp: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    feelsLike: 30,
    location: 'Lahore, Pakistan',
    icon: 'partly-cloudy',
    forecast: [
      { day: 'Mon', high: 32, low: 22, icon: 'sun' },
      { day: 'Tue', high: 30, low: 21, icon: 'cloud' },
      { day: 'Wed', high: 28, low: 20, icon: 'rain' },
      { day: 'Thu', high: 31, low: 23, icon: 'partly-cloudy' },
      { day: 'Fri', high: 33, low: 24, icon: 'sun' }
    ]
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  const getWeatherIcon = (icon) => {
    switch(icon) {
      case 'sun':
        return <Sun className="w-8 h-8 text-yellow-400" />;
      case 'cloud':
        return <Cloud className="w-8 h-8 text-gray-400" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-blue-400" />;
      case 'partly-cloudy':
        return <Cloud className="w-8 h-8 text-blue-300" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-400" />;
    }
  };

  const getForecastIcon = (icon) => {
    switch(icon) {
      case 'sun':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'cloud':
        return <Cloud className="w-5 h-5 text-gray-500" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'partly-cloudy':
        return <Cloud className="w-5 h-5 text-blue-400" />;
      default:
        return <Sun className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white opacity-5 rounded-full animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white opacity-5 rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10">
        {/* Location */}
        <div className="flex items-center gap-2 mb-6 opacity-90">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">{weather.location}</span>
        </div>

        {/* Current Weather */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="transform transition-transform duration-500 hover:rotate-12">
                {getWeatherIcon(weather.icon)}
              </div>
              <div>
                <div className="text-6xl font-bold mb-2">{weather.temp}°</div>
                <div className="text-lg opacity-90">{weather.condition}</div>
              </div>
            </div>
          </div>
          <div className="text-right opacity-90">
            <div className="flex items-center gap-1 text-sm mb-1">
              <Thermometer className="w-4 h-4" />
              <span>Feels like {weather.feelsLike}°</span>
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3 transform transition-all duration-300 hover:bg-opacity-30 hover:scale-105">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4" />
              <span className="text-xs opacity-90">Humidity</span>
            </div>
            <div className="text-xl font-semibold">{weather.humidity}%</div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3 transform transition-all duration-300 hover:bg-opacity-30 hover:scale-105">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="w-4 h-4" />
              <span className="text-xs opacity-90">Wind</span>
            </div>
            <div className="text-xl font-semibold">{weather.windSpeed} km/h</div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3 transform transition-all duration-300 hover:bg-opacity-30 hover:scale-105">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs opacity-90">Visibility</span>
            </div>
            <div className="text-xl font-semibold">{weather.visibility} km</div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="border-t border-white border-opacity-20 pt-6">
          <h3 className="text-sm font-semibold mb-4 opacity-90">5-Day Forecast</h3>
          <div className="flex justify-between">
            {weather.forecast.map((day, index) => (
              <div 
                key={index} 
                className="text-center transform transition-all duration-300 hover:scale-110 cursor-pointer"
              >
                <div className="text-xs opacity-90 mb-2">{day.day}</div>
                <div className="flex justify-center mb-2 transform transition-transform duration-300 hover:rotate-12">
                  {getForecastIcon(day.icon)}
                </div>
                <div className="text-xs">
                  <span className="font-semibold">{day.high}°</span>
                  <span className="opacity-70 ml-1">{day.low}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Update time */}
        <div className="mt-6 text-xs opacity-70 text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Glassmorphism effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white opacity-5 pointer-events-none"></div>
    </div>
  );
}
