import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';

const inputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        filled: 'bg-muted/50 border-transparent hover:bg-muted/80 focus-visible:bg-background',
        ghost: 'border-none shadow-none bg-transparent hover:bg-muted/30 focus-visible:bg-transparent',
        neo: 'shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-none bg-background',
        'bottom-line': 'rounded-none border-x-0 border-t-0 border-b-2 px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary',
      },
      inputSize: {
        default: 'h-10',
        sm: 'h-8 text-xs',
        lg: 'h-12 text-base px-4 icon:h-6 icon:w-6',
      },
      state: {
        default: 'border-input',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      }
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
      state: 'default'
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, state, type, startIcon, endIcon, containerClassName, ...props }, ref) => {

    // Determine the effective state if not explicitly passed
    const effectiveState = state;

    return (
      <div className={cn('relative flex items-center w-full', containerClassName)}>
        {startIcon && (
          <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center justify-center">
            {startIcon}
          </div>
        )}

        <input
          type={type}
          className={cn(
            inputVariants({ variant, inputSize, state: effectiveState, className }),
            startIcon ? 'pl-10' : '',
            endIcon ? 'pr-10' : ''
          )}
          ref={ref}
          {...props}
        />

        {endIcon && (
          <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center justify-center">
            {endIcon}
          </div>
        )}

        {/* Animated bottom border for 'bottom-line' variant or generic focus effect if desired */}
        {variant === 'default' && (
          <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-primary transition-all duration-300 group-focus-within:w-full" />
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
