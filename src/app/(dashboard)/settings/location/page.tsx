'use client';

import LocationSettings from '@/components/settings/LocationSettings';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

export default function LocationSettingsPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='container mx-auto space-y-6 py-6'
        >
            <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400'>
                    <MapPin className='h-6 w-6' />
                </div>
                <div>
                    <h1 className='text-3xl font-bold'>Farm Location</h1>
                    <p className='text-muted-foreground'>Configure your farm's geographic coordinates for weather data</p>
                </div>
            </div>

            <LocationSettings />
        </motion.div>
    );
}
