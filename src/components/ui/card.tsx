import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'glass' | 'gradient' | 'neo' | 'ghost';
  hoverEffect?: 'none' | 'lift' | 'glow' | 'spotlight';
  noise?: boolean;
}>(
  ({ className, variant = 'default', hoverEffect = 'none', noise = false, ...props }, ref) => {

    // Base styles
    const baseStyles = "rounded-xl border shadow-sm transition-all duration-300";

    // Variant styles
    const variants = {
      default: "bg-card text-card-foreground",
      glass: "bg-white/10 backdrop-blur-md border-white/20 text-card-foreground shadow-lg dark:bg-black/20 dark:border-white/10",
      gradient: "bg-gradient-to-br from-card to-secondary/20 border-primary/10",
      neo: "bg-card shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.8)] dark:shadow-[5px_5px_10px_rgba(0,0,0,0.3),-5px_-5px_10px_rgba(255,255,255,0.05)] border-none",
      ghost: "border-none shadow-none bg-transparent"
    };

    // Hover styles
    const hoverStyles = {
      none: "",
      lift: "hover:-translate-y-1 hover:shadow-md",
      glow: "hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:border-primary/50",
      spotlight: "group relative overflow-hidden" // Requires children implementation for full effect, keeping simple for now
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          hoverStyles[hoverEffect],
          className
        )}
        {...props}
      >
        {noise && (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
          />
        )}
        <div className="relative z-10">
          {props.children}
        </div>
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

// Re-exporting GlassCard and AnimatedCard for backward compatibility but redirecting visually to new Card variants if needed, 
// or keeping them if they have unique logic.
// For this plan, we are consolidating, but let's keep the exports to avoid breaking changes.

import { GlassCard } from './glass-card';

const AnimatedCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="default"
      hoverEffect="lift"
      className={className}
      {...props}
    />
  )
);
AnimatedCard.displayName = 'AnimatedCard';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, GlassCard, AnimatedCard };

