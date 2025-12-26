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
            { day: 'Fri', high: 33, low: 24, icon: 'sun' }
        ]
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl h-[420px] w-full animate-pulse" />
        );
    }

    const getWeatherIcon = (icon: string, className = "w-6 h-6") => {
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
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const iconFloat = {
        animate: {
            y: [0, -10, 0],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="relative overflow-hidden rounded-3xl h-full min-h-[420px] text-white p-8 group"
        >
            {/* Dynamic Background with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Decorative Blur Circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full justify-between">

                {/* Header: Location & Date */}
                <motion.div variants={itemVariants} className="flex justify-between items-start">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                        <MapPin className="w-4 h-4 text-blue-200" />
                        <span className="text-sm font-medium tracking-wide">{weather.location}</span>
                    </div>
                    <div className="text-xs font-medium text-blue-100/80 uppercase tracking-widest">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                </motion.div>

                {/* Main Weather Display */}
                <motion.div variants={itemVariants} className="flex items-center justify-between my-6">
                    <div className="flex flex-col">
                        <motion.h1
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                            className="text-8xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
                        >
                            {weather.temp}°
                        </motion.h1>
                        <span className="text-xl font-medium text-blue-100 ml-1">{weather.condition}</span>
                    </div>

                    <motion.div
                        variants={iconFloat}
                        animate="animate"
                        className="relative"
                    >
                        {/* Main Icon */}
                        {weather.icon === 'sun' ? (
                            <Sun className="w-24 h-24 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
                        ) : weather.icon === 'rain' ? (
                            <CloudRain className="w-24 h-24 text-blue-200 drop-shadow-lg" />
                        ) : (
                            <Cloud className="w-24 h-24 text-blue-100 drop-shadow-lg" />
                        )}
                    </motion.div>
                </motion.div>

                {/* Stats Grid - "No White Box", just nice text/icons */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-3 gap-4 mb-8"
                >
                    <div className="flex flex-col items-center gap-1 group/stat">
                        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 group-hover/stat:bg-white/10 transition-colors">
                            <Droplets className="w-5 h-5 text-blue-200" />
                        </div>
                        <span className="text-lg font-semibold mt-1">{weather.humidity}%</span>
                        <span className="text-[10px] uppercase tracking-wider text-blue-100/70">Humidity</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group/stat">
                        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 group-hover/stat:bg-white/10 transition-colors">
                            <Wind className="w-5 h-5 text-blue-200" />
                        </div>
                        <span className="text-lg font-semibold mt-1">{weather.windSpeed} <span className="text-xs font-normal">km/h</span></span>
                        <span className="text-[10px] uppercase tracking-wider text-blue-100/70">Wind</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group/stat">
                        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 group-hover/stat:bg-white/10 transition-colors">
                            <Thermometer className="w-5 h-5 text-blue-200" />
                        </div>
                        <span className="text-lg font-semibold mt-1">{weather.feelsLike}°</span>
                        <span className="text-[10px] uppercase tracking-wider text-blue-100/70">Feels Like</span>
                    </div>
                </motion.div>

                {/* 5-Day Forecast */}
                <motion.div
                    variants={itemVariants}
                    className="bg-black/10 backdrop-blur-sm rounded-2xl p-4 border border-white/5"
                >
                    <div className="flex justify-between items-center text-center">
                        {weather.forecast.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <span className="text-xs font-medium text-white/60">{day.day}</span>
                                <div className="my-1 transform transition-transform hover:scale-110 duration-200">
                                    {getWeatherIcon(day.icon, "w-5 h-5")}
                                </div>
                                <span className="text-sm font-bold">{day.high}°</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
