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
  Moon,
  CloudMoon,
  CloudLightning,
  CloudSnow,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// WMO Weather interpretation codes (WW)
const getWeatherIcon = (code: number, isDay: boolean = true, className = 'w-6 h-6') => {
  // Clear sky
  if (code === 0) {
    return isDay ? (
      <Sun className={`${className} text-yellow-300`} />
    ) : (
      <Moon className={`${className} text-indigo-100`} />
    );
  }
  // Mainly clear, partly cloudy
  if (code >= 1 && code <= 2) {
    return isDay ? (
      <Cloud className={`${className} text-blue-100`} />
    ) : (
      <CloudMoon className={`${className} text-blue-200`} />
    );
  }
  // Overcast
  if (code === 3) return <Cloud className={`${className} text-gray-400`} />;
  // Fog
  if (code >= 45 && code <= 48) return <Cloud className={`${className} text-gray-300`} />;
  // Drizzle, Rain, Showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className={`${className} text-blue-400`} />;
  // Snow
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))
    return <CloudSnow className={`${className} text-white`} />;
  // Thunderstorm
  if (code >= 95 && code <= 99) return <CloudLightning className={`${className} text-yellow-400`} />;

  return isDay ? (
    <Sun className={`${className} text-yellow-300`} />
  ) : (
    <Moon className={`${className} text-indigo-100`} />
  );
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    data: weather,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['weather-current'],
    queryFn: async () => {
      const response = await fetch('/api/weather/current');

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
        location: data.location || 'Lahore, Pakistan',
        currentCode: current.weather_code,
        isDay: current.is_day === 1,
        forecast,
      };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
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
      className='group relative h-full min-h-[420px] overflow-hidden rounded-3xl p-8 text-white shadow-2xl transition-all duration-500 hover:shadow-blue-500/20'
    >
      {/* Dynamic Background with Gradient based on Day/Night */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={weather.isDay ? 'day' : 'night'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={`absolute inset-0 bg-gradient-to-br ${weather.isDay
              ? 'from-sky-400 via-blue-500 to-indigo-600'
              : 'from-slate-900 via-indigo-950 to-slate-900'
            } opacity-95 transition-all duration-1000 group-hover:opacity-100`}
        />
      </AnimatePresence>

      {/* Decorative Blur Circles */}
      <div className='animate-blob absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 opacity-30 mix-blend-overlay blur-3xl filter' />
      <div className='animate-blob animation-delay-2000 absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-400/20 opacity-30 mix-blend-overlay blur-3xl filter' />

      {/* Content */}
      <div className='relative z-10 flex h-full flex-col justify-between'>
        {/* Header: Location & Real-time Clock */}
        <motion.div variants={itemVariants} className='flex items-start justify-between'>
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-white/20'>
              <MapPin className='h-4 w-4 text-blue-200' />
              <span className='text-sm font-medium tracking-wide'>{weather.location}</span>
            </div>
            <div className='ml-1 text-[10px] uppercase tracking-[0.2em] text-white/50'>
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
          </div>

          <div className='flex flex-col items-end'>
            <div className='text-2xl font-light tracking-tight text-white'>
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </div>
            <div className='text-[10px] font-medium uppercase tracking-widest text-blue-200/60'>
              Local Time
            </div>
          </div>
        </motion.div>

        {/* Main Weather Display */}
        <motion.div variants={itemVariants} className='my-6 flex items-center justify-between'>
          <div className='flex flex-col'>
            <div className='relative'>
              <motion.h1
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
                className='bg-gradient-to-b from-white to-white/60 bg-clip-text text-8xl font-bold tracking-tighter text-transparent'
              >
                {weather.temp}°
              </motion.h1>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-2xl font-medium tracking-tight text-blue-50'>
                {weather.condition}
              </span>
              <div className='h-1 w-1 rounded-full bg-white/30' />
              <span className='text-sm text-white/60'>
                {weather.isDay ? 'Daytime' : 'Nighttime'}
              </span>
            </div>
          </div>

          <motion.div variants={iconFloat} animate='animate' className='relative'>
            <div className='absolute inset-0 scale-150 bg-blue-400/20 blur-3xl' />
            {/* Main Icon */}
            {getWeatherIcon(weather.currentCode, weather.isDay, 'h-24 w-24 drop-shadow-2xl')}
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className='mb-8 grid grid-cols-3 gap-4'>
          <div className='group/stat relative flex flex-col items-center gap-1 rounded-3xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10'>
            <Droplets className='h-5 w-5 text-blue-300' />
            <span className='mt-1 text-lg font-bold'>{weather.humidity}%</span>
            <span className='text-[9px] font-bold uppercase tracking-widest text-white/40'>
              Humidity
            </span>
          </div>

          <div className='group/stat relative flex flex-col items-center gap-1 rounded-3xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10'>
            <Wind className='h-5 w-5 text-blue-300' />
            <span className='mt-1 text-lg font-bold'>
              {weather.windSpeed} <span className='text-xs font-normal'>km/h</span>
            </span>
            <span className='text-[9px] font-bold uppercase tracking-widest text-white/40'>
              Wind
            </span>
          </div>

          <div className='group/stat relative flex flex-col items-center gap-1 rounded-3xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10'>
            <Thermometer className='h-5 w-5 text-blue-300' />
            <span className='mt-1 text-lg font-bold'>{weather.feelsLike}°</span>
            <span className='text-[9px] font-bold uppercase tracking-widest text-white/40'>
              Feels Like
            </span>
          </div>
        </motion.div>

        {/* 5-Day Forecast */}
        <motion.div
          variants={itemVariants}
          className='rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur-md'
        >
          <div className='flex items-center justify-between text-center'>
            {weather.forecast.map((day: any, i: number) => (
              <div key={i} className='group/day flex flex-col items-center gap-2'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-white/40'>
                  {day.day}
                </span>
                <div className='my-1 transition-transform duration-300 group-hover/day:scale-125'>
                  {getWeatherIcon(day.code, true, 'w-6 h-6')}
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-bold'>{day.high}°</span>
                  <span className='text-[10px] font-medium text-white/30'>{day.low}°</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
