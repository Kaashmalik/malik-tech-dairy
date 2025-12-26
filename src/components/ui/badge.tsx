import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white hover:bg-destructive/90 shadow-sm',
        outline: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        glass: 'border-white/20 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 shadow-sm',
        soft: 'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        scale: 'hover:scale-105',
      }
    },
    defaultVariants: {
      variant: 'default',
      animation: 'none',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  withDot?: boolean; // Shows a status dot
  pulse?: boolean; // Adds a pulsing glow effect to the dot or badge
}

function Badge({
  className,
  variant,
  animation,
  asChild = false,
  withDot = false,
  pulse = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : motion.div;

  // Entrance animation properties
  const motionProps = !asChild ? {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring', stiffness: 500, damping: 25 }
  } : {};

  return (
    <Comp
      data-slot='badge'
      className={cn(badgeVariants({ variant, animation }), className)}
      {...(motionProps as any)}
      {...props}
    >
      {withDot && (
        <span className={cn(
          "relative flex h-2 w-2 mr-0.5",
          pulse && "after:absolute after:inline-flex after:h-full after:w-full after:animate-ping after:rounded-full after:bg-current after:opacity-75"
        )}>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current opacity-90"></span>
        </span>
      )}
      {props.children}
    </Comp>
  );
}

export { Badge, badgeVariants };
