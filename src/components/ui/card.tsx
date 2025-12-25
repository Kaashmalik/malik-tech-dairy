import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)}
      {...props}
    />
  )
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

// GlassCard - Modern 2025 glassmorphism variant
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: 'light' | 'medium' | 'heavy';
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, blur = 'md', intensity = 'medium', ...props }, ref) => {
    const blurVariants = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    };
    
    const intensityVariants = {
      light: 'bg-white/5 dark:bg-white/5 border-white/10',
      medium: 'bg-white/10 dark:bg-white/10 border-white/20',
      heavy: 'bg-white/20 dark:bg-white/15 border-white/30',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border shadow-lg transition-all duration-300',
          'hover:shadow-xl hover:border-white/30',
          blurVariants[blur],
          intensityVariants[intensity],
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = 'GlassCard';

// AnimatedCard - Card with hover animation
const AnimatedCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card text-card-foreground rounded-lg border shadow-sm',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:-translate-y-1',
        className
      )}
      {...props}
    />
  )
);
AnimatedCard.displayName = 'AnimatedCard';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, GlassCard, AnimatedCard };

