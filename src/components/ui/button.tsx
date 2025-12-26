import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { motion, HTMLMotionProps } from 'framer-motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 duration-200',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-red-500/20',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // 2025 Modern Variants
        'neo-glass':
          'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-lg dark:bg-black/20 dark:hover:bg-black/30',
        'gradient-shine':
          'bg-gradient-to-r from-primary via-blue-500 to-primary text-primary-foreground bg-[length:200%_auto] hover:bg-[position:right_center] transition-[background-position] duration-500 shadow-lg hover:shadow-primary/30',
        magnetic:
          'bg-primary text-primary-foreground hover:bg-primary/90 relative overflow-hidden',
        subtle:
          'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
        xl: 'h-14 rounded-xl px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'ref'>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    // If asChild is true, we simply render the slot. 
    // Note: Framer Motion props might not be passed correctly through Slot if not handled carefully, 
    // but typically asChild is used with Tooltips or similar wrappers.
    const Comp = asChild ? Slot : motion.button;

    // For magnetic effect (simplified implementation) or just standard motion button
    const motionProps = asChild ? {} : {
      whileTap: { scale: 0.97 },
      transition: { type: "spring", stiffness: 400, damping: 17 }
    } as any; // Using any to bypass complex motion type conflicts with Slot

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...(!asChild ? motionProps : {})}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
