'use client';

import { UserProfile } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { User, Shield, Key, Bell, Globe } from 'lucide-react';

export default function ProfilePage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='container mx-auto py-8'
        >
            <div className='mb-8'>
                <h1 className='text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400'>
                    User Profile
                </h1>
                <p className='text-gray-500 dark:text-slate-400'>
                    Manage your account settings and security preferences
                </p>
            </div>

            <div className='flex justify-center'>
                <UserProfile
                    path='/profile'
                    routing='path'
                    appearance={{
                        elements: {
                            rootBox: 'w-full shadow-none',
                            card: 'w-full shadow-xl border border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden',
                            navbar: 'border-r border-white/10 p-6',
                            navbarButton: 'rounded-xl transition-all hover:bg-white/50 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white',
                            navbarButton__active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            scrollBox: 'p-8',
                            pageScrollBox: 'p-8',
                            headerTitle: 'text-2xl font-bold dark:text-white',
                            headerSubtitle: 'text-gray-500 dark:text-slate-400',
                            profileSectionTitleText: 'text-lg font-semibold border-b border-white/10 pb-2 mb-4',
                            userPreviewMainIdentifier: 'text-gray-900 dark:text-white font-bold',
                            userPreviewSecondaryIdentifier: 'text-gray-500 dark:text-slate-400',
                        },
                    }}
                />
            </div>
        </motion.div>
    );
}
