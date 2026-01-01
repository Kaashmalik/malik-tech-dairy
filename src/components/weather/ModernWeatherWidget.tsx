'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ModernWeatherWidget() {
  const [isClient, setIsClient] = useState(false);
  const [weather] = useState({
    temp: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    feelsLike: 30,
    location: 'Lahore, Pakistan',
    icon: 'partly-cloudy',
    forecast: [
      { day: 'Mon', high: 32, low: 22, icon: 'sun' },
      { day: 'Tue', high: 30, low: 21, icon: 'cloud' },
      { day: 'Wed', high: 28, low: 20, icon: 'rain' },
      { day: 'Thu', high: 31, low: 23, icon: 'partly-cloudy' },
      { day: 'Fri', high: 33, low: 24, icon: 'sun' },
    ],
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className='h-[420px] w-full animate-pulse rounded-3xl bg-white/10 backdrop-blur-lg' />
    );
  }

  const getWeatherIcon = (icon: string, className = 'w-6 h-6') => {
    switch (icon) {
      case 'sun':
        return <Sun className={`${className} text-yellow-300`} />;
      case 'cloud':
        return <Cloud className={`${className} text-blue-100`} />;
      case 'rain':
        return <CloudRain className={`${className} text-blue-200`} />;
      case 'partly-cloudy':
        return <Cloud className={`${className} text-blue-100`} />;
      default:
        return <Sun className={`${className} text-yellow-300`} />;
    }
  };

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
            {weather.icon === 'sun' ? (
              <Sun className='h-24 w-24 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]' />
            ) : weather.icon === 'rain' ? (
              <CloudRain className='h-24 w-24 text-blue-200 drop-shadow-lg' />
            ) : (
              <Cloud className='h-24 w-24 text-blue-100 drop-shadow-lg' />
            )}
          </motion.div>
        </motion.div>

        {/* Stats Grid - "No White Box", just nice text/icons */}
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
            {weather.forecast.map((day, i) => (
              <div key={i} className='flex flex-col items-center gap-2'>
                <span className='text-xs font-medium text-white/60'>{day.day}</span>
                <div className='my-1 transform transition-transform duration-200 hover:scale-110'>
                  {getWeatherIcon(day.icon, 'w-5 h-5')}
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
