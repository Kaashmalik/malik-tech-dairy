'use client';

import * as React from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
    trigger?: React.ReactNode;
    title?: string;
    description?: string;
}

export function Drawer({
    open,
    onOpenChange,
    children,
    className,
    title,
    description,
}: DrawerProps) {
    const controls = useAnimation();

    // Close when dragged down sufficiently
    const handleDragEnd = async (event: any, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 200) {
            onOpenChange(false);
        } else {
            controls.start({ y: 0 });
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer Content */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.05}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            'fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[85vh] flex-col rounded-t-[20px] bg-white shadow-2xl dark:bg-slate-900',
                            className
                        )}
                    >
                        {/* Handle for dragging */}
                        <div className="flex justify-center p-3">
                            <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-slate-700" />
                        </div>

                        {/* Header */}
                        {(title || description) && (
                            <div className="px-6 pb-4">
                                {title && (
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{description}</p>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 pb-8">{children}</div>

                        {/* Close Button (Optional, mostly for accessibility) */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-slate-800"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
