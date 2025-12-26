'use client';

import { motion, AnimatePresence, HTMLMotionProps, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

// Standard 2025 Motion Variants
export const motionVariants = {
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    },
    fadeInUp: {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    },
    fadeInDown: {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    },
    fadeInLeft: {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    },
    fadeInRight: {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    },
    scaleIn: {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    },
    staggerContainer: {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    },
};

interface MotionWrapperProps extends HTMLMotionProps<'div'> {
    delay?: number;
    duration?: number;
    variant?: keyof typeof motionVariants;
    stagger?: boolean; // If true, acts as a container for staggering children
}

export function MotionWrapper({
    children,
    className,
    delay = 0,
    duration = 0.5,
    variant = 'fadeInUp',
    stagger = false,
    ...props
}: MotionWrapperProps) {
    const selectedVariant = stagger ? motionVariants.staggerContainer : motionVariants[variant];

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={selectedVariant as Variants}
            transition={{ delay, duration }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={cn('w-full', className)}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

// Staggered List Item Wrapper
export function MotionItem({ children, className, ...props }: HTMLMotionProps<'div'>) {
    return (
        <motion.div
            variants={motionVariants.fadeInUp}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}
