import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
    gradient?: boolean;
    intensity?: 'low' | 'medium' | 'high';
}

export function GlassCard({
    children,
    className,
    hoverEffect = false,
    gradient = false,
    intensity = 'medium',
    ...props
}: GlassCardProps) {
    const intensityMap = {
        low: 'backdrop-blur-sm bg-white/40 dark:bg-black/20',
        medium: 'backdrop-blur-md bg-white/60 dark:bg-black/40',
        high: 'backdrop-blur-xl bg-white/80 dark:bg-black/60',
    };

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border border-white/20 shadow-lg transition-all duration-300',
                intensityMap[intensity],
                hoverEffect && 'hover:-translate-y-1 hover:shadow-xl hover:border-white/40 group cursor-pointer',
                gradient && 'bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-900/60 dark:to-slate-900/30',
                className
            )}
            {...props}
        >
            {hoverEffect && (
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:via-white/5" />
            )}
            {children}
        </div>
    );
}
