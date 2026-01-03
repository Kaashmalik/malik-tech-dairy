'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// WMO Weather interpretation codes (WW)
const getWeatherIcon = (code: number, className = 'w-6 h-6') => {
  // Clear sky
  if (code === 0) return <Sun className={`${className} text-yellow-300`} />;
  // Mainly clear, partly cloudy, and overcast
  if (code >= 1 && code <= 3) return <Cloud className={`${className} text-blue-100`} />;
  // Fog
  if (code >= 45 && code <= 48) return <Cloud className={`${className} text-gray-300`} />;
  // Drizzle, Rain, Showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className={`${className} text-blue-200`} />;
  // Snow
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))
    return <Cloud className={`${className} text-white`} />;
  // Thunderstorm
  if (code >= 95 && code <= 99) return <CloudRain className={`${className} text-purple-200`} />;

  return <Sun className={`${className} text-yellow-300`} />;
};

const getWeatherCondition = (code: number) => {
  if (code === 0) return 'Sunny';
  if (code === 1) return 'Mainly Sunny';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Clear';
};

const getForecastIconName = (code: number) => {
  if (code === 0) return 'sun';
  if (code >= 1 && code <= 3) return 'cloud';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  return 'partly-cloudy';
};

export default function ModernWeatherWidget() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    data: weather,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['weather-lahore'],
    queryFn: async () => {
      // Lahore Coordinates
      const lat = 31.5497;
      const long = 74.3436;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();

      // Transform API data to our format
      const current = data.current;
      const daily = data.daily;

      // Generate forecast array
      const forecast = daily.time.slice(1, 6).map((date: string, index: number) => {
        const d = new Date(date);
        return {
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          high: Math.round(daily.temperature_2m_max[index + 1]),
          low: Math.round(daily.temperature_2m_min[index + 1]),
          icon: getForecastIconName(daily.weather_code[index + 1]),
          code: daily.weather_code[index + 1],
        };
      });

      return {
        temp: Math.round(current.temperature_2m),
        condition: getWeatherCondition(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        feelsLike: Math.round(current.apparent_temperature),
        location: 'Lahore, Pakistan',
        currentCode: current.weather_code, // Store raw code for main icon
        forecast,
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });

  if (!isClient) {
    return (
      <div className='h-full min-h-[420px] w-full animate-pulse rounded-3xl bg-white/10 backdrop-blur-lg' />
    );
  }

  if (isLoading) {
    return (
      <div className='flex h-full min-h-[420px] w-full items-center justify-center rounded-3xl bg-white/5 backdrop-blur-lg'>
        <Loader2 className='h-8 w-8 animate-spin text-white/50' />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className='flex h-full min-h-[420px] w-full flex-col items-center justify-center gap-2 rounded-3xl bg-white/5 p-6 text-center backdrop-blur-lg'>
        <AlertCircle className='h-8 w-8 text-rose-400' />
        <p className='text-sm text-white/70'>Weather data unavailable</p>
        <p className='text-xs text-white/40'>Please check your connection</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const iconFloat = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={containerVariants}
      className='group relative h-full min-h-[420px] overflow-hidden rounded-3xl p-8 text-white'
    >
      {/* Dynamic Background with Gradient */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-90 transition-opacity duration-500 group-hover:opacity-100' />

      {/* Decorative Blur Circles */}
      <div className='animate-blob absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-400 opacity-30 mix-blend-multiply blur-3xl filter' />
      <div className='animate-blob animation-delay-2000 absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-400 opacity-30 mix-blend-multiply blur-3xl filter' />

      {/* Content */}
      <div className='relative z-10 flex h-full flex-col justify-between'>
        {/* Header: Location & Date */}
        <motion.div variants={itemVariants} className='flex items-start justify-between'>
          <div className='flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md'>
            <MapPin className='h-4 w-4 text-blue-200' />
            <span className='text-sm font-medium tracking-wide'>{weather.location}</span>
          </div>
          <div className='text-xs font-medium uppercase tracking-widest text-blue-100/80'>
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
        </motion.div>

        {/* Main Weather Display */}
        <motion.div variants={itemVariants} className='my-6 flex items-center justify-between'>
          <div className='flex flex-col'>
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
              className='bg-gradient-to-b from-white to-white/60 bg-clip-text text-8xl font-bold tracking-tighter text-transparent'
            >
              {weather.temp}°
            </motion.h1>
            <span className='ml-1 text-xl font-medium text-blue-100'>{weather.condition}</span>
          </div>

          <motion.div variants={iconFloat} animate='animate' className='relative'>
            {/* Main Icon */}
            {getWeatherIcon(weather.currentCode, 'h-24 w-24 drop-shadow-lg')}
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className='mb-8 grid grid-cols-3 gap-4'>
          <div className='group/stat flex flex-col items-center gap-1'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-2.5 transition-colors group-hover/stat:bg-white/10'>
              <Droplets className='h-5 w-5 text-blue-200' />
            </div>
            <span className='mt-1 text-lg font-semibold'>{weather.humidity}%</span>
            <span className='text-[10px] uppercase tracking-wider text-blue-100/70'>Humidity</span>
          </div>

          <div className='group/stat flex flex-col items-center gap-1'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-2.5 transition-colors group-hover/stat:bg-white/10'>
              <Wind className='h-5 w-5 text-blue-200' />
            </div>
            <span className='mt-1 text-lg font-semibold'>
              {weather.windSpeed} <span className='text-xs font-normal'>km/h</span>
            </span>
            <span className='text-[10px] uppercase tracking-wider text-blue-100/70'>Wind</span>
          </div>

          <div className='group/stat flex flex-col items-center gap-1'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-2.5 transition-colors group-hover/stat:bg-white/10'>
              <Thermometer className='h-5 w-5 text-blue-200' />
            </div>
            <span className='mt-1 text-lg font-semibold'>{weather.feelsLike}°</span>
            <span className='text-[10px] uppercase tracking-wider text-blue-100/70'>
              Feels Like
            </span>
          </div>
        </motion.div>

        {/* 5-Day Forecast */}
        <motion.div
          variants={itemVariants}
          className='rounded-2xl border border-white/5 bg-black/10 p-4 backdrop-blur-sm'
        >
          <div className='flex items-center justify-between text-center'>
            {weather.forecast.map((day: any, i: number) => (
              <div key={i} className='flex flex-col items-center gap-2'>
                <span className='text-xs font-medium text-white/60'>{day.day}</span>
                <div className='my-1 transform transition-transform duration-200 hover:scale-110'>
                  {getWeatherIcon(day.code, 'w-5 h-5')}
                </div>
                <span className='text-sm font-bold'>{day.high}°</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
